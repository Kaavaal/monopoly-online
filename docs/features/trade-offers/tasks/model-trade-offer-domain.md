---
id: T5
title: "Model the trade offer in src/trades/domain/offer.ts"
layer: "domain"
deps: []
external: []
acs: ["AC-02", "AC-03", "AC-11"]
files_hint: ["src/trades/domain/offer.ts"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T5 — Model the trade offer in `src/trades/domain/offer.ts`

## Why

The rules of an offer live in the domain, not in the schema or the database. Derives from [sad §5](../sad.md), [PRD §5 AC-02, AC-03, AC-11](../PRD.md) and [ADR-0001](../adr/0001-own-trade-offers-in-a-new-trades-context.md).

## What

- The trade offer type, the stored states (pending, accepted, rejected) and the derived state: a pending offer whose `expires_at` is not later than the clock is an expired offer.
- The offer lifetime as one constant (five minutes).
- Validation that returns `invalid`: each side gives something, no title deed named twice, whole non-negative money, a note of at most 140 characters.
- The repository interface and what an offer needs from `lobby`, `board` and `bank`, as interfaces owned by `trades`.

## Definition of Done

- [ ] the file imports nothing outside `src/trades/domain` and `src/shared`
- [ ] the derived state at exactly `expires_at` is expired (sad §10 QG-3)
- [ ] `pnpm typecheck` and `pnpm arch:check` green

## Notes

- Tests go through HTTP (CLAUDE.md), so the rules are first exercised by T8. This task is checked by the compiler and the arch rules only.
- The port shapes are indicative until P1–P4 land (sad §5); T7 binds them to the real apis.
