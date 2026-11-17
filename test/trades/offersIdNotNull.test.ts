import { cpSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { openDb } from '../../src/shared/db.js';
import type { Db } from '../../src/shared/db.js';
import { MIGRATIONS_DIR, migrate } from '../../src/shared/migrate.js';
import type { TradeOffer } from '../../src/trades/domain/offer.js';
import { createOfferRepo } from '../../src/trades/infra/sqlite/offerRepo.js';

const INSERT_OFFER =
  "INSERT INTO trade_offers (id, proposer_id, recipient_id, proposer_money, recipient_money, state, note, expires_at, created_at) VALUES (?, 'p1', 'p2', 0, 0, 'pending', NULL, '2026-11-18T00:00:00.000Z', '2026-11-17T00:00:00.000Z')";

/** A database as it was before 0006: migrations 0001 to 0005 only. */
function dbBefore0006(): Db {
  const dir = mkdtempSync(join(tmpdir(), 'migrations-'));
  for (const file of readdirSync(MIGRATIONS_DIR)) {
    if (file < '0006') cpSync(join(MIGRATIONS_DIR, file), join(dir, file));
  }
  const db = openDb();
  migrate(db, dir);
  return db;
}

function indexNames(db: Db): string[] {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'trade_offers' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((row) => String(row.name));
}

describe('0006: trade_offers.id is NOT NULL', () => {
  it('refuses an offer with a NULL id', () => {
    const db = openDb();
    migrate(db, MIGRATIONS_DIR);

    expect(() => db.prepare(INSERT_OFFER).run(null)).toThrow('NOT NULL constraint failed: trade_offers.id');
  });

  it('keeps an offer with a title deed that was inserted before it', () => {
    const db = dbBefore0006();
    const offer: TradeOffer = {
      id: 'offer-1',
      proposerId: 'p1',
      recipientId: 'p2',
      proposerGives: { propertyIds: ['deed-1'], money: 100 },
      recipientGives: { propertyIds: ['deed-2'], money: 0 },
      state: 'pending',
      note: 'Test note',
      expiresAt: '2026-11-18T00:00:00.000Z',
      createdAt: '2026-11-17T00:00:00.000Z',
    };
    createOfferRepo(db).insert(offer);

    expect(migrate(db, MIGRATIONS_DIR)).toEqual(['0006_trades_offers_id_not_null']);

    expect(createOfferRepo(db).findById('offer-1')).toEqual(offer);
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });

  it('drops the rows with a NULL id and keeps both indexes', () => {
    const db = dbBefore0006();
    db.prepare(INSERT_OFFER).run(null);
    db.prepare(INSERT_OFFER).run('offer-1');

    migrate(db, MIGRATIONS_DIR);

    expect(db.prepare('SELECT id FROM trade_offers').all()).toEqual([{ id: 'offer-1' }]);
    expect(indexNames(db)).toEqual(['trade_offers_proposer_id', 'trade_offers_recipient_pending']);
  });

  it('still refuses a title deed of an offer that does not exist', () => {
    const db = dbBefore0006();
    migrate(db, MIGRATIONS_DIR);

    expect(() =>
      db.prepare("INSERT INTO trade_offer_properties (offer_id, property_id, giver_id) VALUES ('no-such-offer', 'deed-1', 'p1')").run(),
    ).toThrow('FOREIGN KEY constraint failed');
  });
});
