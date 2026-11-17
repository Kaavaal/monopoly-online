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

/** The types let an async body through as `transaction<void>` or as `any`; refuse it before the commit. */
function sync<T>(result: T): T {
  if (result instanceof Promise) throw new Error('transaction body must be synchronous');
  return result;
}

/**
 * Runs `body` between BEGIN IMMEDIATE and COMMIT; on a throw rolls back and rethrows.
 * Called inside an open transaction it joins it: the outermost call commits or rolls back.
 * So a nested throw undoes anything only if it reaches the outermost call: a body that catches it
 * and returns commits what the nested call wrote.
 */
export function transaction<T>(db: Db, body: () => Sync<T>): T {
  if (db.isTransaction) return sync(body());

  db.exec('BEGIN IMMEDIATE');
  try {
    const result = sync(body());
    db.exec('COMMIT');
    return result;
  } catch (err) {
    // SQLite may have rolled back already (ON CONFLICT ROLLBACK, SQLITE_FULL); keep the real error.
    if (db.isTransaction) db.exec('ROLLBACK');
    throw err;
  }
}
