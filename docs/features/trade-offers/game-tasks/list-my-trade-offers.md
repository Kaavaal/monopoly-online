---
id: T10
title: "List my trade offers as a recipient and as a proposer"
layer: "ports"
context: "trades"
deps: [T8]
needs: [P4]
acs: [AC-16, AC-17, AC-18]
codes: []
files_hint: [src/trades/app/service.ts, src/trades/infra/http/routes.ts, test/trades/offer.test.ts]
estimate: "M"
status: "blocked"
---

# T10 — List my trade offers as a recipient and as a proposer

## Why

US-04: with no arrival signal, the list is the only way a recipient learns an offer needs an answer and a
proposer learns how theirs ended. It needs only offers to exist, so it follows T8.

## Linked artifacts

- [game-contracts `listTradeOffers`](../game-contracts/openapi.yaml): the `role` parameter, order, examples
- [game-sad §8 Hidden offers, Time](../game-sad.md#8-crosscutting-concepts); §6 draws no flow for the list,
  so the contract and the ACs are the source
- [game-prd AC-16](../game-prd.md#ac-16-us-02-us-03-us-04--authorization),
  [AC-17](../game-prd.md#ac-17-us-04--happy), [AC-18](../game-prd.md#ac-18-us-04--happy)
- [game-data-model § Indexes](../game-data-model.md#indexes): the two reads
- [CONTEXT.md § Org-filter invariant](../CONTEXT.md#org-filter-invariant)

## Checklist

1. `GET /trade-offers?role=recipient`: the pending offers addressed to the acting player, with both sides and
   `expiresAt`.
2. `GET /trade-offers?role=proposer`: every offer the acting player sent, each with its state from the state
   function of T6.
3. Expiry in both lists: after 5 minutes the recipient no longer sees the offer and the proposer sees it as
   `expired`.

## Edge cases

| Case | Expected |
|---|---|
| `role` missing or another value | bare `invalid` from the schema |
| a third player, in the room or outside it | both lists are empty of that offer (AC-16) |
| a player with no offers | 200 with an empty array |
| two offers created in the same millisecond | ordered by `createdAt`, then `id` |
| an answered offer | not in the recipient's list; in the proposer's list with its final state |

## Definition of Done

- [ ] `test/trades/offer.test.ts`: `role=recipient` answers 200 with only pending offers addressed to the actor; `role=proposer` with every offer the actor sent and its state
- [ ] `test/trades/offer.test.ts`: a third player gets neither offer in either list (AC-16)
- [ ] `test/trades/offer.test.ts`: with the clock moved past 5 minutes the recipient's list is empty and the proposer's shows `expired` (AC-18)
- [ ] the route declares JSON schemas for the query and every response of the contract
- [ ] `pnpm check` green
