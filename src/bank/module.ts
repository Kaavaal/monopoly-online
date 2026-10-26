// Bank context: player accounts and money transfers. Other contexts reach it only through BankApi.
import type { FastifyInstance } from 'fastify';

import type { Db } from '../shared/db.js';

export interface BankApi {}

export function createBankModule(deps: { db: Db }): {
  register(app: FastifyInstance): void;
  api: BankApi;
} {
  return {
    register() {},
    api: {},
  };
}
