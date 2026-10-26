// `pnpm migrate`: apply pending migrations to DB_PATH (default monopoly.db) and exit.
import { openDb } from '../src/shared/db.js';
import { MIGRATIONS_DIR, migrate } from '../src/shared/migrate.js';

const path = process.env.DB_PATH ?? 'monopoly.db';
const applied = migrate(openDb(path), MIGRATIONS_DIR);
console.log(applied.length > 0 ? `${path}: applied ${applied.join(', ')}` : `${path}: up to date`);
