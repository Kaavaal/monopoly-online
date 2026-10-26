// Property: A title deed: named, color-grouped lot with price, rent and an optional owner..
import { invalid } from '../../shared/errors.js';

export const COLOR_GROUPS = ['brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue'] as const;
export type ColorGroup = (typeof COLOR_GROUPS)[number];

export const NAME_MIN = 1;
export const NAME_MAX = 40;
export const PRICE_MIN = 1;
export const PRICE_MAX = 400;
export const RENT_MIN = 0;

export interface Property {
  id: string;
  name: string;
  colorGroup: ColorGroup;
  price: number;
  rent: number;
  ownerId: string | null;
  createdAt: string;
}

/** What GET returns: the deed plus its owner's current name, read from lobby. */
export interface PropertyView extends Property {
  ownerName: string | null;
}

export interface PropertyRepository {
  insert(property: Property): void;
  update(property: Property): void;
  /** Returns false when no property has this id. */
  delete(id: string): boolean;
  findById(id: string): Property | undefined;
  /** Case-insensitive. */
  findByName(name: string): Property | undefined;
  list(): Property[];
}

/** What Property needs from other contexts; module.ts wires it from their apis. */
export interface PropertyRefs {
  /** lobby.players */
  ownerExists(id: string): boolean;
  /** lobby.players; undefined when no such player. */
  ownerName(id: string): string | undefined;
}

/** Trims, then counts code points (as JSON schema minLength/maxLength do). */
export function validateName(name: string): string {
  const trimmed = name.trim();
  const length = [...trimmed].length;
  if (length < NAME_MIN || length > NAME_MAX) {
    throw invalid(`name must be ${NAME_MIN}-${NAME_MAX} characters, not blank`);
  }
  return trimmed;
}

export function validateColorGroup(colorGroup: string): ColorGroup {
  if (!(COLOR_GROUPS as readonly string[]).includes(colorGroup)) {
    throw invalid(`colorGroup must be one of ${COLOR_GROUPS.join(', ')}`);
  }
  return colorGroup as ColorGroup;
}

export function validatePrice(price: number): number {
  if (!Number.isInteger(price) || price < PRICE_MIN || price > PRICE_MAX) {
    throw invalid(`price must be an integer from ${PRICE_MIN} to ${PRICE_MAX}`);
  }
  return price;
}

export function validateRent(rent: number): number {
  if (!Number.isInteger(rent) || rent < RENT_MIN) {
    throw invalid(`rent must be an integer of at least ${RENT_MIN}`);
  }
  return rent;
}
