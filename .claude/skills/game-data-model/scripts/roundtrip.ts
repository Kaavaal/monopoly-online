// Up -> down -> up rehearsal of staged migration pairs on a scratch SQLite file.
//   pnpm exec tsx .claude/skills/game-data-model/scripts/roundtrip.ts <staged-dir>... [--db roundtrip-<x>.db]
// Live migrations go first through the real runner, then one sample row per table so backfills have data.
// Pairs from several dirs (e.g. game-migrations and its _drift/) run together, ordered by file name.
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';

import { openDb, type Db } from '../../../../src/shared/db.js';
import { MIGRATIONS_DIR, migrate } from '../../../../src/shared/migrate.js';

const args = process.argv.slice(2);
const at = args.indexOf('--db');
const file = at >= 0 ? args[at + 1] : 'roundtrip-scratch.db';
const dirs = args.filter((_, i) => at < 0 || (i !== at && i !== at + 1));
if (dirs.length === 0 || !file) throw new Error('usage: roundtrip.ts <staged-dir>... [--db roundtrip-<x>.db]');
// The scratch file is wiped first, so only a file this script names is accepted: never monopoly.db.
if (!basename(file).startsWith('roundtrip')) throw new Error(`${file}: the scratch db name must start with "roundtrip"`);
if (existsSync(file)) rmSync(file);

const db = openDb(file);
console.log(`live:  ${migrate(db, MIGRATIONS_DIR).join(', ')}`);
db.exec(`INSERT INTO players (id, name, token, created_at) VALUES ('p1', 'Test User', 'car', '2026-01-01T00:00:00.000Z');
INSERT INTO properties (id, "name", "color_group", "price", "rent", "owner_id", created_at)
VALUES ('d1', 'Test Deed', 'brown', 60, 2, 'p1', '2026-01-01T00:00:00.000Z');`);

// A staged up file carries its live name, NNNN_<context>_<name>.sql (the SDLC plugin's <ts>_<name>.up.sql works
// too); its down is <name>.down.sql in the same dir.
const pairs = dirs
  .flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
      .map((up) => ({ dir, up, name: up.replace(/(\.up)?\.sql$/, '') })),
  )
  .sort((a, b) => a.up.localeCompare(b.up));
if (pairs.length === 0) throw new Error(`${dirs.join(', ')}: no staged migrations`);
for (const { dir, name } of pairs) {
  if (!existsSync(join(dir, `${name}.down.sql`))) throw new Error(`${name}: no .down.sql`);
}

type Pair = (typeof pairs)[number];

function run({ dir, up, name }: Pair, way: 'up' | 'down'): void {
  db.exec('BEGIN');
  try {
    db.exec(readFileSync(join(dir, way === 'up' ? up : `${name}.down.sql`), 'utf8'));
    db.exec('COMMIT');
  } catch (err) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw new Error(`${way} ${name}: ${(err as Error).message}`);
  }
  console.log(`${way.padEnd(5)}  ${name}`);
}

type Snap = Record<string, { schema: string; rows: string }>;

/** Stored DDL without quotes and layout: a rebuild re-quotes and re-wraps it, a lost CHECK still shows. */
function ddl(sql: unknown): string {
  return String(sql)
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),])\s*/g, '$1')
    .trim();
}

/** Per table: its DDL and its indexes' DDL, columns, indexes and foreign keys by pragma, and every row. */
function snapshot(d: Db): Snap {
  const tables = d
    .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'schema_migrations' ORDER BY name")
    .all();
  return Object.fromEntries(
    tables.map(({ name, sql }) => {
      const t = String(name);
      return [
        t,
        {
          schema: JSON.stringify({
            ddl: ddl(sql),
            indexDdl: d
              .prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL ORDER BY name")
              .all(t)
              .map((r) => ddl(r.sql)),
            cols: d.prepare(`PRAGMA table_xinfo("${t}")`).all(),
            idx: d
              .prepare(`PRAGMA index_list("${t}")`)
              .all()
              .sort((a, b) => String(a.name).localeCompare(String(b.name)))
              .map((i) => ({ ...i, seq: 0, cols: d.prepare(`PRAGMA index_xinfo("${String(i.name)}")`).all() })),
            fks: d.prepare(`PRAGMA foreign_key_list("${t}")`).all(),
          }),
          rows: JSON.stringify(d.prepare(`SELECT * FROM "${t}" ORDER BY 1`).all()),
        },
      ];
    }),
  );
}

/** "same", or what differs: tables missing on one side, then tables whose schema or rows differ. */
function compare(a: Snap, b: Snap): string {
  const names = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const diff = names.flatMap((t) =>
    !a[t] || !b[t]
      ? [`${t}: table ${a[t] ? 'gone' : 'extra'}`]
      : [a[t].schema !== b[t].schema && `${t}: schema`, a[t].rows !== b[t].rows && `${t}: rows`].filter((x): x is string => !!x),
  );
  return diff.length ? `DIFFERENT (${diff.join('; ')})` : 'same';
}

const base = snapshot(db);
pairs.forEach((p) => run(p, 'up'));
const up1 = snapshot(db);
[...pairs].reverse().forEach((p) => run(p, 'down'));
const down = snapshot(db);
pairs.forEach((p) => run(p, 'up'));
const up2 = snapshot(db);
db.close();

const back = compare(base, down);
const again = compare(up1, up2);
console.log(`after down vs before up:      ${back}`);
console.log(`after second up vs first up:  ${again}`);
if (back !== 'same' || again !== 'same') process.exit(1);
