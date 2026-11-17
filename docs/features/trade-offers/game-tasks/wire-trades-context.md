---
id: T3
title: "Wire an empty trades context last in the composition root"
layer: "wiring"
context: "trades"
deps: []
needs: []
acs: [AC-01]
codes: []
files_hint: [src/trades/module.ts, src/app.ts, ARCHITECTURE.md, CLAUDE.md]
estimate: "S"
status: "todo"
---

# T3 — Wire an empty trades context last in the composition root

## Why

Trade offers live in a new `trades` context that takes the apis of `lobby`, `board` and `bank`. Creating the
empty module now fixes the creation order and the context map before any route exists, so the route tasks
only fill it in.

## Linked artifacts

- [game-adr 0001](../game-adr/0001-trades-own-trade-offers-in-a-new-context.md): the decision and the list
  of repo changes
- [game-sad §5 Building block view](../game-sad.md#5-building-block-view): slice and context map delta
- [game-prd AC-01](../game-prd.md#ac-01-us-01--happy)
- [ARCHITECTURE.md](../../../../ARCHITECTURE.md): context map, creation order, public api rule
- [src/app.ts](../../../../src/app.ts), [src/bank/module.ts](../../../../src/bank/module.ts) as the shape of
  an empty module

## Checklist

1. Add `src/trades/module.ts`: `createTradesModule({ db, lobby, board, bank })` with an empty `TradesApi` and
   a `register` that adds nothing yet; the three apis are type-only imports from the other `module.ts` files.
2. Create and register `trades` last in `src/app.ts`, after `turns`.
3. Update `ARCHITECTURE.md` (a `trades` row, the three arrows, the creation order) and the context list in
   the first line of `CLAUDE.md`.

## Edge cases

| Case | Expected |
|---|---|
| `trades` imports anything of another context but its `module.ts` | `pnpm arch:check` red (`no-cross-context-internals`); move the code |
| another context imports `trades` | not allowed: nothing points to `trades` (game-sad §5) |
| existing routes | answer as before; `test/lobby`, `test/board`, `test/health.test.ts` unchanged |

## Definition of Done

- [ ] `src/app.ts` creates the modules in the order lobby, board, bank, turns, trades
- [ ] `ARCHITECTURE.md` context map and mermaid graph show `trades` using `lobby`, `board`, `bank`
- [ ] `pnpm check` green
