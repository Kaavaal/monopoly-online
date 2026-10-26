// Player: someone who can join a room, with a unique name and a board token.
import { invalid } from '../../shared/errors.js';

export const TOKENS = ['car', 'hat', 'dog', 'ship', 'boot', 'iron', 'thimble', 'wheelbarrow'] as const;
export type Token = (typeof TOKENS)[number];

export const NAME_MIN = 1;
export const NAME_MAX = 32;

export interface Player {
  id: string;
  name: string;
  token: Token;
  createdAt: string;
}

export interface PlayerRepository {
  insert(player: Player): void;
  update(player: Player): void;
  /** Returns false when no player has this id. */
  delete(id: string): boolean;
  findById(id: string): Player | undefined;
  /** Case-insensitive. */
  findByName(name: string): Player | undefined;
  list(): Player[];
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

export function validateToken(token: string): Token {
  if (!(TOKENS as readonly string[]).includes(token)) {
    throw invalid(`token must be one of ${TOKENS.join(', ')}`);
  }
  return token as Token;
}
