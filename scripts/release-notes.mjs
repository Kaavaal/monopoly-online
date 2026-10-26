// `pnpm release:notes [--version X.Y.Z]`: drafts the next section of docs/CHANGELOG.md through a Claude Agent
// SDK run. Plain code fences the run: the range, the commits and the version are fixed before it starts, the
// agent may only read git and edit the changelog, and its JSON is checked against git and the file after it.
// The result is an uncommitted change to docs/CHANGELOG.md; review it, then commit and tag by hand.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { query } from '@anthropic-ai/claude-agent-sdk';

// Sorting commit subjects into four groups needs no heavy reasoning; the cheapest current model does it.
const MODEL = 'claude-haiku-5-5';
const MAX_TURNS = 8;
const MAX_BUDGET_USD = 0.25;
const TIMEOUT_MS = 180_000;

const CHANGELOG = 'docs/CHANGELOG.md';

// Without `tools` the session also gets every other built-in tool, several of which run without approval.
const TOOLS = ['Bash', 'Read', 'Edit'];
const ALLOWED_TOOLS = [
  'Bash(git log --no-merges *)',
  'Bash(git show --stat *)',
  `Read(${CHANGELOG})`,
  `Edit(${CHANGELOG})`,
];
// Reads inside the repo need no approval, so these deny rules fence the Read tool; the Bash hook fences git.
const DISALLOWED_TOOLS = ['Read(.env)', 'Read(.env.*)', 'Read(*.pem)', 'Read(**/credentials*)'];

const SHA = { type: 'string', pattern: '^[0-9a-f]{7,40}$' };
const SCHEMA = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    previous: { type: 'string' },
    entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['added', 'changed', 'fixed', 'internal'] },
          summary: { type: 'string', minLength: 1, maxLength: 90 },
          commits: { type: 'array', minItems: 1, items: SHA },
        },
        required: ['type', 'summary', 'commits'],
        additionalProperties: false,
      },
    },
  },
  required: ['version', 'previous', 'entries'],
  additionalProperties: false,
};

const GROUPS = [
  ['added', 'Added'],
  ['changed', 'Changed'],
  ['fixed', 'Fixed'],
  ['internal', 'Internal'],
];

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** Next version after tag `vX.Y.Z`: any `feat` commit bumps the minor, anything else the patch. */
export function nextVersion(previousTag, subjects) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(previousTag);
  if (!match) return null;
  const [major, minor, patch] = match.slice(1).map(Number);
  return subjects.some((subject) => /^feat(\([^)]*\))?!?:/.test(subject))
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;
}

/**
 * Prefix rules match the command as written and `git show` prints any blob (`git show HEAD:.env`), so the
 * PreToolUse hook lets through only the two commands the prompt names, for this range and its commits.
 */
