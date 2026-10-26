// Lobby context: players and rooms. Other contexts reach it only through LobbyApi.
import type { FastifyInstance } from 'fastify';

import type { Db } from '../shared/db.js';

export interface LobbyApi {}

export function createLobbyModule(deps: { db: Db }): {
  register(app: FastifyInstance): void;
  api: LobbyApi;
} {
  return {
    register() {},
    api: {},
  };
}
