// Lobby HTTP routes. Schemas reject bad input with 400 before the service runs; the domain re-checks.
import type { FastifyInstance } from 'fastify';

import type { PlayerService } from '../../app/service.js';
import { NAME_MAX, NAME_MIN, TOKENS } from '../../domain/player.js';

const name = { type: 'string', minLength: NAME_MIN, maxLength: NAME_MAX } as const;
const token = { type: 'string', enum: TOKENS } as const;

const player = {
  type: 'object',
  required: ['id', 'name', 'token', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    token: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
} as const;

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;

type IdParams = { id: string };

export function registerPlayerRoutes(app: FastifyInstance, players: PlayerService): void {
  app.post<{ Body: { name: string; token: string } }>(
    '/players',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'token'],
          properties: { name, token },
          additionalProperties: false,
        },
        response: { 201: player },
      },
    },
    async (req, reply) => reply.status(201).send(players.create(req.body)),
  );

  app.get(
    '/players',
    { schema: { response: { 200: { type: 'array', items: player } } } },
    async () => players.list(),
  );

  app.get<{ Params: IdParams }>(
    '/players/:id',
    { schema: { params: idParams, response: { 200: player } } },
    async (req) => players.get(req.params.id),
  );

  app.patch<{ Params: IdParams; Body: { name?: string; token?: string } }>(
    '/players/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          properties: { name, token },
          additionalProperties: false,
          minProperties: 1,
        },
        response: { 200: player },
      },
    },
    async (req) => players.update(req.params.id, req.body),
  );

  app.delete<{ Params: IdParams }>(
    '/players/:id',
    { schema: { params: idParams, response: { 204: { type: 'null' } } } },
    async (req, reply) => {
      players.remove(req.params.id);
      return reply.status(204).send();
    },
  );
}
