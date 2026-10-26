// Turns context: dice rolls and moves. Other contexts reach it only through TurnsApi.
import type { FastifyInstance } from 'fastify';

import type { Db } from '../shared/db.js';

export interface TurnsApi {}

export function createTurnsModule(deps: { db: Db }): {
  register(app: FastifyInstance): void;
  api: TurnsApi;
} {
  return {
    register() {},
    api: {},
  };
}
