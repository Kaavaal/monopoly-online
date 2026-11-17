// SQLite connection via node:sqlite. Synchronous on purpose: one process, one file.
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export function openDb(path = ':memory:'): Db {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/**
 * Runs `body` in one transaction: commits when it returns, rolls back and rethrows when it throws.
 * Called inside an open transaction, it joins it, so the outermost call decides the outcome.
 * The body is synchronous: an awaited write would land after the commit.
 */
export function inTransaction<T>(db: Db, body: () => T extends PromiseLike<unknown> ? never : T): T {
  if (db.isTransaction) {
    return body();
  }
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
