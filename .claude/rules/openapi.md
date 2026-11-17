---
paths:
  - "docs/features/**/contracts/**"
  - "docs/features/**/game-contracts/**"
  - "test/contracts/**"
  - "src/*/infra/http/**"
  - "src/shared/http.ts"
  - "src/shared/errors.ts"
---

# API contract rules

<!-- Bootstrapped by /sdlc:api-forge on 2026-11-17 from its baseline, then changed where this repo already
     decided otherwise. api-forge reads this file on every run and records deviations in api-sync-report.md. -->

## Where the contract lives

- `docs/features/<slug>/contracts/openapi.yaml` is the source of truth for the HTTP surface of a feature.
  Routes, their JSON schemas and tests follow it.
- The contract is derived from `data-model.md`, the `sad.md` §6 sequences and the `PRD.md` acceptance criteria
  by `/sdlc:api-forge <slug>`. After a hand edit or an upstream change, run `/sdlc:api-forge <slug> --reconcile`
  so `api-sync-report.md` stays true.
- `info.version` changes only with an explicit CHANGELOG line.

## Hard rules

- OpenAPI 3.1.0. Nullability is `type: [string, "null"]`; `nullable: true` is not used.
- Every error response is the envelope of `src/shared/http.ts`: `{ error: { code, message } }`.
- `code` is a kind from `src/shared/errors.ts` (`invalid`, `not_found`, `conflict`; `unauthorized` once the
  `lobby` player secret ships). A contract advertises no code that file cannot produce. `message` carries the
  specifics: the title deed, the amount, the side.
- Exception: contracts under `game-contracts/` follow game-adr/0004 and carry the dotted `<context>.<reason>`
  code; the status still comes from the kind.
- Shared types go through `$ref`; no schema is written inline twice.
- No `additionalProperties: true` on a response shape.
- No real personal data in `example` blocks: `Test User`, `Test Deed`, made-up UUIDs.

## Defaults

- Paths have no version prefix: `/players`, `/properties`, `/trade-offers`.
- JSON keys are camelCase (`createdAt`, `colorGroup`), as in the existing routes. A column `expires_at` is
  the key `expiresAt`.
- A list is a plain JSON array ordered by `createdAt`, then `id`. No pagination until a list outgrows one
  response.
- `BearerAuth` is the global default in a contract whose routes need the acting player; the credential is the
  opaque player secret, not a JWT. A route open to anyone declares `security: []`.
- A mutating route behind a retry or an asynchronous actor requires an `Idempotency-Key` header. No route has
  either today.
- Status follows the kind: `400` `invalid`, `401` `unauthorized`, `404` `not_found` (also when the caller may
  not know the thing exists), `409` `conflict`. Schema names use the domain language of the feature's
  `CONTEXT.md` (`TradeOffer`, `TradeOfferCreate`).

## Deviations from the api-forge baseline

Decided by the owner on 2026-11-17, during the trade-offers run. No ADR records them yet.

| Baseline | This repo | Why |
|---|---|---|
| `/api/v1/...` | no prefix | existing `lobby` and `board` routes |
| snake_case keys | camelCase keys | existing route schemas |
| `{code, message, details?}` | `{ error: { code, message } }` | `src/shared/http.ts`, ARCHITECTURE.md |
| `code` = `module.error_name` | `code` = the kind | CLAUDE.md; trade-offers `sad.md` §8, "no new kind" |
| cursor page wrapper | plain array | existing list routes; tables are small |

## Checks

- Lint with `pnpm dlx @stoplight/spectral-cli lint docs/features/<slug>/contracts/openapi.yaml` and a ruleset
  that extends `spectral:oas`. It is not part of `pnpm check` yet.
- A change to the contract and the matching route land in the same commit series, with `api-sync-report.md`
  re-run and its verdict at `PASS` or `PASS (with deferrals)`.
