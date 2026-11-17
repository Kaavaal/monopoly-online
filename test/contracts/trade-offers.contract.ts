// Stored rows of data-model.md mapped to the TradeOffer of contracts/openapi.yaml. Only tsc checks it:
// after the contract changes, `pnpm contract:types` regenerates trade-offers.api.ts and this has to compile.
import type { components } from './trade-offers.api.js';

type TradeOffer = components['schemas']['TradeOffer'];

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
