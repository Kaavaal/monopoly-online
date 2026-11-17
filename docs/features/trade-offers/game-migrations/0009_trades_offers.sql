-- trades. Create. Promote with the first trades commit (propose a trade offer), together with 0010.
-- state is pending, accepted or rejected, written by the service; the set lives in trades/domain.
-- An expired offer is not stored: it is a pending row whose expires_at is not later than the clock
-- (sad.md §4, choice 4). created_at and expires_at come from the app clock.
-- proposer_id and recipient_id are lobby players: plain ids, no foreign key across contexts.
CREATE TABLE IF NOT EXISTS trade_offers (
  id TEXT PRIMARY KEY NOT NULL,
  proposer_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  proposer_money INTEGER NOT NULL,
  recipient_money INTEGER NOT NULL,
  state TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS trade_offers_proposer_id ON trade_offers (proposer_id);
CREATE INDEX IF NOT EXISTS trade_offers_recipient_pending ON trade_offers (recipient_id, expires_at)
  WHERE state = 'pending';
