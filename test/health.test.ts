import { describe, expect, it } from 'vitest';

import { makeTestApp } from './helpers/app.js';

describe('GET /health', () => {
  it('answers 200 { ok: true }', async () => {
    const { app } = makeTestApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });
});

describe('GET /health with an injected clock', () => {
  it('answers 200 { ok: true } when the app is built with a fixed clock', async () => {
    const { app } = makeTestApp({ clock: () => new Date('2026-01-01T00:00:00.000Z') });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });
});

describe('migrations', () => {
  it('creates the schema_migrations table', () => {
    const { db } = makeTestApp();
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'")
      .get();
    expect(row?.name).toBe('schema_migrations');
  });
});
