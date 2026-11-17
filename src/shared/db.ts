// SQLite connection via node:sqlite. Synchronous on purpose: one process, one file.
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export function openDb(path = ':memory:'): Db {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

type Sync<T> = T extends PromiseLike<unknown> ? never : T;

/**
 * Runs `body` between BEGIN IMMEDIATE and COMMIT; rolls back and rethrows when it throws. Inside an open
 * transaction it joins it: the outermost call alone commits or rolls back. The body is synchronous, since
 * an async one would commit before its awaits run.
 */
export function transaction<T>(db: Db, body: () => Sync<T>): T {
  if (db.isTransaction) return body();

  db.exec('BEGIN IMMEDIATE');
  try {
    const result = body();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    // SQLite may have rolled back on its own already; a second ROLLBACK would mask the error.
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
