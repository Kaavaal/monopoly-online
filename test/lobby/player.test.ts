import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { makeTestApp } from '../helpers/app.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

let app: FastifyInstance;

beforeEach(() => {
  app = makeTestApp().app;
});

afterEach(async () => {
  await app.close();
});

function create(payload: object) {
  return app.inject({ method: 'POST', url: '/players', payload });
}

async function createOk(payload: { name: string; token: string }) {
  const res = await create(payload);
  expect(res.statusCode).toBe(201);
  return res.json();
}

function expectError(res: { statusCode: number; json(): unknown }, status: number, code: string) {
  expect(res.statusCode).toBe(status);
  expect(res.json()).toEqual({ error: { code, message: expect.any(String) } });
}

describe('POST /players', () => {
  it('creates a player', async () => {
    const res = await create({ name: 'Alice', token: 'car' });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toEqual({ id: expect.stringMatching(UUID), name: 'Alice', token: 'car', createdAt: expect.any(String) });
    expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
  });

  it('trims the name', async () => {
    expect((await createOk({ name: '  Alice  ', token: 'car' })).name).toBe('Alice');
  });

  it('accepts 32 characters, counted as code points', async () => {
    await createOk({ name: 'a'.repeat(32), token: 'car' });
    await createOk({ name: '🎲'.repeat(32), token: 'hat' });
  });

  it('lets two players share a token', async () => {
    await createOk({ name: 'Alice', token: 'dog' });
    await createOk({ name: 'Bob', token: 'dog' });
  });

  it.each([
    ['empty name', { name: '', token: 'car' }],
    ['blank name', { name: '   ', token: 'car' }],
    ['33-character name', { name: 'a'.repeat(33), token: 'car' }],
    ['33-emoji name', { name: '🎲'.repeat(33), token: 'car' }],
    ['missing name', { token: 'car' }],
    ['unknown token', { name: 'Alice', token: 'cannon' }],
    ['missing token', { name: 'Alice' }],
    ['unknown field', { name: 'Alice', token: 'car', cash: 1500 }],
  ])('rejects %s with 400', async (_, payload) => {
    expectError(await create(payload), 400, 'invalid');
  });

  it('rejects a duplicate name with 409', async () => {
    await createOk({ name: 'Alice', token: 'car' });
    expectError(await create({ name: 'Alice', token: 'hat' }), 409, 'conflict');
  });

  it('rejects a duplicate name in a different case with 409', async () => {
    await createOk({ name: 'Alice', token: 'car' });
    expectError(await create({ name: 'aLICE', token: 'hat' }), 409, 'conflict');
  });

  it('rejects a duplicate name after trimming with 409', async () => {
    await createOk({ name: 'Alice', token: 'car' });
    expectError(await create({ name: ' alice ', token: 'hat' }), 409, 'conflict');
  });
});

describe('GET /players', () => {
  it('returns an empty list', async () => {
    const res = await app.inject({ method: 'GET', url: '/players' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns every player', async () => {
    const alice = await createOk({ name: 'Alice', token: 'car' });
    const bob = await createOk({ name: 'Bob', token: 'hat' });
    const res = await app.inject({ method: 'GET', url: '/players' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
    expect(res.json()).toEqual(expect.arrayContaining([alice, bob]));
  });
});

describe('GET /players/:id', () => {
  it('returns the player', async () => {
    const alice = await createOk({ name: 'Alice', token: 'car' });
    const res = await app.inject({ method: 'GET', url: `/players/${alice.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(alice);
  });

  it('answers 404 for an unknown id', async () => {
    expectError(await app.inject({ method: 'GET', url: `/players/${UNKNOWN_ID}` }), 404, 'not_found');
  });

  it('answers 400 for a non-uuid id', async () => {
    expectError(await app.inject({ method: 'GET', url: '/players/nope' }), 400, 'invalid');
  });
});

describe('PATCH /players/:id', () => {
  function patch(id: string, payload: object) {
    return app.inject({ method: 'PATCH', url: `/players/${id}`, payload });
  }

  it('updates name and token', async () => {
    const alice = await createOk({ name: 'Alice', token: 'car' });
    const res = await patch(alice.id, { name: ' Alicia ', token: 'ship' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ...alice, name: 'Alicia', token: 'ship' });

    const got = await app.inject({ method: 'GET', url: `/players/${alice.id}` });
    expect(got.json()).toEqual({ ...alice, name: 'Alicia', token: 'ship' });
  });

  it('updates one field and keeps the other', async () => {
    const alice = await createOk({ name: 'Alice', token: 'car' });
    const res = await patch(alice.id, { token: 'iron' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ...alice, token: 'iron' });
  });

  it("changes the case of the player's own name", async () => {
    const alice = await createOk({ name: 'Alice', token: 'car' });
    const res = await patch(alice.id, { name: 'ALICE' });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('ALICE');
  });

  it.each([
    ['blank name', { name: '   ' }],
    ['33-character name', { name: 'a'.repeat(33) }],
    ['unknown token', { token: 'cannon' }],
    ['unknown field', { name: 'Alicia', cash: 1500 }],
    ['empty body', {}],
  ])('rejects %s with 400', async (_, payload) => {
    const alice = await createOk({ name: 'Alice', token: 'car' });
    expectError(await patch(alice.id, payload), 400, 'invalid');
  });

  it('rejects a name taken by another player, in any case, with 409', async () => {
    await createOk({ name: 'Alice', token: 'car' });
    const bob = await createOk({ name: 'Bob', token: 'hat' });
    expectError(await patch(bob.id, { name: 'Alice' }), 409, 'conflict');
    expectError(await patch(bob.id, { name: 'alice' }), 409, 'conflict');
  });

  it('answers 404 for an unknown id', async () => {
    expectError(await patch(UNKNOWN_ID, { name: 'Alice' }), 404, 'not_found');
  });

  it('answers 400 for a non-uuid id', async () => {
    expectError(await patch('nope', { name: 'Alice' }), 400, 'invalid');
  });
});

describe('DELETE /players/:id', () => {
  it('deletes the player', async () => {
    const alice = await createOk({ name: 'Alice', token: 'car' });
    const res = await app.inject({ method: 'DELETE', url: `/players/${alice.id}` });
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');

    expectError(await app.inject({ method: 'GET', url: `/players/${alice.id}` }), 404, 'not_found');
  });

  it('frees the name for reuse', async () => {
    const alice = await createOk({ name: 'Alice', token: 'car' });
    await app.inject({ method: 'DELETE', url: `/players/${alice.id}` });
    await createOk({ name: 'Alice', token: 'hat' });
  });

  it('answers 404 for an unknown id', async () => {
    expectError(await app.inject({ method: 'DELETE', url: `/players/${UNKNOWN_ID}` }), 404, 'not_found');
  });

  it('answers 400 for a non-uuid id', async () => {
    expectError(await app.inject({ method: 'DELETE', url: '/players/nope' }), 400, 'invalid');
  });
});
