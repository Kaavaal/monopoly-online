import { describe, expect, it } from 'vitest';

import { AppError } from '../../src/shared/errors.js';
import {
  NOTE_MAX,
  OFFER_LIFETIME_MS,
  expiresAtFor,
  offerStateAt,
  validateGives,
  validateNote,
} from '../../src/trades/domain/offer.js';
import type { OfferSide } from '../../src/trades/domain/offer.js';

const DEED_A = '11111111-1111-4111-8111-111111111111';
const DEED_B = '22222222-2222-4222-8222-222222222222';

const CREATED_AT = '2026-11-17T12:00:00.000Z';
const EXPIRES_AT = '2026-11-17T12:05:00.000Z';

function side(overrides: Partial<OfferSide> = {}): OfferSide {
  return { propertyIds: [], money: 0, ...overrides };
}

/** The message of the `invalid` the call is refused with. */
function refusal(call: () => unknown): string {
  try {
    call();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('invalid');
    return (error as AppError).message;
  }
  throw new Error('expected the call to be refused');
}

describe('offer lifetime', () => {
  it('is five minutes', () => {
    expect(OFFER_LIFETIME_MS).toBe(5 * 60 * 1000);
  });

  it('puts expiresAt one lifetime after createdAt', () => {
    expect(expiresAtFor(CREATED_AT)).toBe(EXPIRES_AT);
  });
});

describe('offerStateAt', () => {
  const pending = { state: 'pending', expiresAt: EXPIRES_AT } as const;

  it('keeps a pending offer pending one millisecond before expiresAt', () => {
    expect(offerStateAt(pending, '2026-11-17T12:04:59.999Z')).toBe('pending');
  });

  it('makes a pending offer expired at exactly expiresAt', () => {
    expect(offerStateAt(pending, EXPIRES_AT)).toBe('expired');
  });

  it('makes a pending offer expired after expiresAt', () => {
    expect(offerStateAt(pending, '2026-11-17T12:05:00.001Z')).toBe('expired');
  });

  it.each(['accepted', 'rejected'] as const)('keeps an %s offer as it is after expiresAt', (state) => {
    expect(offerStateAt({ state, expiresAt: EXPIRES_AT }, '2026-11-17T13:00:00.000Z')).toBe(state);
  });
});

describe('validateGives', () => {
  it('takes title deeds for money', () => {
    expect(() => validateGives(side({ propertyIds: [DEED_A] }), side({ money: 100 }))).not.toThrow();
  });

  it('takes a side that gives a title deed and an amount of zero', () => {
    expect(() => validateGives(side({ propertyIds: [DEED_A], money: 0 }), side({ propertyIds: [DEED_B] }))).not.toThrow();
  });

  it('refuses a proposer who gives nothing', () => {
    expect(refusal(() => validateGives(side(), side({ money: 100 })))).toMatch(/proposer/);
  });

  it('refuses a recipient who gives nothing', () => {
    expect(refusal(() => validateGives(side({ money: 100 }), side()))).toMatch(/recipient/);
  });

  it('refuses a title deed named on both sides and names it', () => {
    const message = refusal(() => validateGives(side({ propertyIds: [DEED_A] }), side({ propertyIds: [DEED_A] })));

    expect(message).toContain(DEED_A);
  });

  it('refuses a title deed named twice on one side and names it', () => {
    const message = refusal(() => validateGives(side({ propertyIds: [DEED_B, DEED_B] }), side({ money: 1 })));

    expect(message).toContain(DEED_B);
  });

  it.each([-1, 1.5, Number.NaN])('refuses %s as the proposer money', (money) => {
    expect(refusal(() => validateGives(side({ money }), side({ money: 100 })))).toMatch(/proposer/);
  });

  it.each([-1, 1.5, Number.NaN])('refuses %s as the recipient money', (money) => {
    expect(refusal(() => validateGives(side({ money: 100 }), side({ money })))).toMatch(/recipient/);
  });
});

describe('validateNote', () => {
  it('hands back a note of exactly the maximum length', () => {
    const note = 'n'.repeat(NOTE_MAX);

    expect(NOTE_MAX).toBe(140);
    expect(validateNote(note)).toBe(note);
  });

  it('refuses a note one character over the maximum', () => {
    expect(refusal(() => validateNote('n'.repeat(NOTE_MAX + 1)))).toMatch(/140/);
  });

  it('counts code points, as the JSON schema maxLength does', () => {
    const note = '🎲'.repeat(NOTE_MAX);

    expect(validateNote(note)).toBe(note);
  });

  it.each([null, undefined])('turns %s into no note', (note) => {
    expect(validateNote(note)).toBeNull();
  });
});
