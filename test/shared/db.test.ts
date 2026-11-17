import { describe, expect, it } from 'vitest';

import { inTransaction, openDb } from '../../src/shared/db.js';

function makeDb() {
  const db = openDb();
  db.exec('CREATE TABLE notes (text TEXT NOT NULL)');
  return db;
}

function notes(db: ReturnType<typeof openDb>) {
  return db
    .prepare('SELECT text FROM notes ORDER BY rowid')
    .all()
    .map((row) => row.text);
}

describe('inTransaction', () => {
  it('keeps the write and hands back the result when the body returns', () => {
    const db = makeDb();

    const result = inTransaction(db, () => {
      db.prepare('INSERT INTO notes (text) VALUES (?)').run('kept');
      return 42;
    });

    expect(result).toBe(42);
    expect(notes(db)).toEqual(['kept']);
    expect(db.isTransaction).toBe(false);
  });

  it('drops the write and rethrows the same error when the body throws', () => {
    const db = makeDb();
    const boom = new Error('boom');

    expect(() =>
      inTransaction(db, () => {
        db.prepare('INSERT INTO notes (text) VALUES (?)').run('lost');
        throw boom;
      }),
    ).toThrow(boom);

    expect(notes(db)).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('joins the open transaction when called inside one', () => {
    const db = makeDb();

    inTransaction(db, () => {
      db.prepare('INSERT INTO notes (text) VALUES (?)').run('outer');
      inTransaction(db, () => {
        db.prepare('INSERT INTO notes (text) VALUES (?)').run('inner');
      });
      expect(db.isTransaction).toBe(true);
    });

    expect(notes(db)).toEqual(['outer', 'inner']);
  });

  it('rolls the outer transaction back as a whole when a nested call throws', () => {
    const db = makeDb();
    const boom = new Error('boom');

    expect(() =>
      inTransaction(db, () => {
        db.prepare('INSERT INTO notes (text) VALUES (?)').run('outer');
        inTransaction(db, () => {
          db.prepare('INSERT INTO notes (text) VALUES (?)').run('inner');
          throw boom;
        });
      }),
    ).toThrow(boom);

    expect(notes(db)).toEqual([]);
    expect(db.isTransaction).toBe(false);
  });

  it('takes a synchronous body only', () => {
    const db = makeDb();

    // @ts-expect-error an async body would commit before its writes ran
    const call = () => inTransaction(db, async () => {});

    expect(call).toBeTypeOf('function');
  });
});