export function bashRefusal(command, { range, commits }) {
  const plain = command.replace(/['"\\]/g, '').trim().replace(/\s+/g, ' ');
  if (plain === `git log --no-merges --format=%h %s ${range}`) return null;
  const shas = plain.match(/^git show --stat((?: [0-9a-f]{7,40})+)$/)?.[1]?.trim().split(' ');
  if (shas?.every((sha) => commits.some((commit) => commit.sha.startsWith(sha)))) return null;
  return `only \`git log --no-merges --format='%h %s' ${range}\` and \`git show --stat <sha>...\` of its commits may run`;
}

/** Only a `success` result that carries the schema-checked JSON counts as an answer. */
export function resultOutcome(result) {
  if (!result) return { ok: false, reason: 'the run ended without a result message' };
  if (result.is_error || result.subtype !== 'success') {
    const detail = result.subtype === 'success' ? result.result : result.errors?.join('; ');
    return { ok: false, reason: `${result.subtype}, is_error=${result.is_error}: ${detail || 'no detail'}` };
  }
  if (result.structured_output == null) return { ok: false, reason: 'success without structured_output' };
  return { ok: true, payload: result.structured_output };
}

/**
 * Re-checks the payload against SCHEMA after the run instead of trusting the SDK alone. Covers exactly the
 * keywords SCHEMA uses; returns one line per problem, empty when the payload fits.
 */
export function validatePayload(value, schema = SCHEMA, path = '$') {
  const kind = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  if (kind !== schema.type) return [`${path} is ${kind}, expected ${schema.type}`];
  const problems = [];
  if (kind === 'string') {
    if (schema.enum && !schema.enum.includes(value)) problems.push(`${path} is not one of ${schema.enum.join('|')}`);
    if (schema.minLength !== undefined && value.length < schema.minLength)
      problems.push(`${path} is shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength)
      problems.push(`${path} is ${value.length} chars, max ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value))
      problems.push(`${path} does not match ${schema.pattern}`);
  }
  if (kind === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      problems.push(`${path} has ${value.length} items, min ${schema.minItems}`);
    value.forEach((item, i) => problems.push(...validatePayload(item, schema.items, `${path}[${i}]`)));
  }
  if (kind === 'object') {
    for (const key of schema.required) if (!(key in value)) problems.push(`${path}.${key} is missing`);
    for (const [key, item] of Object.entries(value)) {
      if (key in schema.properties) problems.push(...validatePayload(item, schema.properties[key], `${path}.${key}`));
      else problems.push(`${path}.${key} is not allowed`);
    }
  }
  return problems;
}

/**
 * Checks a schema-valid payload against git and the changelog text; returns every mismatch. Each commit of the
 * range is filed exactly once, and the new section sits under `## Unreleased` holding every summary.
 */
export function verifyNotes(payload, { version, previous, date, commits, changelog }) {
  const problems = [];
  if (payload.version !== version) problems.push(`version is ${payload.version}, expected ${version}`);
  if (payload.previous !== previous) problems.push(`previous is ${payload.previous}, expected ${previous}`);

  const filed = payload.entries.flatMap((entry) => entry.commits);
  for (const sha of filed) {
    const matches = commits.filter((commit) => commit.sha.startsWith(sha)).length;
    if (matches === 0) problems.push(`${sha} is not a commit of ${previous}..HEAD`);
    if (matches > 1) problems.push(`${sha} is ambiguous in ${previous}..HEAD`);
  }
  for (const commit of commits) {
    const times = filed.filter((sha) => commit.sha.startsWith(sha)).length;
    if (times !== 1)
      problems.push(`${commit.sha.slice(0, 7)} "${commit.subject}" is filed ${times} times, expected once`);
  }

  const lines = changelog.split('\n');
  const heading = `## [${version}] - ${date}`;
  const start = lines.indexOf(heading);
  if (start === -1) {
    problems.push(`${CHANGELOG} has no line "${heading}"`);
    return problems;
  }
  const unreleased = lines.indexOf('## Unreleased');
  if (unreleased === -1 || unreleased > start) problems.push(`"${heading}" is not under "## Unreleased"`);
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  const section = lines.slice(start, end === -1 ? undefined : end).join('\n');
  for (const { summary } of payload.entries) {
    if (!section.includes(summary)) problems.push(`"${heading}" does not hold "${summary}"`);
  }
  return problems;
}

function buildPrompt({ version, previous, range, date, commits }) {
  const list = commits.map((commit) => `  ${commit.sha.slice(0, 7)} ${commit.subject}`).join('\n');
  const groups = GROUPS.map(([, title]) => `### ${title}\n\n- <summary> (<sha>, <sha>)`).join('\n\n');
  return `Add the release notes for version ${version} of this project to ${CHANGELOG}.

Facts the release script has already checked:
- Previous release: tag ${previous}. Range: ${range}, merge commits left out, ${commits.length} commits.
- New version: ${version}. Release date: ${date}.
- The commits (short sha, subject):
${list}

Steps:
1. If a subject alone does not tell what changed, run \`git show --stat <sha> [<sha>...]\` for those commits.
   \`git log --no-merges --format='%h %s' ${range}\` prints the list above again. No other command runs.
2. Sort the commits into entries. An entry is one change worth a line; several commits may share it, and
   every commit of the range belongs to exactly one entry. Types:
   - added: something new a user of the backend can do (most \`feat\` commits)
   - changed: existing behaviour that now works differently
   - fixed: a bug that is gone (most \`fix\` commits)
   - internal: tooling, CI, tests, docs, dependencies, refactors with no visible effect
3. Read ${CHANGELOG} and insert this section right below the line \`## Unreleased\`, keeping that line and
   everything after it as it is, with one blank line around each heading:

## [${version}] - ${date}

${groups}

   Leave out a group that has no entries.
4. Return the JSON the schema asks for: version "${version}", previous "${previous}", and the entries exactly
   as they appear in the file.

Rules:
- summary is a plain English phrase of what changed, at most 90 characters, without the commit type prefix.
- Use the 7-character shas listed above.
- Edit only ${CHANGELOG}. Do not commit, tag or push.`;
}

const guardBash = (facts) => async (input) => {
  const reason = bashRefusal(input.tool_input.command, facts);
  if (!reason) return {};
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
};

function logToolCalls(message) {
  for (const block of message.message.content) {
    if (block.type !== 'tool_use') continue;
    const detail = block.input.command ?? block.input.file_path ?? '';
    console.error(`[tool] ${block.name} ${String(detail).split('\n')[0].slice(0, 110)}`);
  }
}

function fail(reason) {
  console.error(`[error] ${reason}`);
  return 1;
}

async function main() {
  const { values } = parseArgs({ options: { version: { type: 'string' } } });
  const root = git('rev-parse', '--show-toplevel');

  let previous;
  try {
    previous = git('describe', '--tags', '--abbrev=0', '--match', 'v*');
  } catch {
    return fail('no v* tag reachable from HEAD, so there is no range to describe; tag the last release first');
  }
  const range = `${previous}..HEAD`;
  const commits = git('log', '--no-merges', '--format=%H%x09%s', range)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha = '', ...subject] = line.split('\t');
      return { sha, subject: subject.join('\t') };
    });
  if (!commits.length) {
    console.error(`[pre-check] ${range} has no commits, nothing to release`);
    return 0;
  }

  const version = values.version ?? nextVersion(previous, commits.map((commit) => commit.subject));
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    return fail(`need a version X.Y.Z, got ${version ?? `none (${previous} is not vX.Y.Z)`}; pass --version`);
  }
  const date = new Date().toISOString().slice(0, 10);

  const file = `${root}/${CHANGELOG}`;
  if (!existsSync(file)) return fail(`${CHANGELOG} does not exist`);
  if (git('status', '--porcelain', '--', CHANGELOG))
    return fail(`${CHANGELOG} has uncommitted changes; commit or restore them first`);
  const before = readFileSync(file, 'utf8');
  if (before.split('\n').some((line) => line.startsWith(`## [${version}]`)))
    return fail(`${CHANGELOG} already has a ## [${version}] section`);
  if (!before.split('\n').includes('## Unreleased')) return fail(`${CHANGELOG} has no "## Unreleased" line`);

  console.error(`[pre-check] ${range}: ${commits.length} commits, version ${version}, date ${date}`);
  console.error(
    `[agent] model=${MODEL} maxTurns=${MAX_TURNS} maxBudgetUsd=${MAX_BUDGET_USD} timeout=${TIMEOUT_MS / 1000}s`,
  );
  console.error(`[agent] tools ${TOOLS.join(', ')}; allow ${ALLOWED_TOOLS.join(', ')}`);
  console.error(`[agent] deny ${DISALLOWED_TOOLS.join(', ')}; Bash past the hook: this range's git log, git show --stat`);

  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), TIMEOUT_MS);
  let result;
  try {
    for await (const message of query({
      prompt: buildPrompt({ version, previous, range, date, commits }),
      options: {
        cwd: root,
        model: MODEL,
        maxTurns: MAX_TURNS,
        maxBudgetUsd: MAX_BUDGET_USD,
        tools: TOOLS,
        allowedTools: ALLOWED_TOOLS,
        disallowedTools: DISALLOWED_TOOLS,
        hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [guardBash({ range, commits })] }] },
        // A call that would ask for approval is denied: nobody is there to answer.
        permissionMode: 'dontAsk',
        // No user, project or local settings: a developer's own allow rules must not widen the fence.
        settingSources: [],
        // A claude.ai login also brings its connectors; none of them belongs in this run.
        strictMcpConfig: true,
        outputFormat: { type: 'json_schema', schema: SCHEMA },
        abortController,
      },
    })) {
      if (message.type === 'assistant' && !message.parent_tool_use_id) logToolCalls(message);
      if (message.type === 'result') result = message;
    }
  } catch (error) {
    // query() also throws after yielding an error result; that result is judged below.
    if (!result) {
      return fail(abortController.signal.aborted ? `timed out after ${TIMEOUT_MS / 1000}s` : String(error));
    }
  } finally {
    clearTimeout(timer);
  }

  if (result) {
    console.error(
      `[claude] cost=$${result.total_cost_usd} duration=${result.duration_ms}ms turns=${result.num_turns} ` +
        `subtype=${result.subtype} is_error=${result.is_error} denied=${result.permission_denials.length}`,
    );
    for (const denial of result.permission_denials) {
      console.error(`[denied] ${denial.tool_name} ${JSON.stringify(denial.tool_input).slice(0, 110)}`);
    }
  }
  const outcome = resultOutcome(result);
  if (!outcome.ok) return fail(outcome.reason);
  console.log(JSON.stringify(outcome.payload, null, 2));

  const schemaProblems = validatePayload(outcome.payload);
  if (schemaProblems.length) {
    console.error('[verify] the payload does not fit the schema:');
    for (const problem of schemaProblems) console.error(`  - ${problem}`);
    return 2;
  }
  console.error('[verify] schema OK');

  const changelog = readFileSync(file, 'utf8');
  const problems = verifyNotes(outcome.payload, { version, previous, date, commits, changelog });
  if (problems.length) {
    console.error('[verify] the notes do not match git:');
    for (const problem of problems) console.error(`  - ${problem}`);
    return 2;
  }
  console.error(`[verify] all ${commits.length} commits of ${range} filed once; ## [${version}] holds every summary`);
  console.error(`[done] ${CHANGELOG} changed in the working tree; review with \`git diff\`, nothing committed`);
  return 0;
}

if (import.meta.main) process.exitCode = await main();
