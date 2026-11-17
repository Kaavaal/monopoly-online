import { buildApp } from '../../src/app.js';
import type { Clock } from '../../src/shared/clock.js';
import { openDb } from '../../src/shared/db.js';
import { MIGRATIONS_DIR, migrate } from '../../src/shared/migrate.js';

/** Fresh in-memory database with every migration applied, plus the app built on it. */
export function makeTestApp({ clock }: { clock?: Clock } = {}) {
  const db = openDb();
  migrate(db, MIGRATIONS_DIR);
  const app = buildApp({ db, clock });
  return { app, db };
}
