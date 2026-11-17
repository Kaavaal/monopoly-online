---
name: game-data-model
description: >
  Data model and staged migrations for a monopoly-online feature, on SQLite and the repo's own runner
  (`pnpm migrate`, forward-only `NNNN_<context>_<name>.sql`). Same flow as the SDLC generate-data-model skill
  (prereqs, rules bootstrap, inputs, aggregates, columns, indexes per read, design doc, staged pairs, seeds,
  drift, expand/backfill/contract, self-check), tuned to this repo: SQLite types, context-owned tables,
  promote-ready file names, the table rebuild as the contract step, and an up/down/up rehearsal on a scratch
  file. Writes docs/features/<slug>/game-data-model.md and docs/features/<slug>/game-migrations/. Use on
  "/game-data-model <slug>", "game data model for <feature>".
argument-hint: <slug> [--drift-only]
---

# game-data-model

Turns the PRD and the SAD of a feature into the tables it needs: `docs/features/<slug>/game-data-model.md`
plus migration pairs staged in `docs/features/<slug>/game-migrations/`. The reader is whoever builds the
feature: they promote each pair into `migrations/` in order, together with the code that needs it.

The person answering is the game owner and the only engineer. Ask about every real decision through
`AskUserQuestion` (recommended option first, each option says what lands in the schema); never answer for them.

## Defaults

House style of this repo. `templates/rules-migrations-baseline.md` holds the same list for
`.claude/rules/migrations.md`; [CLAUDE.md](../../../CLAUDE.md) holds the naming rule and the ban.

| Topic | Default | Why |
|---|---|---|
| Runner | `pnpm migrate` → `src/shared/migrate.ts`: each file once, in lexical order, in its own transaction | the only runner the app has; it also runs in every test through `makeTestApp()` |
| File name | `NNNN_<context>_<name>.sql`, next free number, staged with the same name | the runner rejects any other name; a promoted file keeps its name |
| Down file | `NNNN_<context>_<name>.down.sql`, staged only, never promoted | production is forward-only (applied files are frozen); the down exists for the rehearsal |
| Ids | `id TEXT PRIMARY KEY NOT NULL`, `randomUUID()` in the service | SQLite lets a non-integer primary key hold NULL unless told otherwise |
| Time | `TEXT NOT NULL`, ISO 8601 UTC from the app clock, no `DEFAULT` | tests control the clock (`buildApp` takes it) |
| Audit | `created_at` only; `updated_at` only when the owner asks for it | immutable-first |
| Delete | hard delete | no `deleted_at` |
| Money, counts | `INTEGER` | whole numbers, sad.md §8 |
| Strings, states | `TEXT`; length and allowed values live in the domain (`NAME_MAX`, `COLOR_GROUPS`) and the route schema | SQLite ignores `VARCHAR(N)` |
| Foreign keys | only between tables of one context; an id from another context is a plain `TEXT` column | contexts meet through their apis (ARCHITECTURE.md) |
| Indexes | one per read drawn in sad.md §6; an FK column leads an index or the PK | SQLite has no `CONCURRENTLY`; every index is a write cost |
| Banned | new `CHECK`, `TRIGGER`, business `DEFAULT`, JSON columns for structured data | rules live in domain code, the database stores |
| Existing `CHECK`s | copied verbatim when a table is rebuilt, never added, never dropped silently | `0001` and `0003` predate the ban |

## Before you start

1. Read `CLAUDE.md`, `ARCHITECTURE.md`, `src/shared/db.ts`, `src/shared/migrate.ts`, the file names in
   `migrations/` and `.claude/rules/migrations.md` if present.
2. Required, stop with a message if missing: a PRD (`game-prd.md` or `PRD.md`) and a SAD (`game-sad.md` or
   `sad.md`) in `docs/features/<slug>/`. If both of a pair exist, ask which one is the source.
3. Get the current schema by applying the live migrations to an in-memory database:
   `pnpm exec tsx .claude/skills/game-data-model/scripts/schema.ts` (`--sql` adds each stored `CREATE TABLE`,
   the source for a rebuild). No regex parsing of SQL files.
4. `--drift-only`: go straight to step 9.

## Flow

### 1. Rules bootstrap

