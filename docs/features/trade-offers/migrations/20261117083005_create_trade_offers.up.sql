-- trades. Promote as migrations/NNNN_trades_offers.sql.
-- state is pending, accepted or rejected, written by the service. An expired offer is not stored: it is a
-- pending row whose expires_at is not later than the clock (sad.md §4, choice 4).
-- created_at and expires_at come from the app clock, so neither has a DEFAULT.
CREATE TABLE IF NOT EXISTS trade_offers (
  id TEXT PRIMARY KEY,
  proposer_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  proposer_money INTEGER NOT NULL,
  recipient_money INTEGER NOT NULL,
  state TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS trade_offers_proposer_id ON trade_offers (proposer_id);
CREATE INDEX IF NOT EXISTS trade_offers_recipient_pending ON trade_offers (recipient_id, state, expires_at);
