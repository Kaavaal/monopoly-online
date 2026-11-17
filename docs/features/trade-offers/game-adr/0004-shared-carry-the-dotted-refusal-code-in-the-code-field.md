---
status: Accepted
owner: "Kaavaal"
updated_at: "2026-11-17"
feature: "trade-offers"
---

# 0004 Carry the dotted refusal code in the `code` field

## Context

PRD §10.2 gives every refusal of this feature a kind and a dotted code such as `trades.offer_expired` or
`bank.insufficient_funds`. Today `src/shared/errors.ts` has three factories that always put the bare kind
(`invalid`, `not_found`, `conflict`) into `code`, and `src/shared/http.ts` renders `{ error: { code, message } }`.
Trade offers are the first routes with dotted codes, and `board` and `bank` must raise their own inside an
exchange. It is decided now because the contract stage needs to know where a client reads the code.

## Why this is an ADR

| Rework ≥ 3 days | ≥ 2 contexts | Real alternative | Database |
|---|---|---|---|
| no: a change to three factories and the tests that read `code` | yes: `src/shared/errors.ts`, used by every context; `board` and `bank` raise dotted codes too | yes | no |

2 of 4.

## Drivers

- PRD §10.2: 12 dotted codes, three of them owned by `board` and `bank`.
- Repo rule: refusals leave domain and app code as `notFound` / `conflict` / `invalid` from
  `src/shared/errors.ts` (`CLAUDE.md`).
- Repo rule: one error shape for every route, `{ error: { code, message } }` (`src/shared/http.ts`).
- SAD §4 choice 2: a refusal from `board` or `bank` passes through `trades` unchanged.

## Options

1. **An optional code on the three factories**: `conflict(message, code)` and its two siblings put the dotted
   code into `code` and default to the bare kind; the status still comes from the kind.
2. **`AppError` built directly in each context**: no change in `shared`, but the status of each kind is
   repeated wherever a refusal is raised.
3. **The dotted name only in the message**: no change at all, and a client cannot tell refusals apart
   without reading prose.

## Decision

**Chosen**: option 1. The kind keeps deciding the status in one place, the error shape stays as it is, and
routes that pass no code answer exactly as today, so no `lobby` or `board` test changes.

## Consequences

- Good: a client reads one field; the three kinds stay the only way a refusal leaves domain and app code.
- Bad: two styles of `code` live side by side, the bare kind on old routes and the dotted code on new ones,
  until the old routes are moved (SAD §11, accepted debt).
- Bad: dotted codes become part of the contract; renaming one later breaks clients.
- Changes in the repo: `src/shared/errors.ts` (an optional second argument on `notFound`, `conflict`,
  `invalid`). `src/shared/http.ts` stays as it is.

## Links

- PRD: [game-prd.md](../game-prd.md) §10.2
- SAD: [game-sad.md](../game-sad.md) §8 Refusals, §6
- Related ADR: [0002](./0002-shared-run-exchange-in-one-transaction.md) is why `board.*` and `bank.*` codes
  leave through `trades` routes; [0001](./0001-trades-own-trade-offers-in-a-new-context.md) makes the `trades`
  prefix final
- Migration: none
