// Up -> down -> up rehearsal of staged migration pairs on a scratch SQLite file.
//   pnpm exec tsx .claude/skills/game-data-model/scripts/roundtrip.ts <staged-dir> [scratch.db]
// Live migrations go first through the real runner, then one sample row per table so backfills have data.
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { openDb, type Db } from '../../../../src/shared/db.js';
import { MIGRATIONS_DIR, migrate } from '../../../../src/shared/migrate.js';

const [dir, file = 'roundtrip-scratch.db'] = process.argv.slice(2);
if (!dir) throw new Error('usage: roundtrip.ts <staged-dir> [scratch.db]');
if (existsSync(file)) rmSync(file);

const db = openDb(file);
console.log(`live:  ${migrate(db, MIGRATIONS_DIR).join(', ')}`);
db.exec(`INSERT INTO players (id, name, token, created_at) VALUES ('p1', 'Test User', 'car', '2026-01-01T00:00:00.000Z');
INSERT INTO properties (id, "name", "color_group", "price", "rent", "owner_id", created_at)
VALUES ('d1', 'Test Deed', 'brown', 60, 2, 'p1', '2026-01-01T00:00:00.000Z');`);

// A staged up file carries its live name, NNNN_<context>_<name>.sql (the SDLC plugin's <ts>_<name>.up.sql works
// too); its down is <name>.down.sql.
const pairs = readdirSync(dir)
  .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
  .sort()
  .map((up) => ({ up, name: up.replace(/(\.up)?\.sql$/, '') }));
if (pairs.length === 0) throw new Error(`${dir}: no staged migrations`);
for (const { name } of pairs) {
  if (!existsSync(join(dir, `${name}.down.sql`))) throw new Error(`${name}: no .down.sql`);
}

function run({ up, name }: { up: string; name: string }, way: 'up' | 'down'): void {
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

/** Per table: schema by pragma (columns, indexes, foreign keys) and every row. Stored DDL text is not compared. */
function snapshot(d: Db): Snap {
  const tables = d
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'schema_migrations' ORDER BY name")
    .all()
    .map((r) => String(r.name));
  return Object.fromEntries(
    tables.map((t) => [
      t,
      {
        schema: JSON.stringify({
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
    ]),
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
pairs.forEach((n) => run(n, 'up'));
const up1 = snapshot(db);
[...pairs].reverse().forEach((n) => run(n, 'down'));
const down = snapshot(db);
pairs.forEach((n) => run(n, 'up'));
const up2 = snapshot(db);
db.close();

const back = compare(base, down);
const again = compare(up1, up2);
console.log(`after down vs before up:      ${back}`);
console.log(`after second up vs first up:  ${again}`);
if (back !== 'same' || again !== 'same') process.exit(1);
