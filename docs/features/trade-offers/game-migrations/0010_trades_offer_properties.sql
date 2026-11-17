-- trades. Create. Promote with 0009, in the first trades commit.
-- One row per title deed named in a trade offer; giver_id is the side that gives it (the offer's proposer
-- or its recipient, checked in trades/domain). property_id is a board title deed: a plain id.
-- The primary key starts with offer_id, so it is also the index on the foreign key.
CREATE TABLE IF NOT EXISTS trade_offer_properties (
  offer_id TEXT NOT NULL REFERENCES trade_offers (id),
  property_id TEXT NOT NULL,
  giver_id TEXT NOT NULL,
  PRIMARY KEY (offer_id, property_id)
);
