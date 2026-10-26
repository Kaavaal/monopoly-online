// Forward-only SQL migrations: migrations/NNNN_<context>_<name>.sql, applied once each, in lexical order.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Db } from './db.js';

export const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url));

const NAME = /^\d{4}_[a-z0-9]+_[a-z0-9_]+\.sql$/;

/** Applies pending migrations from `dir`, each in its own transaction. Returns the versions applied now. */
export function migrate(db: Db, dir: string): string[] {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT)');
  const done = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map((row) => String(row.version)),
  );
  const record = db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');

  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (!NAME.test(file)) throw new Error(`migration ${file}: expected NNNN_<context>_<name>.sql`);
    const version = file.slice(0, -'.sql'.length);
    if (done.has(version)) continue;

    db.exec('BEGIN');
    try {
      db.exec(readFileSync(join(dir, file), 'utf8'));
      record.run(version, new Date().toISOString());
      db.exec('COMMIT');
    } catch (err) {
      // SQLite may have rolled back already (ON CONFLICT ROLLBACK, SQLITE_FULL); keep the real error.
      if (db.isTransaction) db.exec('ROLLBACK');
      throw err;
    }
    applied.push(version);
  }
  return applied;
}
