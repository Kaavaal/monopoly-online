// Board HTTP routes for properties. Schemas reject bad input with 400 before the service runs; the domain re-checks.
import type { FastifyInstance } from 'fastify';

import type { PropertyInput, PropertyService } from '../../app/service.js';
import { COLOR_GROUPS, NAME_MAX, NAME_MIN, PRICE_MAX, PRICE_MIN, RENT_MIN } from '../../domain/property.js';

const name = { type: 'string', minLength: NAME_MIN, maxLength: NAME_MAX } as const;
const colorGroup = { type: 'string', enum: COLOR_GROUPS } as const;
const price = { type: 'integer', minimum: PRICE_MIN, maximum: PRICE_MAX } as const;
const rent = { type: 'integer', minimum: RENT_MIN } as const;
const ownerId = { type: ['string', 'null'], format: 'uuid' } as const;

const property = {
  type: 'object',
  required: ['id', 'name', 'colorGroup', 'price', 'rent', 'ownerId', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    colorGroup: { type: 'string' },
    price: { type: 'integer' },
    rent: { type: 'integer' },
    ownerId: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
} as const;

const propertyView = {
  ...property,
  required: [...property.required, 'ownerName'],
  properties: { ...property.properties, ownerName: { type: ['string', 'null'] } },
} as const;

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;

type IdParams = { id: string };

export function registerPropertyRoutes(app: FastifyInstance, properties: PropertyService): void {
  app.post<{ Body: PropertyInput }>(
    '/properties',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'colorGroup', 'price', 'rent'],
          properties: { name, colorGroup, price, rent, ownerId },
          additionalProperties: false,
        },
        response: { 201: property },
      },
    },
    async (req, reply) => reply.status(201).send(properties.create(req.body)),
  );

  app.get(
    '/properties',
    { schema: { response: { 200: { type: 'array', items: propertyView } } } },
    async () => properties.list(),
  );

  app.get<{ Params: IdParams }>(
    '/properties/:id',
    { schema: { params: idParams, response: { 200: propertyView } } },
    async (req) => properties.get(req.params.id),
  );

  app.patch<{ Params: IdParams; Body: Partial<PropertyInput> }>(
    '/properties/:id',
    {
      schema: {
        params: idParams,
        body: {
          type: 'object',
          properties: { name, colorGroup, price, rent, ownerId },
          additionalProperties: false,
          minProperties: 1,
        },
        response: { 200: property },
      },
    },
    async (req) => properties.update(req.params.id, req.body),
  );

  app.delete<{ Params: IdParams }>(
    '/properties/:id',
    { schema: { params: idParams, response: { 204: { type: 'null' } } } },
    async (req, reply) => {
      properties.remove(req.params.id);
      return reply.status(204).send();
    },
  );
}
