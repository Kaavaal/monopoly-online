import { describe, expect, it } from 'vitest';

import { openDb, transaction } from '../../src/shared/db.js';
import type { Db } from '../../src/shared/db.js';

function scratchDb(): Db {
  const db = openDb();
  db.exec('CREATE TABLE scratch (id INTEGER PRIMARY KEY, note TEXT NOT NULL)');
  return db;
}

function notes(db: Db): string[] {
  const rows = db.prepare('SELECT note FROM scratch ORDER BY id').all() as { note: string }[];
  return rows.map((r) => r.note);
}

function insert(db: Db, note: string): void {
  db.prepare('INSERT INTO scratch (note) VALUES (?)').run(note);
}

function caught(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error('expected the call to throw');
}

describe('transaction', () => {
  it('keeps the write and returns the body value when the body returns', () => {
    const db = scratchDb();

    const result = transaction(db, () => {
      insert(db, 'kept');
      return 42;
    });

    expect(result).toBe(42);
    expect(notes(db)).toEqual(['kept']);
    expect(db.isTransaction).toBe(false);
  });

  it('is open while the body runs', () => {
    const db = scratchDb();

    const inside = transaction(db, () => db.isTransaction);

    expect(inside).toBe(true);
  });

  it('rolls the write back and rethrows the same error when the body throws', () => {
    const db = scratchDb();
    const boom = new Error('boom');

    const thrown = caught(() =>
      transaction(db, () => {
        insert(db, 'doomed');
        throw boom;
      }),
    );

    expect(thrown).toBe(boom);
    expect(notes(db)).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('can open a new transaction after a rollback', () => {
    const db = scratchDb();
    caught(() =>
      transaction(db, () => {
        insert(db, 'doomed');
        throw new Error('boom');
      }),
    );

    transaction(db, () => insert(db, 'second'));

    expect(notes(db)).toEqual(['second']);
  });

  it('joins an open transaction: a nested call opens none of its own', () => {
    const db = scratchDb();

    transaction(db, () => {
      insert(db, 'outer');
      const inner = transaction(db, () => {
        insert(db, 'inner');
        return 'inner-value';
      });
      expect(inner).toBe('inner-value');
      expect(db.isTransaction).toBe(true);
    });

    expect(notes(db)).toEqual(['outer', 'inner']);
    expect(db.isTransaction).toBe(false);
  });

  it('rolls the whole outer transaction back when a nested call throws', () => {
    const db = scratchDb();
    const boom = new Error('inner boom');

    const thrown = caught(() =>
      transaction(db, () => {
        insert(db, 'outer');
        transaction(db, () => {
          insert(db, 'inner');
          throw boom;
        });
      }),
    );

    expect(thrown).toBe(boom);
    expect(notes(db)).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('does not commit early when a nested call returns and the outer throws afterwards', () => {
    const db = scratchDb();
    const boom = new Error('outer boom');

    const thrown = caught(() =>
      transaction(db, () => {
        transaction(db, () => insert(db, 'inner'));
        expect(db.isTransaction).toBe(true);
        throw boom;
      }),
    );

    expect(thrown).toBe(boom);
    expect(notes(db)).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('takes a synchronous body only: an async function does not compile', () => {
    // Never invoked: the assertion is the compiler's, enforced by `pnpm typecheck`.
    const neverCalled = () => {
      const db = openDb();
      // @ts-expect-error the body must be synchronous
      transaction(db, async () => 1);
    };
    expect(neverCalled).toBeTypeOf('function');
  });
});
