// T3: the transaction helper of src/shared/db.ts. No route uses it before T12, so it is tested directly.
import { beforeEach, describe, expect, it } from 'vitest';

import { openDb, transaction } from '../../src/shared/db.js';
import type { Db } from '../../src/shared/db.js';

let db: Db;

beforeEach(() => {
  db = openDb();
  db.exec('CREATE TABLE notes (text TEXT PRIMARY KEY)');
});

function write(text: string) {
  db.prepare('INSERT INTO notes (text) VALUES (?)').run(text);
}

function notes() {
  return db.prepare('SELECT text FROM notes ORDER BY text').all().map((row) => String(row.text));
}

describe('transaction', () => {
  it('keeps the write visible after the call when the body returns', () => {
    transaction(db, () => {
      write('kept');
    });

    expect(notes()).toEqual(['kept']);
    expect(db.isTransaction).toBe(false);
  });

  it('runs the body inside an open transaction', () => {
    let open = false;

    transaction(db, () => {
      open = db.isTransaction;
    });

    expect(open).toBe(true);
  });

  it('removes the write and lets the same error out when the body throws after a write', () => {
    const boom = new Error('boom');
    let wrote = false;

    expect(() =>
      transaction(db, () => {
        write('lost');
        wrote = true;
        throw boom;
      }),
    ).toThrow(boom);

    expect(wrote).toBe(true);
    expect(notes()).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('rolls the outer transaction back as a whole when a nested call throws', () => {
    const boom = new Error('boom');
    let caught: unknown;
    let reachedInner = false;

    try {
      transaction(db, () => {
        write('outer');
        transaction(db, () => {
          write('inner');
          reachedInner = true;
          throw boom;
        });
      });
    } catch (err) {
      caught = err;
    }

    expect(reachedInner).toBe(true);
    expect(caught).toBe(boom);
    expect(notes()).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('joins the open transaction when nested: the nested call does not commit on its own', () => {
    const boom = new Error('boom');
    let openAfterInner = false;

    expect(() =>
      transaction(db, () => {
        transaction(db, () => {
          write('inner');
        });
        openAfterInner = db.isTransaction;
        throw boom;
      }),
    ).toThrow(boom);

    expect(openAfterInner).toBe(true);
    expect(notes()).toEqual([]);
  });

  it('commits the writes of the outer and the nested call together when both return', () => {
    transaction(db, () => {
      write('outer');
      transaction(db, () => {
        write('inner');
      });
    });

    expect(notes()).toEqual(['inner', 'outer']);
    expect(db.isTransaction).toBe(false);
  });
});

// Compile-time rule, checked by `pnpm typecheck`: the body type is synchronous, so handing the helper an
// async function does not compile. Never called: the rule is about types only.
export function asyncBodyDoesNotCompile(): void {
  // @ts-expect-error an async body returns a promise, which the body type refuses
  transaction(db, async () => {
    write('never');
  });
}
