import { beforeEach, describe, expect, it } from 'vitest';

import { type Db, openDb, transaction } from '../../src/shared/db.js';

let db: Db;

beforeEach(() => {
  db = openDb();
  db.exec('CREATE TABLE notes (text TEXT)');
});

function write(text: string) {
  db.prepare('INSERT INTO notes (text) VALUES (?)').run(text);
}

function notes() {
  return db.prepare('SELECT text FROM notes ORDER BY rowid').all().map((row) => row.text);
}

describe('transaction', () => {
  it('keeps the write and hands back the result when the body returns', () => {
    const result = transaction(db, () => {
      write('kept');
      return 42;
    });

    expect(result).toBe(42);
    expect(notes()).toEqual(['kept']);
    expect(db.isTransaction).toBe(false);
  });

  it('undoes the write and rethrows the same error when the body throws', () => {
    const boom = new Error('boom');

    expect(() =>
      transaction(db, () => {
        write('lost');
        throw boom;
      }),
    ).toThrow(boom);

    expect(notes()).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('rolls the outer transaction back as a whole when a nested call throws', () => {
    const boom = new Error('boom');

    expect(() =>
      transaction(db, () => {
        write('outer');
        transaction(db, () => {
          write('inner');
          throw boom;
        });
      }),
    ).toThrow(boom);

    expect(notes()).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('joins the open transaction: a nested call that returns does not commit', () => {
    expect(() =>
      transaction(db, () => {
        transaction(db, () => write('inner'));
        expect(db.isTransaction).toBe(true);
        throw new Error('after the nested call');
      }),
    ).toThrow('after the nested call');

    expect(notes()).toEqual([]);
  });

  it('does not compile with an async body', () => {
    // Never run: an async body would leave the transaction before its writes happen.
    const typeOnly = () => {
      // @ts-expect-error the body must be synchronous
      transaction(db, async () => {});
      // @ts-expect-error a body that returns a promise is refused too
      transaction(db, () => Promise.resolve(1));
    };
    expect(typeOnly).toBeTypeOf('function');
  });
});
