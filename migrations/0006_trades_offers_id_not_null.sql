-- trades. trade_offers.id was `TEXT PRIMARY KEY` without NOT NULL, so SQLite accepted a NULL id, while the
-- domain type says `id: string`. SQLite cannot change a column, so the table is rebuilt; every other column
-- and both indexes are copied from 0004. The runner wraps this file in a transaction.
-- A row with a NULL id is not copied: no title deed can name it and the repository cannot read it.
-- trade_offer_properties points at trade_offers, and foreign keys cannot be switched off inside a
-- transaction. So the rows wait in trade_offers_copy, the checks are deferred to the commit, and the rows
-- return to a table of the same name: by the commit every title deed has its offer again. Dropping the old
-- table and renaming a new one into place would leave the deferred check failing at the commit.
CREATE TABLE trade_offers_copy AS
SELECT id, proposer_id, recipient_id, proposer_money, recipient_money, state, note, expires_at, created_at
FROM trade_offers
WHERE id IS NOT NULL;
PRAGMA defer_foreign_keys = ON;
DROP TABLE trade_offers;
CREATE TABLE trade_offers (
  id TEXT PRIMARY KEY NOT NULL,
  proposer_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  proposer_money INTEGER NOT NULL,
  recipient_money INTEGER NOT NULL,
  state TEXT NOT NULL,
  note TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
INSERT INTO trade_offers (id, proposer_id, recipient_id, proposer_money, recipient_money, state, note, expires_at, created_at)
SELECT id, proposer_id, recipient_id, proposer_money, recipient_money, state, note, expires_at, created_at
FROM trade_offers_copy;
DROP TABLE trade_offers_copy;
CREATE INDEX IF NOT EXISTS trade_offers_proposer_id ON trade_offers (proposer_id);
CREATE INDEX IF NOT EXISTS trade_offers_recipient_pending ON trade_offers (recipient_id, state, expires_at);
