import { describe, expect, it } from 'vitest';

import {
  bashRefusal,
  nextVersion,
  resultOutcome,
  validatePayload,
  verifyNotes,
} from '../../scripts/release-notes.mjs';

/**
 * The plain-code fence around the release-notes agent (`scripts/release-notes.mjs`). Pure functions only: no
 * git, no file system, no live run. The range below is made up: three commits after v0.1.0.
 */

const COMMITS = [
  { sha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678', subject: 'feat(lobby): create player' },
  { sha: 'b2c3d4e5f60718293a4b5c6d7e8f901234567890', subject: 'fix(lobby): reject empty player names' },
  { sha: 'c3d4e5f60718293a4b5c6d7e8f90123456789012', subject: 'ci: run pnpm check on pull requests' },
];
const RANGE = { range: 'v0.1.0..HEAD', commits: COMMITS };

const PAYLOAD = {
  version: '0.2.0',
  previous: 'v0.1.0',
  entries: [
    { type: 'added', summary: 'Players can join the lobby by name', commits: ['a1b2c3d'] },
    { type: 'fixed', summary: 'An empty player name is rejected', commits: ['b2c3d4e'] },
    { type: 'internal', summary: 'CI runs the full check on every pull request', commits: ['c3d4e5f'] },
  ],
};

const BEFORE = `# Changelog

## Unreleased

## [0.1.0] - 2026-10-01

### Added

- Project skeleton
`;

const SECTION = `## [0.2.0] - 2026-10-26

### Added

- Players can join the lobby by name (a1b2c3d)

### Fixed

- An empty player name is rejected (b2c3d4e)

### Internal

- CI runs the full check on every pull request (c3d4e5f)
`;

const CHANGELOG = `# Changelog

## Unreleased

## [0.2.0] - 2026-10-26

### Added

- Players can join the lobby by name (a1b2c3d)

### Fixed

- An empty player name is rejected (b2c3d4e)

### Internal

- CI runs the full check on every pull request (c3d4e5f)

## [0.1.0] - 2026-10-01

### Added

- Project skeleton
`;

const FACTS = {
  version: '0.2.0',
  previous: 'v0.1.0',
  date: '2026-10-26',
  commits: COMMITS,
  before: BEFORE,
  changelog: CHANGELOG,
};

const withEntries = (entries: unknown[]) => ({ ...PAYLOAD, entries });

describe('nextVersion', () => {
  it('bumps the minor when any commit is a feat, in any case', () => {
    expect(nextVersion('v0.1.0', ['fix: a', 'feat(lobby): b'])).toBe('0.2.0');
    expect(nextVersion('v1.4.2', ['feat(bank): c'])).toBe('1.5.0');
    expect(nextVersion('v0.1.3', ['Feat: c'])).toBe('0.2.0');
  });

  it('bumps the major on a breaking commit of any type, the minor before 1.0', () => {
    expect(nextVersion('v1.4.2', ['feat!: drop the old api'])).toBe('2.0.0');
    expect(nextVersion('v1.3.1', ['refactor!: drop api'])).toBe('2.0.0');
    expect(nextVersion('v0.3.1', ['fix(bank)!: drop field'])).toBe('0.4.0');
  });

  it('bumps the patch otherwise', () => {
    expect(nextVersion('v0.1.0', ['fix(bank): a', 'chore: b', 'ci: c'])).toBe('0.1.1');
    expect(nextVersion('v0.1.0', ['feature: not a conventional feat'])).toBe('0.1.1');
  });

  it('gives up on a tag that is not vX.Y.Z', () => {
    expect(nextVersion('v0.1', ['fix: a'])).toBeNull();
    expect(nextVersion('vnext', ['fix: a'])).toBeNull();
  });
});

describe('bashRefusal', () => {
  it("admits the range's git log, quoted or not", () => {
    expect(bashRefusal("git log --no-merges --format='%h %s' v0.1.0..HEAD", RANGE)).toBeNull();
    expect(bashRefusal('git log --no-merges --format="%h %s"   v0.1.0..HEAD', RANGE)).toBeNull();
  });

  it('admits git show --stat of commits in the range, short or full', () => {
    expect(bashRefusal('git show --stat a1b2c3d', RANGE)).toBeNull();
    expect(bashRefusal(`git show --stat a1b2c3d ${COMMITS[2]?.sha}`, RANGE)).toBeNull();
  });

  it('refuses any other git log', () => {
    expect(bashRefusal("git log --no-merges --format='%h %s' v0.0.1..HEAD", RANGE)).toMatch(/only/);
    expect(bashRefusal('git log -p v0.1.0..HEAD', RANGE)).toMatch(/only/);
    expect(bashRefusal("git log --no-merges --format='%h %s' v0.1.0..HEAD --output=x", RANGE)).toMatch(/only/);
  });

  it('refuses git show of other commits, blobs or with more after it', () => {
    expect(bashRefusal('git show --stat d4e5f60', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat a1b2c3d:.env', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show a1b2c3d', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat a1b2c3d && cat .env', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat', RANGE)).toMatch(/only/);
  });

  it('refuses quotes that move the range into another word', () => {
    expect(bashRefusal("git log --no-merges '--format=%h %s v0.1.0..HEAD'", RANGE)).toMatch(/only/);
    expect(bashRefusal('git log --no-merges --format=%h %s v0.1.0..HEAD', RANGE)).toMatch(/only/);
    expect(bashRefusal("git log --no-merges --format='%h %s v0.1.0..HEAD", RANGE)).toMatch(/only/);
  });

  it('refuses newlines and anything else the shell acts on', () => {
    expect(bashRefusal('git show --stat a1b2c3d\na1b2c3d', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat a1b2c3d\\\na1b2c3d', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat a1b2c3d; touch pwned', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat $(echo a1b2c3d)', RANGE)).toMatch(/only/);
    expect(bashRefusal('git show --stat a1b2c3d b2c3d4e', RANGE)).toMatch(/only/);
    const tagged = { range: 'v0.2.0;touch${IFS}pwned..HEAD', commits: COMMITS };
    expect(bashRefusal("git log --no-merges --format='%h %s' v0.2.0;touch${IFS}pwned..HEAD", tagged)).toMatch(/only/);
  });

  it('refuses everything else', () => {
    expect(bashRefusal('git commit -am notes', RANGE)).toMatch(/only/);
    expect(bashRefusal('git push', RANGE)).toMatch(/only/);
    expect(bashRefusal('cat docs/CHANGELOG.md', RANGE)).toMatch(/only/);
  });
});

describe('resultOutcome', () => {
  it('fails without a result message', () => {
    expect(resultOutcome(undefined)).toEqual({ ok: false, reason: 'the run ended without a result message' });
  });

  it('fails on an error subtype and keeps its errors', () => {
    const outcome = resultOutcome({ subtype: 'error_max_turns', is_error: true, errors: ['8 turns used'] });
    expect(outcome).toEqual({ ok: false, reason: 'error_max_turns, is_error=true: 8 turns used' });
  });

  it('fails on a success flagged as an error', () => {
    const outcome = resultOutcome({ subtype: 'success', is_error: true, result: 'API error' });
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toMatch(/API error/);
  });

  it('fails on a success without structured_output', () => {
    expect(resultOutcome({ subtype: 'success', is_error: false, result: 'done' })).toEqual({
      ok: false,
      reason: 'success without structured_output',
    });
  });

  it('passes the structured_output of a success through', () => {
    expect(resultOutcome({ subtype: 'success', is_error: false, structured_output: PAYLOAD })).toEqual({
      ok: true,
      payload: PAYLOAD,
    });
  });
});

describe('validatePayload', () => {
  it('accepts a payload that fits the schema', () => {
    expect(validatePayload(PAYLOAD)).toEqual([]);
  });

  it('rejects a payload that is not an object', () => {
    expect(validatePayload(null)).toEqual(['$ is null, expected object']);
    expect(validatePayload([])).toEqual(['$ is array, expected object']);
  });

  it('rejects missing and unknown keys at every level', () => {
    expect(validatePayload({ version: '0.2.0', entries: [], notes: 'x' })).toEqual([
      '$.previous is missing',
      '$.notes is not allowed',
    ]);
    expect(validatePayload(withEntries([{ type: 'added', summary: 'x', commits: ['a1b2c3d'], sha: 'a' }]))).toEqual([
      '$.entries[0].sha is not allowed',
    ]);
  });

  it('rejects an unknown type, a long or empty summary and a bad sha', () => {
    const entries = [
      { type: 'security', summary: 'x', commits: ['a1b2c3d'] },
      { type: 'added', summary: 'y'.repeat(91), commits: ['a1b2c3d'] },
      { type: 'added', summary: '', commits: ['A1B2C3D'] },
      { type: 'added', summary: 'z', commits: ['a1b2c3'] },
      { type: 'added', summary: 'w', commits: [] },
      { type: 'added', summary: 7, commits: 'a1b2c3d' },
    ];
    expect(validatePayload(withEntries(entries))).toEqual([
      '$.entries[0].type is not one of added|changed|fixed|internal',
      '$.entries[1].summary is 91 chars, max 90',
      '$.entries[2].summary is shorter than 1',
      '$.entries[2].commits[0] does not match ^[0-9a-f]{7,40}$',
      '$.entries[3].commits[0] does not match ^[0-9a-f]{7,40}$',
      '$.entries[4].commits has 0 items, min 1',
      '$.entries[5].summary is number, expected string',
      '$.entries[5].commits is string, expected array',
    ]);
  });

  it('accepts a summary of exactly 90 characters', () => {
    expect(validatePayload(withEntries([{ type: 'changed', summary: 'y'.repeat(90), commits: ['a1b2c3d'] }]))).toEqual(
      [],
    );
  });
});

describe('verifyNotes', () => {
  it('passes notes that match git and the file', () => {
    expect(verifyNotes(PAYLOAD, FACTS)).toEqual([]);
  });

  it('flags a wrong version or previous', () => {
    expect(verifyNotes({ ...PAYLOAD, version: '0.1.1', previous: 'v0.0.9' }, FACTS)).toEqual([
      'version is 0.1.1, expected 0.2.0',
      'previous is v0.0.9, expected v0.1.0',
    ]);
  });

  it('flags a commit filed twice, a missing commit and an unknown sha', () => {
    const entries = [
      { type: 'added', summary: 'Players can join the lobby by name', commits: ['a1b2c3d', 'd4e5f60'] },
      { type: 'fixed', summary: 'An empty player name is rejected', commits: ['b2c3d4e', 'a1b2c3d4e5f6'] },
    ];
    // The changelog no longer matches these entries either; only the git checks, which come first, matter here.
    expect(verifyNotes(withEntries(entries), FACTS).slice(0, 3)).toEqual([
      'd4e5f60 is not a commit of v0.1.0..HEAD',
      'a1b2c3d "feat(lobby): create player" is filed 2 times, expected once',
      'c3d4e5f "ci: run pnpm check on pull requests" is filed 0 times, expected once',
    ]);
  });

  it('flags a sha prefix that matches more than one commit', () => {
    const commits = [...COMMITS, { sha: 'a1b2c3d9999999999999999999999999999999ff', subject: 'chore: bump deps' }];
    const problems = verifyNotes(PAYLOAD, { ...FACTS, commits });
    expect(problems).toContain('a1b2c3d is ambiguous in v0.1.0..HEAD');
  });

  it('flags a missing section', () => {
    expect(verifyNotes(PAYLOAD, { ...FACTS, date: '2026-10-27' })).toEqual([
      'docs/CHANGELOG.md has no line "## [0.2.0] - 2026-10-27"',
    ]);
  });

  it('passes a section with other blank lines', () => {
    const changelog = CHANGELOG.replace('(c3d4e5f)\n\n## [0.1.0]', '(c3d4e5f)\n## [0.1.0]');
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog })).toEqual([]);
  });

  it('flags a summary that is only in another section', () => {
    const changelog = CHANGELOG.replace('- Players can join the lobby by name (a1b2c3d)\n', '').replace(
      '- Project skeleton',
      '- Players can join the lobby by name',
    );
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog })).toEqual([
      '"## [0.2.0] - 2026-10-26" lacks the line "- Players can join the lobby by name (a1b2c3d)"',
      'docs/CHANGELOG.md changed outside "## [0.2.0] - 2026-10-26"',
    ]);
  });

  it('flags a bullet under the wrong group, with a wrong sha, and an empty group', () => {
    const changelog = CHANGELOG.replace(
      '### Added\n\n- Players can join the lobby by name (a1b2c3d)\n\n### Fixed\n\n',
      '### Changed\n\n### Fixed\n\n- Players can join the lobby by name (deadbee)\n',
    );
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog })).toEqual([
      '"## [0.2.0] - 2026-10-26" lacks the line "### Added"',
      '"## [0.2.0] - 2026-10-26" lacks the line "- Players can join the lobby by name (a1b2c3d)"',
      '"## [0.2.0] - 2026-10-26" has a line the JSON does not: "### Changed"',
      '"## [0.2.0] - 2026-10-26" has a line the JSON does not: "- Players can join the lobby by name (deadbee)"',
    ]);
  });

  it('flags the right bullets under swapped groups', () => {
    const changelog = CHANGELOG.replace('(a1b2c3d)', '(b2c3d4e)')
      .replace('- An empty player name is rejected (b2c3d4e)', '- Players can join the lobby by name (a1b2c3d)')
      .replace('- Players can join the lobby by name (b2c3d4e)', '- An empty player name is rejected (b2c3d4e)');
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog })).toEqual([
      `"## [0.2.0] - 2026-10-26" holds the JSON's lines in another order, group or count`,
    ]);
  });

  it('flags a section that is not right below ## Unreleased', () => {
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog: `${BEFORE}\n${SECTION}` })).toEqual([
      '"## [0.2.0] - 2026-10-26" is not right below "## Unreleased"',
    ]);
    const changelog = CHANGELOG.replace('## Unreleased\n\n', '') + '\n## Unreleased\n';
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog })).toEqual([
      '"## [0.2.0] - 2026-10-26" is not right below "## Unreleased"',
      'docs/CHANGELOG.md changed outside "## [0.2.0] - 2026-10-26"',
    ]);
  });

  it('flags a changelog that lost its title or history, or got the section twice', () => {
    const changed = ['docs/CHANGELOG.md changed outside "## [0.2.0] - 2026-10-26"'];
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog: `## Unreleased\n\n${SECTION}` })).toEqual(changed);
    const twice = CHANGELOG.replace('## [0.1.0]', `${SECTION}\n## [0.1.0]`);
    expect(verifyNotes(PAYLOAD, { ...FACTS, changelog: twice })).toEqual(changed);
  });
});
