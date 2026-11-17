// T5: the trade offer rules of src/trades/domain/offer.ts. No route exists before T7, so the domain module is
// tested directly. T7 adds the HTTP tests to this file.
import { describe, expect, it } from 'vitest';

import { AppError } from '../../src/shared/errors.js';
import { OFFER_LIFETIME_MS, offerState, validateOfferTerms } from '../../src/trades/domain/offer.js';
import type { OfferTerms, StoredOfferState } from '../../src/trades/domain/offer.js';

const DEED_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DEED_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const EXPIRES_AT = '2026-11-17T10:05:00.000Z';
const ONE_MS_BEFORE = '2026-11-17T10:04:59.999Z';
const ONE_MS_AFTER = '2026-11-17T10:05:00.001Z';

/** A valid offer: the proposer gives one title deed, the recipient gives money. */
function terms(overrides: Partial<OfferTerms> = {}): OfferTerms {
  return {
    proposerGives: { propertyIds: [DEED_A], money: 0 },
    recipientGives: { propertyIds: [], money: 150 },
    note: null,
    ...overrides,
  };
}

/** Runs the validation and returns what it threw, or undefined when it threw nothing. */
function refusal(offerTerms: OfferTerms): unknown {
  try {
    validateOfferTerms(offerTerms);
  } catch (err) {
    return err;
  }
  return undefined;
}

function expectInvalid(offerTerms: OfferTerms) {
  const err = refusal(offerTerms);
  expect(err).toBeInstanceOf(AppError);
  expect(err).toMatchObject({ status: 400, code: 'invalid' });
}

function expectValid(offerTerms: OfferTerms) {
  expect(refusal(offerTerms)).toBeUndefined();
}

describe('offer lifetime', () => {
  it('is one constant of five minutes', () => {
    expect(OFFER_LIFETIME_MS).toBe(5 * 60 * 1000);
  });
});

describe('derived state of an offer', () => {
  it('is pending for a pending offer one millisecond before expires_at', () => {
    expect(offerState({ state: 'pending', expiresAt: EXPIRES_AT }, ONE_MS_BEFORE)).toBe('pending');
  });

  it('is expired for a pending offer at exactly expires_at (sad §10 QG-3)', () => {
    expect(offerState({ state: 'pending', expiresAt: EXPIRES_AT }, EXPIRES_AT)).toBe('expired');
  });

  it('is expired for a pending offer after expires_at', () => {
    expect(offerState({ state: 'pending', expiresAt: EXPIRES_AT }, ONE_MS_AFTER)).toBe('expired');
  });

  it('stays accepted for an accepted offer, before and after expires_at', () => {
    expect(offerState({ state: 'accepted', expiresAt: EXPIRES_AT }, ONE_MS_BEFORE)).toBe('accepted');
    expect(offerState({ state: 'accepted', expiresAt: EXPIRES_AT }, ONE_MS_AFTER)).toBe('accepted');
  });

  it('stays rejected for a rejected offer, before and after expires_at', () => {
    expect(offerState({ state: 'rejected', expiresAt: EXPIRES_AT }, ONE_MS_BEFORE)).toBe('rejected');
    expect(offerState({ state: 'rejected', expiresAt: EXPIRES_AT }, ONE_MS_AFTER)).toBe('rejected');
  });
});

describe('validation of what an offer names', () => {
  it('lets through an offer where each side gives a title deed or some money', () => {
    expectValid(terms());
    expectValid(
      terms({
        proposerGives: { propertyIds: [], money: 1 },
        recipientGives: { propertyIds: [DEED_B], money: 0 },
      }),
    );
  });

  it('refuses as invalid when the proposer gives neither a title deed nor money', () => {
    expectInvalid(terms({ proposerGives: { propertyIds: [], money: 0 } }));
  });

  it('refuses as invalid when the recipient gives neither a title deed nor money', () => {
    expectInvalid(terms({ recipientGives: { propertyIds: [], money: 0 } }));
  });

  it('refuses as invalid when a title deed is named twice on one side', () => {
    expectInvalid(terms({ proposerGives: { propertyIds: [DEED_A, DEED_A], money: 0 } }));
  });

  it('refuses as invalid when a title deed is named on both sides', () => {
    expectInvalid(
      terms({
        proposerGives: { propertyIds: [DEED_A], money: 0 },
        recipientGives: { propertyIds: [DEED_A], money: 150 },
      }),
    );
  });

  it('refuses as invalid when an amount of money is negative', () => {
    expectInvalid(terms({ recipientGives: { propertyIds: [DEED_B], money: -1 } }));
  });

  it('refuses as invalid when an amount of money is not a whole number', () => {
    expectInvalid(terms({ recipientGives: { propertyIds: [DEED_B], money: 1.5 } }));
  });

  it('lets through an amount of 0 on a side that gives a title deed', () => {
    expectValid(terms({ recipientGives: { propertyIds: [DEED_B], money: 0 } }));
  });

  it('lets through an offer with no note and one with a note of exactly 140 characters', () => {
    expectValid(terms({ note: null }));
    expectValid(terms({ note: 'n'.repeat(140) }));
  });

  it('refuses as invalid when the note is longer than 140 characters', () => {
    expectInvalid(terms({ note: 'n'.repeat(141) }));
  });
});

// Compile-time rule, checked by `pnpm typecheck`: expired is derived, never stored. Never called: the rule is
// about types only.
export function expiredIsNotAStoredState(): StoredOfferState[] {
  const stored: StoredOfferState[] = ['pending', 'accepted', 'rejected'];
  // @ts-expect-error expired is not a state an offer is stored in
  stored.push('expired');
  return stored;
}
