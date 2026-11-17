// Rows of game-data-model.md mapped to the response schema of game-contracts/openapi.yaml. Only tsc checks
// this file: after the contract changes and the types are regenerated, it has to compile again.
import type { TradeOffer } from './trade-offers.game-api.js';

export type TradeOfferRow = {
  id: string;
  proposer_id: string;
  recipient_id: string;
  proposer_money: number;
  recipient_money: number;
  state: 'pending' | 'accepted' | 'rejected';
  expires_at: string;
  created_at: string;
};

export type TradeOfferPropertyRow = {
  offer_id: string;
  property_id: string;
  giver_id: string;
};

export function toTradeOffer(row: TradeOfferRow, deeds: TradeOfferPropertyRow[], now: string): TradeOffer {
  const givenBy = (giver: string): string[] =>
    deeds.filter((d) => d.giver_id === giver).map((d) => d.property_id);
  return {
    id: row.id,
    proposerId: row.proposer_id,
    recipientId: row.recipient_id,
    proposerGives: { propertyIds: givenBy(row.proposer_id), money: row.proposer_money },
    recipientGives: { propertyIds: givenBy(row.recipient_id), money: row.recipient_money },
    state: row.state === 'pending' && row.expires_at <= now ? 'expired' : row.state,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
