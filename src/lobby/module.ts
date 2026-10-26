// Lobby context: players and rooms. Other contexts reach it only through LobbyApi.
import type { FastifyInstance } from 'fastify';

import type { Db } from '../shared/db.js';
import { createPlayerService } from './app/service.js';
import { registerPlayerRoutes } from './infra/http/routes.js';
import { createPlayerRepo } from './infra/sqlite/playerRepo.js';

export interface LobbyApi {
  players: { exists(id: string): boolean };
}

export function createLobbyModule(deps: { db: Db }): {
  register(app: FastifyInstance): void;
  api: LobbyApi;
} {
  const playerRepo = createPlayerRepo(deps.db);
  const players = createPlayerService(playerRepo);
  return {
    register(app) {
      registerPlayerRoutes(app, players);
    },
    api: {
      players: { exists: (id) => playerRepo.findById(id) !== undefined },
    },
  };
}
