---
id: T9
title: "Propose a trade offer: not yours to give, and one pending offer per proposer"
layer: "ports"
context: "trades"
deps: [T8]
needs: [P2, P3]
acs: [AC-04, AC-06]
codes: [trades.not_yours_to_give, trades.pending_offer_exists]
files_hint: [src/trades/app/service.ts, test/trades/offer.test.ts]
estimate: "M"
status: "blocked"
---

# T9 — Propose a trade offer: not yours to give, and one pending offer per proposer

## Why

US-01, second half of `proposeTradeOffer`: the two refusals that look at the room as it is now, the owners of
the deeds, the proposer's money and the proposer's earlier offer. Split from T8 so each half stays within a
day.

## Linked artifacts

- [game-contracts `proposeTradeOffer`](../game-contracts/openapi.yaml): refusals 5 and 6
- [game-sad §6 Flow 2](../game-sad.md#6-runtime-view), the last two refusal branches
- [game-prd AC-04](../game-prd.md#ac-04-us-01--error), [AC-06](../game-prd.md#ac-06-us-01--invariant);
  §1 "Decisions kept against the critic" for why AC-04 is `invalid`
- [game-data-model § `trade_offers`](../game-data-model.md#trade_offers--trades-new): why no unique index
  can hold "one pending offer"
- [CONTEXT.md § Invariants](../CONTEXT.md#invariants), [§ Sentinel errors](../CONTEXT.md#sentinel-errors)

## Checklist

1. `trades.not_yours_to_give` for a deed the giving side does not own: one test for the proposer's side, one
   for the recipient's.
2. `trades.not_yours_to_give` for more money than the proposer holds; a test that the recipient's money is
   not checked now.
3. `trades.pending_offer_exists`: lookup, then insert, with no `await` between them; "pending" is asked of
   the state function of T6.

## Edge cases

| Case | Expected |
|---|---|
| the recipient is asked for more money than they hold | the offer is created; checked only at acceptance (AC-09) |
| the earlier offer of the proposer has expired | a new offer is created (AC-18) |
| the earlier offer was rejected or accepted | a new offer is created, the same terms included (AC-12) |
| a second proposal to a different recipient | `trades.pending_offer_exists`; the first offer is unchanged |
| both refusals apply | `trades.not_yours_to_give`: it is checked first |

## Definition of Done

- [ ] `test/trades/offer.test.ts`: 400 `trades.not_yours_to_give` for a deed of each side and for the proposer's money; 201 when only the recipient lacks the money
- [ ] `test/trades/offer.test.ts`: 409 `trades.pending_offer_exists`, and the first offer still lists as `pending` with the same terms
- [ ] `test/trades/offer.test.ts`: a proposal succeeds once the clock is moved 5 minutes past the first offer (vitest fake timers)
- [ ] `pnpm check` green
