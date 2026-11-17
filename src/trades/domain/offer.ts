// TradeOffer: a proposal from one player to another to swap title deeds and/or money, answered as a whole.
import { invalid } from '../../shared/errors.js';

export const OFFER_LIFETIME_MS = 5 * 60 * 1000;
export const NOTE_MAX = 140;

/** The stored states. An expired offer is not stored: see offerState. */
export const OFFER_STATES = ['pending', 'accepted', 'rejected'] as const;
export type OfferState = (typeof OFFER_STATES)[number];
export type DerivedOfferState = OfferState | 'expired';

/** What one side of an offer gives (TradeOfferSide in the contract). */
export interface OfferSide {
  /** Title deed ids this side gives; giver_id in trade_offer_properties is this side's player. */
  propertyIds: string[];
  /** Whole coins this side gives; 0 when none. */
  money: number;
}

/** The terms of a new offer, before it becomes a TradeOffer. */
export interface OfferTerms {
  proposerGives: OfferSide;
  recipientGives: OfferSide;
  note: string | null;
}

export interface TradeOffer extends OfferTerms {
  id: string;
  proposerId: string;
  recipientId: string;
  state: OfferState;
  /** ISO 8601 UTC, Date.toISOString() format: createdAt plus OFFER_LIFETIME_MS. */
  expiresAt: string;
  createdAt: string;
}

export interface OfferRepository {
  /** Writes the offer and one trade_offer_properties row per title deed, together. */
  insert(offer: TradeOffer): void;
  findById(id: string): TradeOffer | undefined;
  /** The proposer's pending offer whose expiresAt is later than `now` (ISO string). */
  findOpenByProposer(proposerId: string, now: string): TradeOffer | undefined;
  /** Pending offers addressed to the recipient with expiresAt later than `now`, by createdAt then id. */
  listPendingForRecipient(recipientId: string, now: string): TradeOffer[];
  /** Every offer of the proposer in any stored state, by createdAt then id. */
  listByProposer(proposerId: string): TradeOffer[];
  setState(id: string, state: OfferState): void;
}

/** What an offer needs from other contexts; module.ts wires these from their apis. Synchronous (ADR-0002). */
export interface OfferLobby {
  /** lobby: the player a player secret belongs to; undefined when unknown. */
  playerIdBySecret(secret: string): string | undefined;
  playerExists(id: string): boolean;
  inSameRoom(playerA: string, playerB: string): boolean;
}

export interface OfferBoard {
  /** board: undefined when no such title deed. */
  deed(id: string): { ownerId: string | null; roomId: string } | undefined;
  /** Guarded command: throws conflict when a giver is not the owner. */
  moveDeeds(moves: { propertyId: string; fromId: string; toId: string }[]): void;
}

export interface OfferBank {
  balanceOf(playerId: string): number;
  /** Guarded command: throws conflict when the payer lacks the money. */
  transfer(fromId: string, toId: string, amount: number): void;
}

/** A pending offer whose expiresAt is not later than `now` is expired; at exactly expiresAt it is. */
export function offerState(offer: Pick<TradeOffer, 'state' | 'expiresAt'>, now: string): DerivedOfferState {
  if (offer.state === 'pending' && offer.expiresAt <= now) return 'expired';
  return offer.state;
}

export function expiresAtFor(createdAt: string): string {
  return new Date(Date.parse(createdAt) + OFFER_LIFETIME_MS).toISOString();
}

function validateSide(name: string, side: OfferSide): void {
  if (!Number.isInteger(side.money) || side.money < 0) {
    throw invalid(`${name}.money must be a whole number of coins, not negative`);
  }
  if (side.propertyIds.length === 0 && side.money === 0) {
    throw invalid(`${name} must hold at least one title deed or some money`);
  }
}

/** Each side gives something, no title deed is named twice, money is whole and not negative, note <= NOTE_MAX. */
export function validateOfferTerms(terms: OfferTerms): OfferTerms {
  validateSide('proposerGives', terms.proposerGives);
  validateSide('recipientGives', terms.recipientGives);

  const seen = new Set<string>();
  for (const id of [...terms.proposerGives.propertyIds, ...terms.recipientGives.propertyIds]) {
    if (seen.has(id)) throw invalid(`title deed ${id} is named twice`);
    seen.add(id);
  }

  if (terms.note !== null && [...terms.note].length > NOTE_MAX) {
    throw invalid(`note must be at most ${NOTE_MAX} characters`);
  }
  return terms;
}
