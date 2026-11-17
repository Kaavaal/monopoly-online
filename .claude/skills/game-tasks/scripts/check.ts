// The eight per-task gates and the self-check of game-tasks.
//   pnpm exec tsx .claude/skills/game-tasks/scripts/check.ts docs/features/<slug> [--task T3]
// Without --task: every task, then the graph, the mermaid edges, AC and code coverage, markdown vs tasks.json.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const feature = args[0];
const at = args.indexOf('--task');
const only = at >= 0 ? args[at + 1] : undefined;
if (!feature) throw new Error('usage: check.ts docs/features/<slug> [--task <id>]');
const dir = join(feature, 'game-tasks');

const KEYS = ['id', 'title', 'layer', 'context', 'deps', 'needs', 'acs', 'codes', 'files_hint', 'estimate', 'status'];
const LAYERS = ['migration', 'domain', 'infra', 'ports', 'wiring', 'shared', 'docs'];

type Task = { file: string; text: string; body: string; fm: Map<string, string> };
const list = (v: string | undefined): string[] =>
  (v ?? '').replace(/^\[|\]$/g, '').split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
const section = (body: string, name: string): string => body.split(`\n## ${name}\n`)[1]?.split('\n## ')[0] ?? '';

const tasks = new Map<string, Task>();
for (const file of readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'tracker.md')) {
  const text = readFileSync(join(dir, file), 'utf8');
  const [, head = '', ...rest] = text.split(/^---$/m);
  const fm = new Map<string, string>();
  for (const line of head.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (m?.[1]) fm.set(m[1], (m[2] ?? '').replace(/\s+#.*$/, '').trim());
  }
  tasks.set(list(fm.get('id'))[0] ?? file, { file, text, body: rest.join('---'), fm });
}

const prdAcs = [...readFileSync(join(feature, 'game-prd.md'), 'utf8').matchAll(/^### (AC-\d+b?)\b/gm)].map((m) => m[1]);
const sentinel = section(readFileSync(join(feature, 'CONTEXT.md'), 'utf8'), 'Sentinel errors');
const codes = [...sentinel.matchAll(/^\| `([a-z]+\.[a-z_]+)`/gm)].map((m) => m[1]);

let failed = 0;
const say = (pass: boolean, line: string): void => {
  if (!pass) failed++;
  console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${line}`);
};

const deps = (t: Task): string[] => list(t.fm.get('deps'));
function cycle(): string | undefined {
  const state = new Map<string, 1 | 2>();
  const visit = (id: string, path: string[]): string | undefined => {
    if (state.get(id) === 1) return [...path, id].join(' -> ');
    if (state.get(id) === 2) return undefined;
    state.set(id, 1);
    for (const d of tasks.get(id) ? deps(tasks.get(id) as Task) : []) {
      const found = visit(d, [...path, id]);
      if (found) return found;
    }
    state.set(id, 2);
    return undefined;
  };
  for (const id of tasks.keys()) {
    const found = visit(id, []);
    if (found) return found;
  }
  return undefined;
}

function gates(id: string, t: Task): void {
  console.log(`${id} (${t.file})`);
  const layer = list(t.fm.get('layer'))[0] ?? '';
  const missing = KEYS.filter((k) => !t.fm.has(k));
  say(!missing.length && LAYERS.includes(layer), `1 frontmatter${missing.length ? `, missing ${missing.join(' ')}` : ''}, layer ${layer}`);
  const unknown = deps(t).filter((d) => !tasks.has(d));
  say(!unknown.length, `2 deps [${deps(t).join(', ')}]${unknown.length ? `, unknown ${unknown.join(' ')}` : ''}`);
  const acs = list(t.fm.get('acs'));
  const badAcs = acs.filter((a) => !prdAcs.includes(a));
  say((acs.length > 0 || layer === 'docs') && !badAcs.length, `3 acs ${acs.length}${badAcs.length ? `, not in game-prd §5: ${badAcs.join(' ')}` : ''}`);
  const links = [...t.body.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map((m) => m[1] ?? '').filter((l) => !/^https?:/.test(l));
  const dangling = links.filter((l) => !existsSync(resolve(dirname(join(dir, t.file)), l)));
  const want = layer === 'ports' ? ['game-sad.md', 'openapi.yaml'] : ['migration', 'infra'].includes(layer) ? ['game-data-model.md'] : [];
  const lacking = want.filter((w) => !links.some((l) => l.endsWith(w)));
  say(!dangling.length && !lacking.length && links.length > 0, `4 links ${links.length}${dangling.length ? `, dangling ${dangling.join(' ')}` : ''}${lacking.length ? `, no link to ${lacking.join(' ')}` : ''}`);
  const own = list(t.fm.get('codes'));
  const badCodes = own.filter((c) => !codes.includes(c));
  say(!badCodes.length, `5 codes ${own.length}${badCodes.length ? `, not in CONTEXT.md: ${badCodes.join(' ')}` : ''}`);
  const steps = section(t.body, 'Checklist').match(/^\d+\. /gm)?.length ?? 0;
  say(steps >= 3, `6 checklist ${steps} steps`);
  const dod = section(t.body, 'Definition of Done');
  const boxes = dod.match(/^- \[[ x]\] .*$/gm) ?? [];
  const placeholder = boxes.some((b) => /<[a-z][^>]*>/.test(b));
  say(boxes.length >= 2 && !placeholder && /pnpm check/.test(boxes.at(-1) ?? ''), `7 DoD ${boxes.length} items${placeholder ? ', template placeholder left' : ''}`);
  const copied = /^```(ya?ml|json|sql)/m.test(t.body) || /^\s*(\*\*)?(Given|When|Then)\b/m.test(t.body);
  const tokens = Math.round(t.text.length / 4);
  say(!copied && tokens <= 5000, `8 ~${tokens} tokens${copied ? ', pasted YAML/JSON/SQL or Given/When/Then' : ''}`);
}

if (only) {
  const t = tasks.get(only);
  if (!t) throw new Error(`${only}: no such task in ${dir}`);
  gates(only, t);
} else {
  for (const [id, t] of tasks) gates(id, t);
  console.log('breakdown');
  const loop = cycle();
  say(!loop, `${tasks.size} tasks, ${loop ? `cycle ${loop}` : 'no cycle'}`);

  const epic = readFileSync(join(dir, '_epic.md'), 'utf8');
  const drawn = new Set([...epic.matchAll(/^\s*(T\d+)\s*-->\s*(T\d+)\s*$/gm)].map((m) => `${m[1]}>${m[2]}`));
  const real = new Set([...tasks].flatMap(([id, t]) => deps(t).map((d) => `${d}>${id}`)));
  const off = [...real].filter((e) => !drawn.has(e)).concat([...drawn].filter((e) => !real.has(e)));
  say(!off.length, `mermaid edges ${drawn.size} = deps ${real.size}${off.length ? `, differ ${off.join(' ')}` : ''}`);

  const covered = new Set([...tasks.values()].flatMap((t) => list(t.fm.get('acs'))));
  const gap = prdAcs.filter((a) => a && !covered.has(a));
  say(!gap.length, `game-prd §5 ACs covered ${prdAcs.length - gap.length} of ${prdAcs.length}${gap.length ? `, missing ${gap.join(' ')}` : ''}`);
  const raised = new Set([...tasks.values()].flatMap((t) => list(t.fm.get('codes'))));
  const silent = codes.filter((c) => c && !raised.has(c));
  say(!silent.length, `CONTEXT.md codes raised ${codes.length - silent.length} of ${codes.length}${silent.length ? `, never ${silent.join(' ')}` : ''}`);

  type Json = { tasks: { id: string; deps: string[]; acs: string[]; codes: string[]; needs: string[]; files_hint: string[] }[]; prerequisites: { id: string }[] };
  const json = JSON.parse(readFileSync(join(dir, 'tasks.json'), 'utf8')) as Json;
  const fields = ['deps', 'acs', 'codes', 'needs', 'files_hint'] as const;
  const drift = json.tasks
    .filter((j) => {
      const t = tasks.get(j.id);
      return !t || fields.some((f) => JSON.stringify(list(t.fm.get(f))) !== JSON.stringify(j[f]));
    })
    .map((j) => j.id);
  if (json.tasks.length !== tasks.size) drift.push(`${json.tasks.length} in json vs ${tasks.size} files`);
  say(!drift.length, `tasks.json matches the task files${drift.length ? `, differ ${drift.join(' ')}` : ''}`);
  const known = new Set(json.prerequisites.map((p) => p.id));
  const orphan = [...tasks.values()].flatMap((t) => list(t.fm.get('needs'))).filter((n) => !known.has(n));
  say(!orphan.length, `needs point at listed prerequisites${orphan.length ? `, unknown ${[...new Set(orphan)].join(' ')}` : ''}`);
}

console.log(failed ? `\n${failed} gate(s) failed` : '\nall gates passed');
process.exit(failed ? 1 : 0);
