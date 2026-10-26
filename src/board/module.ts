// Board context: tiles and title deeds (properties). Other contexts reach it only through BoardApi.
import type { FastifyInstance } from 'fastify';

import type { Db } from '../shared/db.js';

export interface BoardApi {}

export function createBoardModule(deps: { db: Db }): {
  register(app: FastifyInstance): void;
  api: BoardApi;
} {
  return {
    register() {},
    api: {},
  };
}
