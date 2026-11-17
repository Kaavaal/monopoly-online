-- trades. Down of 0009_trades_offers: drops the two indexes and the table.
DROP INDEX IF EXISTS trade_offers_recipient_pending;
DROP INDEX IF EXISTS trade_offers_proposer_id;
DROP TABLE IF EXISTS trade_offers;
