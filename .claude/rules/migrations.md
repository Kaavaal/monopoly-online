---
paths:
  - "docs/features/**/migrations/**"
  - "docs/features/**/data-model.md"
---

# Migration rules — baseline

<!-- Bootstrapped by sdlc/plugin/skills/generate-data-model. Edit freely. -->
<!-- These rules are an opinionated default — see "Defaults" in SKILL.md. -->

## Scope in this repo

These rules cover the **staged** migrations a data-model stage writes under `docs/features/<slug>/migrations/`.
The live `migrations/` tree follows [CLAUDE.md](../../CLAUDE.md): `NNNN_<context>_<name>.sql`, forward-only,
one file per migration. At promote time a staged `.up.sql` is renamed to that form and its `.down.sql` stays
in the feature folder: `src/shared/migrate.ts` rejects any other file name in `migrations/`.

The database is SQLite through `node:sqlite`, so where a rule below names a Postgres type or feature:

- ids and timestamps are `TEXT`, money is `INTEGER`; there is no `VARCHAR(N)`, `UUID`, `TIMESTAMPTZ` or `JSONB`.
- timestamps are ISO 8601 strings written by the app, with no `DEFAULT`, because tests control the clock.
- ids are `randomUUID()` from the service.
- there is no `CREATE INDEX CONCURRENTLY`; migrations run at start, each file in one transaction.
- `NOT NULL` on an existing column needs a table rebuild as its third step.
- a context holds no foreign key into another context's table.

## Filenames

- Format: `<YYYYMMDDhhmmss>_<verb>_<entity>.up.sql` + matching `.down.sql`.
- Reason: parallel feature branches do not collide on the next sequential number.

## Hard rules (DB as dumb storage)

- No `CHECK` constraints on business invariants.
- No `CREATE TRIGGER`.
- No `DEFAULT '<business literal>'` (only `DEFAULT now()` for timestamps).
- No stored procedures.
- Business logic lives in app code.

## Required constraints

- Every `REFERENCES other_table(id)` is followed by `CREATE INDEX` on the FK column (same or next migration).
- Every `.up.sql` has a matching `.down.sql` that fully reverses it.
- `CREATE TABLE` / `CREATE INDEX` use `IF NOT EXISTS`.
- Seed `INSERT` uses `ON CONFLICT DO NOTHING`.

## Defaults

- PK: `UUID v7`, generated app-side. Column type `UUID`.
- Timestamps: `TIMESTAMPTZ NOT NULL DEFAULT now()`.
- Strings: `VARCHAR(N)` bounded; `TEXT` only for URLs / long descriptions.
- Soft delete: NOT used. Hard delete + audit table if business requires history.
- Audit columns: `created_at` only. `updated_at` is opt-in per entity (must be justified — usually means an audit-log or event-sourcing alternative was rejected).
- Naming: `plural snake_case` tables (`users`, `goal_progress`), `snake_case` columns.
- JSONB: only for semantically opaque payload (e.g., `block.payload` for polymorphic content). Structured fields → first-class columns.

## Zero-downtime patterns (mandatory for existing tables)

- New NOT NULL column → 3-step (add nullable → backfill → SET NOT NULL).
- New index on existing table → `CREATE INDEX CONCURRENTLY` (one statement per file — golang-migrate transaction wrapper does not allow CONCURRENTLY inside a tx).
- Rename / drop column → 3-step (add new + dual-write in app code → backfill → drop old). Each phase = separate PR + deploy.

## Seeds

- **Bootstrap** (admin user, default org): hardcoded deterministic UUID v7 in a migration file.
- **Lookup** (statuses, currencies): separate migration, `INSERT ... ON CONFLICT DO NOTHING`.
- **Test fixtures**: NOT in `migrations/`. Generate Go factory functions in `internal/testfixtures/` (or stack-equivalent).
- **PII guard**: no real-looking emails / names. Use `admin@example.test`, `user-<uuid>@example.test`, `Test User`.

## Out of scope

- Multi-DB (read replicas, sharding).
- Partitioning.
- Materialized views.

These are perf / scale topics, not contract topics. Owned by SRE / DBA, decided per-project with a separate ADR.
