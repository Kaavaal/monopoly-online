// SQLite connection via node:sqlite. Synchronous on purpose: one process, one file.
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export function openDb(path = ':memory:'): Db {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/** A promise as the body's result means an async body, which would outlive the transaction. */
type Sync<T> = T extends PromiseLike<unknown> ? never : T;

/**
 * Runs `body` between BEGIN IMMEDIATE and COMMIT; on a throw rolls back and rethrows.
 * Called inside an open transaction it joins it: the outermost call commits or rolls back.
 */
export function transaction<T>(db: Db, body: () => Sync<T>): T {
  if (db.isTransaction) return body();

  db.exec('BEGIN IMMEDIATE');
  try {
    const result = body();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    // SQLite may have rolled back already (ON CONFLICT ROLLBACK, SQLITE_FULL); keep the real error.
    if (db.isTransaction) db.exec('ROLLBACK');
    throw err;
  }
}
