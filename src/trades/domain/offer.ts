// Trade offer: a proposal from one player to another to exchange title deeds and/or money.
// T5 stub: types and signatures only; the bodies and the lifetime value are not implemented yet.

/** What is written to trade_offers.state. */
export type StoredOfferState = 'pending' | 'accepted' | 'rejected';

/** Stored states plus the derived one: an expired offer is never stored. */
export type OfferState = StoredOfferState | 'expired';

/** The offer lifetime in milliseconds. Stub value; T5 sets it. */
export const OFFER_LIFETIME_MS: number = 0;

/** What one side gives. */
export interface OfferSide {
  /** Title deeds this side gives; empty when none. */
  propertyIds: string[];
  /** Whole coins this side gives; 0 when none. */
  money: number;
}

/** The part of an offer the proposer chooses; what `validateOfferTerms` checks. */
export interface OfferTerms {
  proposerGives: OfferSide;
  recipientGives: OfferSide;
  /** null when none. */
  note: string | null;
}

export interface TradeOffer extends OfferTerms {
  id: string;
  proposerId: string;
  recipientId: string;
  state: StoredOfferState;
  /** ISO 8601 UTC, as `Date.toISOString()` writes it. */
  expiresAt: string;
  /** ISO 8601 UTC, as `Date.toISOString()` writes it. */
  createdAt: string;
}

/** `now` is ISO 8601 UTC wherever it appears: the repository reads no clock. */
export interface OfferRepository {
  insert(offer: TradeOffer): void;
  findById(id: string): TradeOffer | undefined;
  /** The unanswered offer of a proposer whose lifetime has not run out at `now`. */
  findPendingByProposer(proposerId: string, now: string): TradeOffer | undefined;
  /** Unanswered offers addressed to a recipient whose lifetime has not run out at `now`. */
  listPendingByRecipient(recipientId: string, now: string): TradeOffer[];
  /** Every offer a proposer made, in any state. */
  listByProposer(proposerId: string): TradeOffer[];
  setState(id: string, state: StoredOfferState): void;
}

/** What an offer needs from lobby. Indicative until P1 and P2 land; module.ts wires it. */
export interface OfferPlayers {
  /** The player a player secret belongs to; undefined when unknown. */
  playerBySecret(secret: string): string | undefined;
  playerExists(id: string): boolean;
  inSameRoom(playerA: string, playerB: string): boolean;
}

/** What an offer needs from board. Indicative until P3 lands; module.ts wires it. */
export interface OfferDeeds {
  /** Owner and room of a title deed; undefined when no such deed. */
  findDeed(propertyId: string): { ownerId: string | null; roomId: string } | undefined;
  /** Guarded command: refuses when `fromId` does not own one of the deeds. */
  moveDeeds(propertyIds: string[], fromId: string, toId: string): void;
}

/** What an offer needs from bank. Indicative until P4 lands; module.ts wires it. */
export interface OfferMoney {
  balance(playerId: string): number;
  /** Guarded command: refuses when `fromId` holds less than `amount`. */
  moveMoney(fromId: string, toId: string, amount: number): void;
}

/** The state of an offer at `now` (ISO 8601 UTC): the stored state, or `expired` when derived. */
export function offerState(offer: Pick<TradeOffer, 'state' | 'expiresAt'>, now: string): OfferState {
  void offer;
  void now;
  throw new Error('not implemented');
}

/** Throws `invalid` when the terms break a rule of a trade offer; returns nothing otherwise. */
export function validateOfferTerms(terms: OfferTerms): void {
  void terms;
  throw new Error('not implemented');
}
