import { describe, expect, it } from 'vitest';

import { systemClock } from '../src/shared/clock.js';
import { makeTestApp } from './helpers/app.js';

describe('clock', () => {
  it('builds an app with a fixed clock', async () => {
    const clock = () => new Date('2026-01-01T00:00:00.000Z');
    const { app } = makeTestApp({ clock });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    await app.close();
  });

  it('system clock returns the current time', () => {
    const before = Date.now();
    const now = systemClock().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});
