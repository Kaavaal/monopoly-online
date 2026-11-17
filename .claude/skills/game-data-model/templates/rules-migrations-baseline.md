---
paths:
  - "migrations/**"
  - "docs/features/**/game-migrations/**"
  - "docs/features/**/game-data-model.md"
  - "docs/features/**/migrations/**"
  - "docs/features/**/data-model.md"
---

# Migrations

SQLite through `node:sqlite`. Runner: `pnpm migrate` (`src/shared/migrate.ts`), also run by every test.

## Files

- Live: `migrations/NNNN_<context>_<name>.sql`, next free number. The runner applies each once, in lexical
  order, in its own transaction, and rejects any other name.
- Applied files are frozen. A fix is a new file.
- A feature stages its pairs in `docs/features/<slug>/game-migrations/` under the name they will be
  promoted with, plus `NNNN_<context>_<name>.down.sql`. The down file never goes to `migrations/`: it is
  for the up/down/up rehearsal (`.claude/skills/game-data-model/scripts/roundtrip.ts`).
- One file changes one context's tables.
- Pairs staged by the SDLC plugin (`<timestamp>_<verb>_<entity>.up.sql`) are renamed to the live form when
  promoted; the rehearsal script reads both forms.

## Columns

- `id TEXT PRIMARY KEY NOT NULL`, `randomUUID()` in the service.
- Time: `TEXT NOT NULL`, ISO 8601 UTC from the app clock, no `DEFAULT`.
- `created_at` only. `updated_at` when the owner asked for it, with the reason in the design doc.
- Money and counts: `INTEGER`. Strings and states: `TEXT`; bounds and allowed values live in the domain.
- Hard delete. No `deleted_at`.
- Foreign keys only inside one context. An id from another context is a plain `TEXT` column.

## Banned

- New `CHECK`, `TRIGGER`, `DEFAULT` with a business value, JSON columns for structured data.
- The `CHECK`s in `0001` and `0003` stay as they are; a rebuild copies them verbatim.

## Indexes

- One per read drawn in the feature's sad.md §6. A foreign key column leads an index or the primary key.
- `CREATE INDEX IF NOT EXISTS`. There is no `CONCURRENTLY`; the tables are small.

## Existing tables

- New `NOT NULL` column, rename or drop: expand (nullable column) → backfill (`UPDATE ... WHERE c IS NULL`
  plus `backfill-<column>.md`) → contract (table rebuild). Three files, three commits, each with its code.

## Seeds

- Bootstrap rows: fixed id (`00000000-0000-7000-8000-000000000001`) and fixed `created_at`.
- Lookup rows: `INSERT ... ON CONFLICT DO NOTHING`.
- Test data comes through HTTP in tests, not from migrations. Names: `Test User`, `Test Deed`.
