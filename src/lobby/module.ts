// Lobby context: players and rooms. Other contexts reach it only through LobbyApi.
import type { FastifyInstance } from 'fastify';

import type { Db } from '../shared/db.js';
import { createPlayerService } from './app/service.js';
import { registerPlayerRoutes } from './infra/http/routes.js';
import { createPlayerRepo } from './infra/sqlite/playerRepo.js';

export interface LobbyApi {}

export function createLobbyModule(deps: { db: Db }): {
  register(app: FastifyInstance): void;
  api: LobbyApi;
} {
  const players = createPlayerService(createPlayerRepo(deps.db));
  return {
    register(app) {
      registerPlayerRoutes(app, players);
    },
    api: {},
  };
}
