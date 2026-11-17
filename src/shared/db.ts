// SQLite connection via node:sqlite. Synchronous on purpose: one process, one file.
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export function openDb(path = ':memory:'): Db {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/** What a transaction body may return: anything but a promise, so an async body does not compile. */
export type Sync<T> = T extends PromiseLike<unknown> ? never : T;

/**
 * Runs the synchronous `body` between `BEGIN IMMEDIATE` and `COMMIT`; rolls back on a throw and rethrows.
 * Called inside an open transaction, it joins it and opens none of its own.
 */
export function transaction<T>(db: Db, body: () => Sync<T>): T {
  if (db.isTransaction) return body();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = body();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
