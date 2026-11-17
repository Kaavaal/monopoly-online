// SQLite connection via node:sqlite. Synchronous on purpose: one process, one file.
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export function openDb(path = ':memory:'): Db {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

// A body that returns a promise would let COMMIT run before its awaits do, so it does not compile.
// `[T] extends [never]` keeps a body that always throws (T = never) allowed.
type SyncBody<T> = (() => T) &
  ([T] extends [never] ? unknown : T extends PromiseLike<unknown> ? never : unknown);

/**
 * Runs `body` between BEGIN IMMEDIATE and COMMIT; a throw rolls back and leaves as is. Called inside an open
 * transaction, it joins it: the outermost call alone commits or rolls back.
 */
export function transaction<T>(db: Db, body: SyncBody<T>): T {
  if (db.isTransaction) return body();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = body();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
