// Trade offer: a proposal from a proposer to a recipient to exchange title deeds and/or money.
import { invalid } from '../../shared/errors.js';

export const STORED_OFFER_STATES = ['pending', 'accepted', 'rejected'] as const;
export type StoredOfferState = (typeof STORED_OFFER_STATES)[number];
/** `expired` is never stored: it is a pending offer whose lifetime has run out. */
export type OfferState = StoredOfferState | 'expired';

/** The offer lifetime: how long an offer stays pending after it is made. */
export const OFFER_LIFETIME_MS = 5 * 60 * 1000;
export const NOTE_MAX = 140;
export const MONEY_MIN = 0;

/** What one side gives. */
export interface OfferSide {
  propertyIds: string[];
  /** Whole coins; 0 when none. */
  money: number;
}

export interface TradeOffer {
  id: string;
  proposerId: string;
  recipientId: string;
  proposerGives: OfferSide;
  recipientGives: OfferSide;
  state: StoredOfferState;
  note: string | null;
  /** ISO 8601 UTC, as every timestamp here. */
  expiresAt: string;
  createdAt: string;
}

export interface OfferRepository {
  /** Writes the offer with its title deeds. */
  insert(offer: TradeOffer): void;
  findById(id: string): TradeOffer | undefined;
  /** The proposer's stored-pending offer that expires later than `now`. */
  findPendingByProposer(proposerId: string, now: string): TradeOffer | undefined;
  /** Stored-pending offers that expire later than `now`, by createdAt, then id. */
  listPendingByRecipient(recipientId: string, now: string): TradeOffer[];
  /** In any state, by createdAt, then id. */
  listByProposer(proposerId: string): TradeOffer[];
  setState(id: string, state: StoredOfferState): void;
}

/** What an offer needs from lobby; module.ts wires it from LobbyApi. */
export interface OfferLobby {
  playerExists(id: string): boolean;
  inSameRoom(playerId: string, otherId: string): boolean;
}

/** What an offer needs from board; module.ts wires it from BoardApi. */
export interface OfferBoard {
  /** undefined when no such title deed. */
  deed(id: string): { ownerId: string | null; roomId: string } | undefined;
  /** Guarded: throws conflict when `fromId` does not own one of the deeds. */
  moveDeeds(propertyIds: string[], fromId: string, toId: string): void;
}

/** What an offer needs from bank; module.ts wires it from BankApi. */
export interface OfferBank {
  balance(playerId: string): number;
  /** Guarded: throws conflict when `fromId` has less than `amount`. */
  moveMoney(amount: number, fromId: string, toId: string): void;
}

export function expiresAtFor(createdAt: string): string {
  return new Date(Date.parse(createdAt) + OFFER_LIFETIME_MS).toISOString();
}

/** A pending offer whose expiresAt is not later than `now` is expired. */
export function offerStateAt(offer: Pick<TradeOffer, 'state' | 'expiresAt'>, now: string): OfferState {
  if (offer.state === 'pending' && offer.expiresAt <= now) return 'expired';
  return offer.state;
}

/** Checks in the order of the contract: the amounts, a title deed named twice, a side that gives nothing. */
export function validateGives(proposerGives: OfferSide, recipientGives: OfferSide): void {
  const sides = [
    { who: 'proposer', gives: proposerGives },
    { who: 'recipient', gives: recipientGives },
  ];

  for (const { who, gives } of sides) {
    if (!Number.isInteger(gives.money) || gives.money < MONEY_MIN) {
      throw invalid(`the money the ${who} gives must be an integer of at least ${MONEY_MIN}`);
    }
  }

  const named = new Set<string>();
  for (const propertyId of sides.flatMap(({ gives }) => gives.propertyIds)) {
    if (named.has(propertyId)) {
      throw invalid(`title deed ${propertyId} is named twice; a trade offer names a title deed once`);
    }
    named.add(propertyId);
  }

  for (const { who, gives } of sides) {
    if (gives.propertyIds.length === 0 && gives.money === 0) {
      throw invalid(`the ${who} gives nothing; each side must give at least one title deed or some money`);
    }
  }
}

/** Counts code points (as JSON schema maxLength does); null when there is no note. */
export function validateNote(note: string | null | undefined): string | null {
  if (note === null || note === undefined) return null;
  if ([...note].length > NOTE_MAX) {
    throw invalid(`note must be at most ${NOTE_MAX} characters`);
  }
  return note;
}
