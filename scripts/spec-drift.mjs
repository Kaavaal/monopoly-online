// Spec drift watch for the trade-offers task package.
// Compares tracker.md, both tasks.json copies and the per-task files with each other and with the working
// tree, writes .drift/<utc>.md and exits 1 when it finds drift. Reads only; never edits the specs.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const pkg = 'docs/features/trade-offers';
const read = (p) => readFileSync(join(root, p), 'utf8');
const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();
const findings = [];
const drift = (msg) => findings.push(msg);
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const plain = (s) => s.replaceAll('`', '').replaceAll('"', '').trim();

// tasks.json, kept in two places
const jsonText = read(`${pkg}/tasks.json`);
if (read(`${pkg}/tasks/tasks.json`) !== jsonText) drift(`${pkg}/tasks.json and tasks/tasks.json differ`);
const spec = JSON.parse(jsonText);
const json = new Map(spec.tasks.map((t) => [t.id, t]));
const externalOf = (id) => spec.external_prerequisites.filter((p) => p.blocks.includes(id)).map((p) => p.id);

// tracker.md rows: | T1 | [title](./file.md) | layer | owner | estimate | blocked by | status |
const tracker = new Map();
for (const line of read(`${pkg}/tasks/tracker.md`).split('\n')) {
  const m = line.match(/^\| (T\d+) \| \[(.+)\]\(\.\/(.+?)\) \|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/);
  if (!m) continue;
  const by = m[7].trim() === '—' ? [] : m[7].split(',').map((s) => s.trim());
  tracker.set(m[1], { title: m[2], file: m[3], by, status: m[8].trim() });
}

// per-task frontmatter
const front = (text) => {
  const fm = {};
  for (const line of text.split('---')[1]?.split('\n') ?? []) {
    const m = line.match(/^(\w+): (.*)$/);
    if (!m) continue;
    const v = m[2].trim();
    fm[m[1]] = v.startsWith('[') ? v.slice(1, -1).split(',').map(plain).filter(Boolean) : plain(v);
  }
  return fm;
};
const files = new Map();
for (const [id, row] of tracker) {
  const path = `${pkg}/tasks/${row.file}`;
  if (!existsSync(join(root, path))) { drift(`${id}: tracker links ${row.file}, which does not exist`); continue; }
  const fm = front(read(path));
  if (fm.id !== id) drift(`${id}: tracker links ${row.file}, whose id is ${fm.id}`);
  files.set(id, fm);
}

const ids = [...new Set([...json.keys(), ...tracker.keys(), ...files.keys()])].sort((a, b) => a.slice(1) - b.slice(1));
for (const id of ids) {
  if (!json.has(id)) drift(`${id}: missing from tasks.json`);
  if (!tracker.has(id)) drift(`${id}: missing from tracker.md`);
}

// A task is blocked while it waits on a prerequisite or on a blocked task. No prerequisite has shipped yet.
const blocked = (id, seen = new Set()) => {
  if (seen.has(id)) return false;
  seen.add(id);
  return externalOf(id).length > 0 || (json.get(id)?.deps ?? []).some((d) => blocked(d, seen));
};

for (const id of ids) {
  const j = json.get(id), t = tracker.get(id), f = files.get(id);
  if (!j || !t || !f) continue;
  const ext = externalOf(id);
  if (plain(t.title) !== j.title || f.title !== j.title) drift(`${id}: title differs (tracker "${plain(t.title)}", file "${f.title}", json "${j.title}")`);
  if (!sameSet(f.deps, j.deps)) drift(`${id}: deps differ (file [${f.deps}], json [${j.deps}])`);
  if (!sameSet(f.external, ext)) drift(`${id}: prerequisites differ (file [${f.external}], json [${ext}])`);
  if (!sameSet(t.by, [...j.deps, ...ext])) drift(`${id}: tracker "Blocked by" is [${t.by}], json says [${[...j.deps, ...ext]}]`);
  if (!sameSet(f.files_hint, j.files_hint)) drift(`${id}: files_hint differs between the task file and json`);

  const status = t.status;
  if (status !== f.status && !(status === 'blocked' && f.status === 'todo' && blocked(id))) {
    drift(`${id}: status is ${status} in tracker, ${f.status} in ${t.file}`);
  }
  if (status === 'blocked' && !blocked(id)) drift(`${id}: tracker says blocked, but nothing it depends on is blocked`);
  if (status !== 'blocked' && blocked(id)) {
    const why = ext.length ? ext.join(', ') : j.deps.filter((d) => blocked(d)).join(', ');
    drift(`${id}: tracker says ${status}, but it waits on ${why}, which is blocked`);
  }
  if (status === 'done') {
    for (const d of j.deps) if (tracker.get(d)?.status !== 'done') drift(`${id}: done, but its dep ${d} is ${tracker.get(d)?.status}`);
  }
  // Inputs under docs/ must exist from the start; code files must exist once the task is in review or done.
  for (const p of j.files_hint) {
    const needed = p.startsWith('docs/') || status === 'review' || status === 'done';
    if (needed && !existsSync(join(root, p))) drift(`${id}: ${status}, but files_hint ${p} is not in the branch`);
  }
}

// Local state a cloud copy of the repo would not see: uncommitted edits to the package or to hinted files.
const hinted = [...new Set(spec.tasks.flatMap((t) => t.files_hint))];
const dirty = execFileSync('git', ['-C', root, 'status', '--porcelain', '--', pkg, ...hinted], { encoding: 'utf8' }).trimEnd();

const now = new Date();
const stamp = now.toISOString().slice(0, 16).replace(':', '');
const out = [
  `# Spec drift, ${now.toISOString().slice(0, 16)}Z`,
  '',
  `Branch ${git('branch', '--show-current')} at ${git('rev-parse', '--short', 'HEAD')}, ${ids.length} tasks.`,
  '',
  'Uncommitted:',
  dirty ? dirty.split('\n').map((l) => `    ${l}`).join('\n') : '    nothing',
  '',
  findings.length ? `Drift (${findings.length}):` : 'Drift: none.',
  ...findings.map((f) => `- ${f}`),
  '',
].join('\n');
mkdirSync(join(root, '.drift'), { recursive: true });
writeFileSync(join(root, '.drift', `${stamp}.md`), out);
process.stdout.write(`${out}report: .drift/${stamp}.md\n`);
process.exit(findings.length ? 1 : 0);
