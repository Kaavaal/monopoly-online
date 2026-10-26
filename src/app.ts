// Composition root: the only file that imports more than one context.
import Fastify, { type FastifyInstance } from 'fastify';

import { createBankModule } from './bank/module.js';
import { createBoardModule } from './board/module.js';
import { createLobbyModule } from './lobby/module.js';
import type { Db } from './shared/db.js';
import { setErrorHandler } from './shared/http.js';
import { createTurnsModule } from './turns/module.js';

export function buildApp({ db, logger = false }: { db: Db; logger?: boolean }): FastifyInstance {
  // Unknown body fields fail validation (400) instead of being stripped silently.
  const app = Fastify({ logger, ajv: { customOptions: { removeAdditional: false } } });
  setErrorHandler(app);

  // Dependency order: a context is created after every context whose api it takes.
  const lobby = createLobbyModule({ db });
  const board = createBoardModule({ db });
  const bank = createBankModule({ db });
  const turns = createTurnsModule({ db });

  lobby.register(app);
  board.register(app);
  bank.register(app);
  turns.register(app);

  app.get('/health', async () => ({ ok: true }));

  return app;
}
