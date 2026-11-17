// Trade offer: a proposal from a proposer to one recipient to exchange title deeds and/or money as a whole.
import { invalid } from '../../shared/errors.js';

export const STORED_OFFER_STATES = ['pending', 'accepted', 'rejected'] as const;
export type StoredOfferState = (typeof STORED_OFFER_STATES)[number];
/** `expired` is never stored: it is derived from `expiresAt` and the clock by `offerState`. */
export type OfferState = StoredOfferState | 'expired';

/** The offer lifetime: how long an offer stays pending after it is created. */
export const OFFER_LIFETIME_MS = 5 * 60 * 1000;
export const NOTE_MAX = 140;

/** What one side gives. `money` 0 means the side gives no money. */
export interface OfferSide {
  propertyIds: string[];
  money: number;
}

export interface OfferTerms {
  proposerGives: OfferSide;
  recipientGives: OfferSide;
  note: string | null;
}

export interface TradeOffer extends OfferTerms {
  id: string;
  proposerId: string;
  recipientId: string;
  state: StoredOfferState;
  /** ISO 8601 UTC, `createdAt` plus the offer lifetime. */
  expiresAt: string;
  createdAt: string;
}

/**
 * The state as of `now`: a pending offer whose `expiresAt` is not later than `now` is expired.
 * Both times are `Date.toISOString()` values, so they compare as text.
 */
export function offerState(offer: Pick<TradeOffer, 'state' | 'expiresAt'>, now: string): OfferState {
  return offer.state === 'pending' && offer.expiresAt <= now ? 'expired' : offer.state;
}

/** Checks what an offer can break on its own, without looking at players, owners or balances. */
export function validateTerms(terms: OfferTerms): void {
  const sides = [
    ['proposerGives', terms.proposerGives],
    ['recipientGives', terms.recipientGives],
  ] as const;

  for (const [name, side] of sides) {
    // Safe: a larger amount in a JSON body has already been rounded to another number.
    if (!Number.isSafeInteger(side.money) || side.money < 0) {
      throw invalid(`${name}.money must be a whole number from 0 to ${Number.MAX_SAFE_INTEGER}`);
    }
  }
  // Code points, as JSON schema maxLength counts them.
  if (terms.note !== null && [...terms.note].length > NOTE_MAX) {
    throw invalid(`note must be at most ${NOTE_MAX} characters`);
  }
  const named = new Set<string>();
  for (const [, side] of sides) {
    for (const propertyId of side.propertyIds) {
      if (named.has(propertyId)) throw invalid(`title deed ${propertyId} is named twice in the offer`);
      named.add(propertyId);
    }
  }
  for (const [name, side] of sides) {
    if (side.propertyIds.length === 0 && side.money === 0) {
      throw invalid(`${name} is empty: each side of a trade offer must give at least one title deed or some money`);
    }
  }
}

export interface TradeOfferRepository {
  /** Writes the offer together with the title deeds it names. */
  insert(offer: TradeOffer): void;
  findById(id: string): TradeOffer | undefined;
  /** The proposer's offer that is still pending as of `now`. */
  findPendingByProposer(proposerId: string, now: string): TradeOffer | undefined;
  /** Offers addressed to the recipient that are still pending as of `now`, by `createdAt`, then `id`. */
  listPendingByRecipient(recipientId: string, now: string): TradeOffer[];
  /** Every offer the proposer made, in any state, by `createdAt`, then `id`. */
  listByProposer(proposerId: string): TradeOffer[];
  /** The answer to a pending offer. Nothing moves an offer back to pending. */
  setState(id: string, state: Exclude<StoredOfferState, 'pending'>): void;
}

/**
 * What a trade offer needs from other contexts; module.ts wires it from their apis.
 * Indicative until the lobby, board and bank prerequisites land (sad §5).
 */
export interface TradeOfferRefs {
  lobby: {
    playerExists(id: string): boolean;
    /** The room the player is in; undefined when in none. */
    roomOf(playerId: string): string | undefined;
  };
  board: {
    /** Undefined when no such title deed. */
    deed(id: string): { ownerId: string | null; roomId: string } | undefined;
    /** Guarded command: throws `conflict` when `fromId` is not the owner. */
    moveDeed(id: string, fromId: string, toId: string): void;
  };
  bank: {
    balanceOf(playerId: string): number;
    /** Guarded command: throws `conflict` when `fromId` has less than `amount`. */
    moveMoney(fromId: string, toId: string, amount: number): void;
  };
}
