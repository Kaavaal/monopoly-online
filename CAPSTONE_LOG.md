# Capstone log

Kept by the author, not by feature work. Per feature: start and end time (UTC), prompts verbatim, checks
run, tests passing.

## F1

Player CRUD in `lobby`, by hand: free prompts to Claude Code (Opus 5.5, one session, no plugin, no shell for
Claude), every check run by me. Branch `feature-1/players`, commits `97f4a88` (feature) and `54075c4` (LOG row),
merged into `main` as `c8da8f7`.

| Metric | Value |
| --- | --- |
| first prompt → first green test | 20:53:03 → 20:55:57 UTC, **2.9 min** |
| first prompt → committed with LOG row | 20:53:03 → 20:57:40 UTC, **4.6 min** |
| free prompts | 2 |
| manual checks | 6: `pnpm typecheck` ×2, `pnpm arch:check` ×2, migration on a scratch db ×1, `pnpm test` ×1 |
| manual steps after green | commit, LOG.md row, `chore(log)` commit |
| result | 1 table + 1 fix-forward index migration, 5 source files, 35 HTTP tests (37 with health) |
| model cost | $1.60 |

Prompt 1, verbatim:

> Add the first entity to the lobby context: Player. Full vertical slice per ARCHITECTURE.md — SQL migration, domain
> type and validation, sqlite repository, service, and Fastify CRUD routes: POST /players, GET /players,
> GET /players/:id, PATCH /players/:id, DELETE /players/:id. Fields: id (uuid), name (1–32 chars, unique), token (one
> of car, hat, dog, ship, boot, iron, thimble, wheelbarrow), createdAt (ISO string). Wire it in lobby/module.ts. No
> tests yet, I'll ask for them next.

Prompt 2, verbatim:

> typecheck, arch:check and the migration are green on my side. Decisions on your assumptions: trim the name and
> reject a blank one; name uniqueness is case-insensitive; reject unknown body fields with 400; same token for two
> players is fine. Count the 32 chars the same way in schema and domain. Then write the tests:
> test/lobby/player.test.ts through makeTestApp() — create, list, get, update, delete, plus 400 (bad name, bad
> token, unknown field, non-uuid id), 404 (unknown id on get/patch/delete) and 409 (duplicate name, also with
> different case).

Where it stumbled:

- Prompt 1 came back with five open assumptions (no trim, case-sensitive uniqueness, unknown fields silently
  stripped, length counted differently in schema and domain, shared tokens). Prompt 2 existed mostly to settle them.
  The same questions come back for every entity.
- Claude had no shell, so it could not check its own work and twice asked me to run `pnpm check`. Every check and
  the commit were manual steps.
- Case-insensitive uniqueness arrived after `0001` had been applied to my scratch db, so it became a second,
  fix-forward migration: two migrations for one entity.
- Rejecting unknown fields meant an app-wide Fastify option in `src/app.ts`: a shared-code change inside a lobby
  feature. Fine here, but the kind of edit to keep visible.

What repeats, and so goes into the plugin: the slice request with the field rules (→ `feature-plan` with the
decisions as defaults), the seven files of the slice (→ `monopoly-slice` generator built from these files), the
test matrix (→ generated tests + `feature-tests` for domain rules), the manual checks (→ `pnpm check` inside the
steps + `commit-gate` hook), the commit and LOG row (→ `feature-ship` + `monopoly-slice log-row`), and the context
rule that ARCHITECTURE.md states but nothing enforces at edit time (→ `module-boundary` hook).

## Plugin

## F2

## Comparison
