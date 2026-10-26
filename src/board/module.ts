// Board context: tiles and title deeds (properties). Other contexts reach it only through BoardApi.
import type { FastifyInstance } from 'fastify';

import type { LobbyApi } from '../lobby/module.js';
import type { Db } from '../shared/db.js';
import { createPropertyService } from './app/service.js';
import { registerPropertyRoutes } from './infra/http/routes.js';
import { createPropertyRepo } from './infra/sqlite/propertyRepo.js';

export interface BoardApi {}

export function createBoardModule(deps: { db: Db; lobby: LobbyApi }): {
  register(app: FastifyInstance): void;
  api: BoardApi;
} {
  const properties = createPropertyService(createPropertyRepo(deps.db), {
    ownerExists: (id) => deps.lobby.players.exists(id),
    ownerName: (id) => deps.lobby.players.nameOf(id),
  });
  return {
    register(app) {
      registerPropertyRoutes(app, properties);
    },
    api: {},
  };
}