If `.claude/rules/migrations.md` is missing, or is the SDLC plugin baseline (it says "Bootstrapped by
sdlc/plugin"), write `templates/rules-migrations-baseline.md` there and tell the owner. Otherwise leave it.

### 2. Tables and owners

From PRD §4–§5, the SAD's §5 (which context owns what) and the glossary in `CONTEXT.md`, list each entity
with its owning context and its table name: the glossary term in plural snake_case (`trade offer` →
`trade_offers`). An entity that belongs to a prerequisite feature gets the smallest table that this feature
needs and a line saying which feature owns the rest. Ask the owner to confirm the list and the aggregates
(which table's rows die with which).

### 3. Columns

Apply the defaults. Each column gets a source: an AC, a SAD section or an existing column. Ask about
`updated_at`, about a state that could be stored or derived (derived wins when the SAD says so), and about
every value without a source. Write `<!-- TBD: ... -->` where the owner leaves it open.

### 4. Indexes

Every `Note` or message in sad.md §6 that reads or writes rows by a column is a read. One index per read,
with the read named in the "Read it serves" column; a partial index (`WHERE state = 'pending'`) when the read
filters a state. Show the list and drop any index without a read.

### 5. Breaking changes on an existing table

A new `NOT NULL` column, a rename or a drop on a table that `migrations/` already creates is three pairs and
three commits, each promoted with its code:

| Step | SQL | Code that ships with it |
|---|---|---|
| expand | `ALTER TABLE t ADD COLUMN c TEXT` (nullable: SQLite cannot add `NOT NULL` without a default) | writes `c` on every insert and update; for a rename, writes both columns |
| backfill | one `UPDATE` with a `WHERE c IS NULL` guard; a companion `backfill-<column>.md` with the row count, how to check it and how to undo it | none |
| contract | table rebuild, see `templates/table-rebuild.sql`: create `t_new` with every column, constraint and index of the live `t` copied, `INSERT ... SELECT`, drop, rename, recreate indexes. A drop of an unindexed column may use `ALTER TABLE ... DROP COLUMN` instead | stops reading the old column |

Confirm with the owner that the three steps are wanted (a solo game with no live players may accept one
step; record that choice). The contract step names the commit of the code it waits for.

### 6. Seeds

- Bootstrap rows (a default room): a migration `NNNN_<context>_bootstrap_<thing>.sql` with a fixed id
  (`00000000-0000-7000-8000-000000000001`) and a fixed `created_at` literal, so a re-run writes the same row.
- Lookup rows: `INSERT ... ON CONFLICT DO NOTHING`.
- Test data: not in migrations. Tests build state through HTTP (`makeTestApp()`); a helper that does it goes
  in `test/helpers/`. Names in any seed: `Test User`, `Test Deed`.

### 7. Write the design doc

Fill `templates/data-model.md` into `docs/features/<slug>/game-data-model.md`. Check the `erDiagram`:
cardinality glyphs, one `type name` per attribute line, dotted lines for ids across contexts.

### 8. Write the staged pairs

Into `docs/features/<slug>/game-migrations/`, numbered from the next free live number, one pair per change.
The first line of each file says its context and its step. `CREATE TABLE IF NOT EXISTS`,
`CREATE INDEX IF NOT EXISTS`; a down reverses its own up and nothing else.

### 9. Drift

Map each field of the domain types in `src/<context>/domain/*.ts` (camelCase) and each column the repo in
`src/<context>/infra/sqlite/` reads or writes to the schema from "Before you start", step 3. Report
`field-without-column`, `column-without-field`, `type-mismatch`, `nullability-mismatch`; propose a fix pair in
`game-migrations/_drift/` for each. Then check the model against the spec: every PRD entity has a table,
every table has a PRD or SAD origin. A field this feature adds on purpose (the expand step) is not drift: say
so instead of proposing a fix.

### 10. Self-check

1. Names: plural snake_case tables, `NNNN_<context>_<name>` files matching the runner's pattern.
2. Each down reverses its up.
3. Each FK column leads an index or the PK.
4. No new `CHECK`, `TRIGGER`, business `DEFAULT`: `grep -nE 'CHECK|TRIGGER|DEFAULT'` over the staged ups,
   each hit is either copied from a live file (say which) or a failure.
5. Rehearsal: `pnpm exec tsx .claude/skills/game-data-model/scripts/roundtrip.ts docs/features/<slug>/game-migrations <scratch>.db`.
   It applies the live migrations through the real runner, adds one sample row per existing table, then
   runs ups, downs in reverse and ups again, and compares schema by pragma and every row. Both lines must
   say `same`. The scratch file lives outside the repo or matches `*.db` in `.gitignore`.

Any failure: fix it, or show it to the owner. Never commit past a failure.

### 11. Commit and hand off

Fill the "Check" section of the design doc with the self-check results, the rehearsal output and every TBD.
Commit `docs(<slug>): game-data-model and staged migrations`. Tell the owner what was written, the order in
which the pairs get promoted and with which code, and what is left open.

## Not here

- No writes to the live `migrations/` tree and no `pnpm migrate` against `monopoly.db`.
- No ORM, no query builder: the SQL is the contract.
- No migration that changes two contexts' tables.
- No index without a read in §6.
