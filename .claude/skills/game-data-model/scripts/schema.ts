// Prints the live schema: applies migrations/ to an in-memory database and lists each table's columns and indexes.
//   pnpm exec tsx .claude/skills/game-data-model/scripts/schema.ts [--sql]
// --sql also prints each table's stored CREATE statement: the source for a rebuild, CHECKs included.
import { openDb } from '../../../../src/shared/db.js';
import { MIGRATIONS_DIR, migrate } from '../../../../src/shared/migrate.js';

const withSql = process.argv.includes('--sql');
const db = openDb();
console.log(`applied: ${migrate(db, MIGRATIONS_DIR).join(', ')}`);
const tables = db
  .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'schema_migrations' ORDER BY name")
  .all();
for (const { name, sql } of tables) {
  const t = String(name);
  console.log(`\n${t}`);
  if (withSql) console.log(String(sql).replace(/^/gm, '  | '));
  for (const c of db.prepare(`PRAGMA table_info("${t}")`).all()) {
    const flags = [c.pk ? 'PK' : '', c.notnull ? 'NOT NULL' : 'NULL', c.dflt_value != null ? `DEFAULT ${String(c.dflt_value)}` : '']
      .filter(Boolean)
      .join(' ');
    console.log(`  ${String(c.name).padEnd(16)} ${String(c.type).padEnd(8)} ${flags}`);
  }
  for (const i of db.prepare(`PRAGMA index_list("${t}")`).all()) {
    const cols = db.prepare(`PRAGMA index_info("${String(i.name)}")`).all().map((x) => x.name);
    console.log(`  index ${String(i.name)}${i.unique ? ' UNIQUE' : ''} (${cols.join(', ')})`);
  }
  for (const f of db.prepare(`PRAGMA foreign_key_list("${t}")`).all()) {
    console.log(`  fk ${String(f.from)} -> ${String(f.table)}(${String(f.to)})`);
  }
}
