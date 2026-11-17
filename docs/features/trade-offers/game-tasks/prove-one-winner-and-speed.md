---
id: T13
title: "Prove one winner of two acceptances, and the speed targets"
layer: "ports"
context: "trades"
deps: [T10, T12]
needs: [P2, P3]
acs: [AC-11, AC-11b]
codes: [board.deed_owner_changed, bank.insufficient_funds]
files_hint: [test/trades/offer.test.ts]
estimate: "M"
status: "blocked"
---

# T13 — Prove one winner of two acceptances, and the speed targets

## Why

US-02: two accepted offers must never both spend the same title deed or the same money. The guarantee comes
from the guarded writes of `board` and `bank` inside one transaction, so it is proven through the real
contexts, 100 runs, once accept and the list exist. The speed targets are measured in the same file.

## Linked artifacts

- [game-sad §10 Quality requirements](../game-sad.md#10-quality-requirements): how QG-2 and QG-3 are
  verified; [§6 Flow 1](../game-sad.md#6-runtime-view), the note on two acceptances; §11, the guard risk
- [game-contracts `acceptTradeOffer`](../game-contracts/openapi.yaml): the 409 examples
- [game-prd AC-11](../game-prd.md#ac-11-us-02--timing), [AC-11b](../game-prd.md#ac-11b-us-02--timing),
  [§6](../game-prd.md#6-non-functional-requirements)
- [game-adr 0002](../game-adr/0002-shared-run-exchange-in-one-transaction.md)

## Checklist

1. AC-11: two pending offers that give away the same deed, both acceptances sent without waiting for the
   first answer, repeated 100 times on a fresh app.
2. AC-11b: a player holding 500 who gives 300 in two offers, the same way, 100 times.
3. Timings: p95 of 300 calls of propose, accept and reject, and of 300 list calls for a player with 300
   offers.

## Edge cases

| Case | Expected |
|---|---|
| which acceptance wins | either; exactly one 200 and one 409 in every run |
| the losing offer of AC-11b | stays `pending`; the room's money adds up to what it was |
| a timing misses its target | the test fails and prints the p95; no retry and no widened target without the owner |
| 300 offers for one player | built by moving the clock past each lifetime, since a proposer has one pending offer at a time |

## Definition of Done

- [ ] `test/trades/offer.test.ts`: AC-11, 100 of 100 runs give one `accepted` and one 409 `board.deed_owner_changed`; the deed has exactly one owner
- [ ] `test/trades/offer.test.ts`: AC-11b, 100 of 100 runs give one `accepted` and one 409 `bank.insufficient_funds`; the room's money is unchanged
- [ ] `test/trades/offer.test.ts`: p95 of a write is at most 5 ms and p95 of a list of 300 rows at most 10 ms
- [ ] `pnpm check` green
