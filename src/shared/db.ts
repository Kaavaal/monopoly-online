// SQLite connection via node:sqlite. Synchronous on purpose: one process, one file.
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export function openDb(path = ':memory:'): Db {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/**
 * Runs a synchronous `body` in one write transaction; commits on return, rolls back on a throw.
 * Inside an open transaction it joins it: the outermost call commits or rolls back.
 * An async body does not compile: it would commit before the awaited work ran.
 */
export function transaction<T>(db: Db, body: () => T extends PromiseLike<unknown> ? never : T): T {
  if (db.isTransaction) return body();

  db.exec('BEGIN IMMEDIATE');
  try {
    const result = body();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    // SQLite may have rolled back already; keep the real error.
    if (db.isTransaction) db.exec('ROLLBACK');
    throw err;
  }
}
