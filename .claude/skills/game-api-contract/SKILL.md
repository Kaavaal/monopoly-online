---
name: game-api-contract
description: >
  OpenAPI contract for a monopoly-online feature, derived from its game-data-model.md, game-sad.md §6 and
  game-prd.md, in this repo's conventions: no version prefix, camelCase keys, the `{ error: { code, message } }`
  envelope of src/shared/http.ts with the dotted refusal code of game-adr/0004, plain arrays for lists, the
  lobby player secret as the bearer credential. Same flow as the SDLC api-forge skill (gate, scenario, rules
  bootstrap, endpoints, errors from the sequences, examples, drift check, reconcile), plus openapi-typescript
  codegen and a typecheck of the code that consumes the contract. Writes docs/features/<slug>/game-contracts/
  and test/contracts/<slug>.game-api.ts. Use on "/game-api-contract <slug>", "game api contract for <feature>".
argument-hint: <slug> [--reconcile]
---

# game-api-contract

Projects the design of a feature into one HTTP contract: `docs/features/<slug>/game-contracts/openapi.yaml`
and `api-sync-report.md` beside it. The readers are whoever writes the Fastify routes of the feature and
whoever writes a client for them. Both generate their types from the YAML, so a field that is wrong here is
wrong in two codebases at once.

The person answering is the game owner and the only engineer. Ask about every real decision through
`AskUserQuestion` (recommended option first, each option says what lands in the contract); never answer for
them.

## Inputs

- `<slug>`. Gate: `docs/features/<slug>/game-prd.md`. Missing → stop and point to `/game-prd <slug>`.
- `game-data-model.md` → scenario A (every stored field from a column). Missing → scenario B (fields from the
  PRD and the sequences, listed in `unresolved_origins`). Say which one runs.
- `game-sad.md`: §6 sequences (one operation per flow, one response per `alt` branch), §8 refusals and
  authentication. Missing → note the gap and go on.
- `game-adr/*.md`: an accepted ADR overrides a default below; the report says "by ADR-NNNN".
- `CONTEXT.md`: glossary terms become schema names.
- `src/<context>/infra/http/routes.ts` of the existing contexts and `src/shared/http.ts`, `src/shared/errors.ts`:
  the conventions the contract has to match.
- An existing `game-contracts/openapi.yaml`: diff and update in place, never rewrite.

The track of the plugin skills (`PRD.md`, `sad.md`, `data-model.md`, `contracts/`) is not read.

## Defaults

House style of this repo. `templates/rules-openapi-baseline.md` holds the same list for
`.claude/rules/openapi.md`. A rules file that already exists wins over this table.

| Topic | Default | Why |
|---|---|---|
| Version | OpenAPI `3.1.0`; null as `type: [string, "null"]` | JSON Schema 2020-12, same as Fastify's route schemas |
| Paths | no version prefix: `/trade-offers`, `/players/{id}` | the existing routes; one client, shipped with the server |
| Keys | camelCase; a column `expires_at` is the key `expiresAt` | the existing route schemas |
| Error body | `{ error: { code, message } }` | `src/shared/http.ts` renders every refusal this way, unknown routes included |
| `code` | dotted `<context>.<reason>` from the PRD refusal table (`trades.offer_expired`); the bare kind on routes that predate game-adr/0004 | one field a client can switch on; the kind still sets the status |
| Status | from the kind: `invalid` 400, `unauthorized` 401, `not_found` 404, `conflict` 409 | `src/shared/errors.ts` |
| Lists | a plain array, ordered by `createdAt`, then `id` | tables are per room and small |
| Pagination | none until a list can outgrow one response; then a cursor `?after=<createdAt>_<id>&limit=` | ids are UUID v4, so the cursor needs the time; no offset, pages shift under inserts |
| Auth | `BearerAuth` global, the opaque player secret from `lobby` (not a JWT); open routes declare `security: []` | game-adr/0003 |
| Idempotency | `Idempotency-Key` only on a mutating route behind a retry or an async actor | none today; an accept is guarded by state instead |
| Reuse | `$ref` for every schema, response and example used twice | one place to change a shape |

**Banned in the contract:** an inline object schema under `paths` (use `$ref`), `nullable: true`,
`additionalProperties: true` on a response, a `/api/v1` prefix or `?v=` parameter, snake_case keys, offset
pagination, a field with no origin, real personal data in `example` (use `Test User`, `Test Deed`, made-up
UUIDs like `11111111-1111-4111-8111-111111111111`).

## Where a field's type comes from

SQLite stores ids and times as `TEXT` and has no `VARCHAR(N)`; the repo bans new `CHECK`s. So a constraint
is read from three places, in this order, and the report cites the one used:

