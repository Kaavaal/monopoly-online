---
id: T6
title: "Model the trade offer, its states and what makes it a trade"
layer: "domain"
context: "trades"
deps: [T1]
needs: []
acs: [AC-02, AC-13, AC-18]
codes: []
files_hint: [src/trades/domain/offer.ts]
estimate: "M"
status: "todo"
---

# T6 — Model the trade offer, its states and what makes it a trade

## Why

Every route reads the state of an offer and three of them refuse by it. The state depends on the clock, and a
query that forgets the clock shows an expired offer as pending (game-sad §11). So the state is computed in one
function here, before the repository and the routes exist.

## Linked artifacts

- [game-prd §9 States](../game-prd.md#9-states), [AC-02](../game-prd.md#ac-02-us-01--error),
  [AC-13](../game-prd.md#ac-13-us-02-us-03--timing), [AC-18](../game-prd.md#ac-18-us-04--happy)
- [game-sad §5 Api calls across a boundary](../game-sad.md#5-building-block-view): the seven calls the ports
  are named after; [§8 Time](../game-sad.md#8-crosscutting-concepts); §11, the clock risk
- [game-data-model § Tables](../game-data-model.md#tables): the stored fields, and that `expired` is never stored
- [CONTEXT.md](../CONTEXT.md): Glossary, Invariants, `trades.not_a_trade`
- [ARCHITECTURE.md § Dependency rule](../../../../ARCHITECTURE.md#dependency-rule)

## Checklist

1. Types: the trade offer with its two sides, the stored states, the offer lifetime of 5 minutes, and one
   function that gives the state of an offer at a moment (pending, accepted, rejected, expired).
2. Validation of a proposal that throws `invalid` with `trades.not_a_trade`: a side gives nothing, the
   recipient is the proposer, a deed is named twice.
3. The repository interface (one method per read of game-data-model § Indexes, plus the two writes) and the
   ports of `lobby`, `board` and `bank` as interfaces, one method per row of the game-sad §5 call table.

## Edge cases

| Case | Expected |
|---|---|
| a pending offer exactly at its `expiresAt` | expired: "not later than the clock" (game-data-model) |
| an accepted or rejected offer after its lifetime | keeps its final state; never expired |
| both sides give money and no deed | a trade |
| money `0` and no deed on one side | `trades.not_a_trade` |
| a negative or fractional amount | never reaches the domain: the route schema refuses it with bare `invalid` (accepted in the sync report) |

## Definition of Done

- [ ] `src/trades/domain/offer.ts` holds the state function; `grep -rn expiresAt src/trades` shows no clock comparison in another file once T7 to T12 land
- [ ] `src/trades/domain/offer.ts` imports only `../../shared/errors.js`; the port interfaces are declared here, not imported from another context
- [ ] `pnpm check` green
