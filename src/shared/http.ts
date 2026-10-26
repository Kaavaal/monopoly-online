// One error shape for every route, unknown routes included: { error: { code, message } }.
import type { FastifyError, FastifyInstance } from 'fastify';

import { AppError } from './errors.js';

export function setErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler<FastifyError>((err, req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({ error: { code: err.code, message: err.message } });
    }
    if (err.validation) {
      return reply.status(400).send({ error: { code: 'invalid', message: err.message } });
    }
    // Fastify's own client errors (malformed JSON, wrong content type, body too large) keep their 4xx.
    if (err.code?.startsWith('FST_') && err.statusCode !== undefined && err.statusCode < 500) {
      return reply.status(err.statusCode).send({ error: { code: 'bad_request', message: err.message } });
    }
    req.log.error(err);
    return reply.status(500).send({ error: { code: 'internal', message: 'Internal server error' } });
  });
  app.setNotFoundHandler((req, reply) =>
    reply.status(404).send({ error: { code: 'not_found', message: `${req.method} ${req.url} not found` } }),
  );
}
