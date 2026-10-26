// Entry point: open the database, apply pending migrations, serve HTTP.
import { buildApp } from './app.js';
import { openDb } from './shared/db.js';
import { MIGRATIONS_DIR, migrate } from './shared/migrate.js';

const db = openDb(process.env.DB_PATH ?? 'monopoly.db');
migrate(db, MIGRATIONS_DIR);

const app = buildApp({ db, logger: true });
await app.listen({ port: Number(process.env.PORT ?? 8080) });
