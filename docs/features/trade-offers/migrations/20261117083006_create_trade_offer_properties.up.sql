-- trades. Promote as migrations/NNNN_trades_offer_properties.sql.
-- One row per title deed named in an offer; giver_id is the side that gives it.
-- The primary key starts with offer_id, so it is also the index on the foreign key.
CREATE TABLE IF NOT EXISTS trade_offer_properties (
  offer_id TEXT NOT NULL REFERENCES trade_offers (id),
  property_id TEXT NOT NULL,
  giver_id TEXT NOT NULL,
  PRIMARY KEY (offer_id, property_id)
);
