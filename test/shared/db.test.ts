import { describe, expect, it } from 'vitest';

import { openDb, transaction, type Db } from '../../src/shared/db.js';

/**
 * T3: the transaction helper of ADR-0002. The one test of trade offers that does not go through HTTP: no route
 * uses the helper before T12.
 */

function freshDb(): Db {
  const db = openDb();
  db.exec('CREATE TABLE note (body TEXT NOT NULL)');
  return db;
}

function write(db: Db, body: string): void {
  db.prepare('INSERT INTO note (body) VALUES (?)').run(body);
}

function bodies(db: Db): string[] {
  return db
    .prepare('SELECT body FROM note ORDER BY rowid')
    .all()
    .map((row) => String(row.body));
}

describe('transaction', () => {
  it('commits when the body returns, and hands back its value', () => {
    const db = freshDb();

    const result = transaction(db, () => {
      write(db, 'a');
      return 42;
    });

    expect(result).toBe(42);
    expect(bodies(db)).toEqual(['a']);
    expect(db.isTransaction).toBe(false);
  });

  it('rolls back a write and rethrows the same error when the body throws', () => {
    const db = freshDb();
    const boom = new Error('boom');

    let caught: unknown;
    try {
      transaction(db, () => {
        write(db, 'a');
        throw boom;
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBe(boom);
    expect(bodies(db)).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('rolls the outer transaction back as a whole when a nested call throws', () => {
    const db = freshDb();
    const boom = new Error('inner');

    expect(() =>
      transaction(db, () => {
        write(db, 'outer');
        transaction(db, () => {
          write(db, 'inner');
          throw boom;
        });
      }),
    ).toThrow(boom);

    expect(bodies(db)).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('joins an open transaction: a nested call that returns commits nothing on its own', () => {
    const db = freshDb();

    expect(() =>
      transaction(db, () => {
        transaction(db, () => write(db, 'inner'));
        expect(db.isTransaction).toBe(true);
        throw new Error('outer fails after the nested call');
      }),
    ).toThrow('outer fails after the nested call');

    expect(bodies(db)).toEqual([]);
  });

  it('takes a synchronous body only', () => {
    const db = freshDb();
    // Never called: the check is the compiler's. `pnpm typecheck` goes red if an async body compiles.
    const asyncBody = () =>
      // @ts-expect-error an async body would let the transaction commit before its awaits run
      transaction(db, async () => {
        write(db, 'a');
      });

    expect(typeof asyncBody).toBe('function');
  });
});
