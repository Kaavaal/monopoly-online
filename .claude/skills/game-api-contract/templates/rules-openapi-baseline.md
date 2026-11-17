# API contract rules

<!-- Written by /game-api-contract from its baseline. Yours to edit: the skill reads this file on every run
     and follows it over its own defaults. -->

- A feature's HTTP surface is `docs/features/<slug>/game-contracts/openapi.yaml`, derived by
  `/game-api-contract <slug>`. Routes, route schemas and tests follow it; a change starts in the sources and
  goes through `--reconcile`.
- OpenAPI 3.1.0. Null is `type: [<t>, "null"]`, never `nullable: true`.
- Paths have no version prefix. JSON keys are camelCase; a column `expires_at` is the key `expiresAt`.
- Every refusal is `{ error: { code, message } }` (`src/shared/http.ts`). `code` is `<context>.<reason>` from
  the PRD refusal table (game-adr/0004), the status comes from the kind in `src/shared/errors.ts`:
  `invalid` 400, `unauthorized` 401, `not_found` 404, `conflict` 409. Routes older than 0004 send the bare
  kind until they move.
- A list is a plain array ordered by `createdAt`, then `id`. When a list can outgrow one response it takes
  `?after=<createdAt>_<id>&limit=`; never an offset.
- `BearerAuth` with the opaque player secret from `lobby` is global; an open route declares `security: []`.
- Every schema, response and example used twice goes through `$ref`; no inline object schema under `paths`.
- No `additionalProperties: true` on a response. No real personal data in examples.
- Types: `pnpm exec openapi-typescript <yaml> -o test/contracts/<slug>.game-api.ts --root-types
  --root-types-no-schema-prefix --immutable`, committed with the YAML; `pnpm typecheck` stays green.
