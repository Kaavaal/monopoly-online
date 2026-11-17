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
const root: string = feature;
const dir = join(feature, 'game-tasks');

const KEYS = ['id', 'title', 'layer', 'context', 'deps', 'needs', 'acs', 'codes', 'files_hint', 'estimate', 'status'];
const LAYERS = ['migration', 'domain', 'infra', 'ports', 'wiring', 'shared', 'docs'];
const SCALARS = ['id', 'title', 'layer', 'context', 'estimate', 'status'];
const PLACEHOLDER = /<[a-z][^>]*>/;

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
  const missing = KEYS.filter((k) => !t.fm.has(k)).concat(SCALARS.filter((k) => t.fm.has(k) && !list(t.fm.get(k))[0]).map((k) => `${k} (empty)`));
  say(!missing.length && LAYERS.includes(layer), `1 frontmatter${missing.length ? `, missing ${missing.join(' ')}` : ''}, layer ${layer}`);
  const unknown = deps(t).filter((d) => !tasks.has(d));
  const loop = cycle();
  say(!unknown.length && !loop, `2 deps [${deps(t).join(', ')}]${unknown.length ? `, unknown ${unknown.join(' ')}` : ''}${loop ? `, cycle ${loop}` : ''}`);
  const acs = list(t.fm.get('acs'));
  const badAcs = acs.filter((a) => !prdAcs.includes(a));
  say((acs.length > 0 || layer === 'docs') && !badAcs.length, `3 acs ${acs.length}${badAcs.length ? `, not in game-prd §5: ${badAcs.join(' ')}` : ''}`);
  const links = [...t.body.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map((m) => m[1] ?? '').filter((l) => !/^https?:/.test(l));
  const here = (l: string): string => resolve(dirname(join(dir, t.file)), l);
  const dangling = links.filter((l) => !existsSync(here(l)));
  const want = layer === 'ports' ? ['game-sad.md', 'game-contracts/openapi.yaml'] : ['migration', 'infra'].includes(layer) ? ['game-data-model.md'] : [];
  const lacking = want.filter((w) => !links.some((l) => here(l) === resolve(root, w)));
  say(!dangling.length && !lacking.length && links.length > 0, `4 links ${links.length}${dangling.length ? `, dangling ${dangling.join(' ')}` : ''}${lacking.length ? `, no link to ${lacking.join(' ')}` : ''}`);
  const own = list(t.fm.get('codes'));
  const badCodes = own.filter((c) => !codes.includes(c));
  say(!badCodes.length, `5 codes ${own.length}${badCodes.length ? `, not in CONTEXT.md: ${badCodes.join(' ')}` : ''}`);
  const stepLines = section(t.body, 'Checklist').match(/^\d+\. .*$/gm) ?? [];
  const stepHole = stepLines.some((l) => PLACEHOLDER.test(l));
  say(stepLines.length >= 3 && !stepHole, `6 checklist ${stepLines.length} steps${stepHole ? ', template placeholder left' : ''}`);
  const dod = section(t.body, 'Definition of Done');
  const boxes = dod.match(/^- \[[ x]\] .*$/gm) ?? [];
  const placeholder = boxes.some((b) => PLACEHOLDER.test(b));
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
  const dotted = new Set([...epic.matchAll(/^\s*(P\d+)\s*-\.->\s*(T\d+)\s*$/gm)].map((m) => `${m[1]}>${m[2]}`));
  const needed = new Set([...tasks].flatMap(([id, t]) => list(t.fm.get('needs')).map((n) => `${n}>${id}`)));
  const offNeeds = [...needed].filter((e) => !dotted.has(e)).concat([...dotted].filter((e) => !needed.has(e)));
  say(!offNeeds.length, `dotted edges ${dotted.size} = needs ${needed.size}${offNeeds.length ? `, differ ${offNeeds.join(' ')}` : ''}`);
  const depth = new Map<string, number>();
  const level = (id: string): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    const d = Math.max(0, ...deps(tasks.get(id) as Task).filter((x) => tasks.has(x)).map((x) => level(x) + 1));
    depth.set(id, d);
    return d;
  };
  const waves = loop ? [] : [...tasks.keys()].map(level);
  const widest = Math.max(0, ...waves.map((w) => waves.filter((x) => x === w).length));
  say(widest >= 2, `${new Set(waves).size} waves, widest has ${widest} tasks in parallel`);

  const covered = new Set([...tasks.values()].flatMap((t) => list(t.fm.get('acs'))));
  const gap = prdAcs.filter((a) => a && !covered.has(a));
  say(!gap.length, `game-prd §5 ACs covered ${prdAcs.length - gap.length} of ${prdAcs.length}${gap.length ? `, missing ${gap.join(' ')}` : ''}`);
  const raised = new Set([...tasks.values()].flatMap((t) => list(t.fm.get('codes'))));
  const silent = codes.filter((c) => c && !raised.has(c));
  say(!silent.length, `CONTEXT.md codes raised ${codes.length - silent.length} of ${codes.length}${silent.length ? `, never ${silent.join(' ')}` : ''}`);

  type Json = { tasks: { id: string; title: string; layer: string; deps: string[]; acs: string[]; codes: string[]; needs: string[]; files_hint: string[] }[]; prerequisites: { id: string }[] };
  const json = JSON.parse(readFileSync(join(dir, 'tasks.json'), 'utf8')) as Json;
  const fields = ['deps', 'acs', 'codes', 'needs', 'files_hint'] as const;
  const drift = json.tasks
    .filter((j) => {
      const t = tasks.get(j.id);
      const scalar = (k: string): string | undefined => t?.fm.get(k)?.replace(/^"|"$/g, '');
      return !t || fields.some((f) => JSON.stringify(list(t.fm.get(f))) !== JSON.stringify(j[f])) ||
        scalar('title') !== j.title || scalar('layer') !== j.layer;
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