| Contract | Source |
|---|---|
| `format: uuid` | a `TEXT` id column (`randomUUID()` in the service) |
| `format: date-time` | a `TEXT` time column (ISO 8601 UTC from the app clock) |
| `type: integer`, `minimum: 0` | an `INTEGER` money or count column |
| `maxLength`, `minLength`, `enum` | 1. a domain constant (`NAME_MAX`, `TOKENS` in `src/<ctx>/domain/*.ts`); 2. the Notes column of game-data-model.md ("at most 140 characters", "`pending`, `accepted` or `rejected`"); 3. a `CHECK` of `0001`/`0003` |
| `type: [<t>, "null"]` | a `NULL` column; required in a response, optional in a request |
| a state the table does not store (`expired`) | the game-sad.md §4 choice that derives it; say so in a comment |

## Protocol

1. **Gate and scenario.** Check `game-prd.md`. Read `game-sad.md` frontmatter `target_surfaces`: only
   `backend-service` gets an OpenAPI contract; anything else gets one line in the report and stops. Detect
   scenario A or B. Print one line: found / missing for game-sad.md and game-data-model.md.
2. **Rules bootstrap.** No `.claude/rules/openapi.md` → copy `templates/rules-openapi-baseline.md` there and
   tell the owner it was written and is theirs to edit. Present → read it; its choices beat the Defaults.
   Where it disagrees with an accepted `game-adr/`, ask the owner which one the contract follows and record
   the answer in the report.
3. **Copy the templates.** `templates/openapi.yaml` → `game-contracts/openapi.yaml`;
   `templates/api-sync-report.md` → `game-contracts/api-sync-report.md`; `templates/events.md` only if a §6 flow
   has an async participant. `info.description` from PRD §1.
4. **Operations and schemas.** One operation per §6 flow, each tied to a PRD user story. Every field has an
   origin from the table above; a field with none is not added, the owner is asked where it comes from. Two
   operations that return the same thing share one schema.
5. **Errors from the sequences.** Every `alt` branch of a flow becomes a response, keyed by status, with one
   named example per branch carrying its dotted code and the PRD's message. Branches with the same status
   share the response; the examples tell them apart. A code in the PRD table with no branch, or a branch with
   no code in the table, is a finding for step 8.
6. **Async and idempotency.** As in the Defaults. An async flow gets an `events.md` entry from the template.
7. **Examples.** Every operation: a request example, a success example, an example per refusal. Placeholder
   data only.
8. **Drift check and report.** Run the five points of `references/drift-check.md` and write the report on
   every run, `FAIL` included. Three or more open findings, or a core point at ✗, pause the run: ask the owner
   per finding (accept as is / fix the contract / open question / fix the source first). Never edit a source
   to make a point pass.
9. **Codegen and typecheck.**

   ```bash
   pnpm exec openapi-typescript docs/features/<slug>/game-contracts/openapi.yaml \
     -o test/contracts/<slug>.game-api.ts --root-types --root-types-no-schema-prefix --immutable
   pnpm typecheck
   ```

   `--root-types` exports each schema by its name (`TradeOffer`), `--immutable` makes a response read-only
   to its consumer. First run with no consumer yet → copy `templates/contract.ts` to
   `test/contracts/<slug>.game-contract.ts` and fill the row types from game-data-model.md. A red typecheck
   after a contract change is the point of this step: paste the `tsc` error into the report and stop. The
   consumer is the implementer's code; this skill does not fix it.
10. **Lint, commit, hand off.** Check the ban list with `references/drift-check.md` § Ban list. Propose
    `docs(<slug>): game api contract` (or the message the owner gives). Hand off: what was written, the
    verdict, the rules bootstrap if it happened, what to review, and the next command: on `PASS` or
    `PASS (with deferrals)` the task breakdown; on `FAIL` the skill that owns the source to fix
    (`/game-prd`, `/game-sad`, `/game-data-model`), then `/game-api-contract <slug> --reconcile`.

## Reconcile

`/game-api-contract <slug> --reconcile` after a source changed. Re-read every input, diff it against the
contract, and change only what the diff touches. A field that left game-data-model.md stays in the YAML with a
`# stale` comment until the owner removes it or restores the column. A new column with no PRD story is added
with a `# unused-in-prd` comment and an open question. Then steps 8 and 9 again: a red typecheck here is the
expected outcome of a real change, and it goes into the report as such. `info.version` changes only when the
owner says so.

## Done

- `game-contracts/openapi.yaml`: every operation tied to a story and a flow, every field with an origin,
  every refusal with its dotted code, nothing from the ban list.
- `game-contracts/api-sync-report.md`: verdict first, field origins, five points, `unresolved_origins`,
  deferrals (or `none`), the codegen result.
- `test/contracts/<slug>.game-api.ts` regenerated and committed with the contract; `pnpm typecheck` green, or
  red with the error in the report and the run not done.
