---
id: T11
title: "Reject a trade offer, and refuse an answer that cannot be given"
layer: "ports"
context: "trades"
deps: [T8]
needs: [P4]
acs: [AC-12, AC-13, AC-14, AC-15, AC-16]
codes: [trades.offer_not_found, trades.only_recipient_answers, trades.offer_already_answered, trades.offer_expired]
files_hint: [src/trades/app/service.ts, src/trades/infra/http/routes.ts, test/trades/offer.test.ts]
estimate: "M"
status: "blocked"
---

# T11 — Reject a trade offer, and refuse an answer that cannot be given

## Why

US-03. Rejecting is the simplest answer: one lookup and one write in `trades`. It builds the four refusals
every answer starts with (who may answer, and whether the offer can still be answered), which accepting
(T12) then reuses unchanged.

## Linked artifacts

- [game-contracts `rejectTradeOffer`](../game-contracts/openapi.yaml): statuses and the order of refusals
- [game-sad §6 Flow 1](../game-sad.md#6-runtime-view): its first four refusal branches are the ones a
  rejection shares; §6 draws no flow for reject itself. [§8 Hidden offers, Time](../game-sad.md#8-crosscutting-concepts)
- [game-prd AC-12](../game-prd.md#ac-12-us-03--happy), [AC-13](../game-prd.md#ac-13-us-02-us-03--timing),
  [AC-14](../game-prd.md#ac-14-us-02-us-03--invariant),
  [AC-15](../game-prd.md#ac-15-us-02-us-03--authorization),
  [AC-16](../game-prd.md#ac-16-us-02-us-03-us-04--authorization), [§10.2](../game-prd.md#102-refusals)
- [CONTEXT.md § Invariants](../CONTEXT.md#invariants), [§ Sentinel errors](../CONTEXT.md#sentinel-errors)

## Checklist

1. `POST /trade-offers/{id}/reject`, happy path: the offer becomes a rejected offer and the proposer can
   propose again at once.
2. One function in the service that loads an offer for an answer and refuses in the order of flow 1:
   `trades.offer_not_found`, `trades.only_recipient_answers`.
3. The same function, the two state refusals: `trades.offer_already_answered`, `trades.offer_expired`.

## Edge cases

| Case | Expected |
|---|---|
| a third player, and an id that never existed | the same status, code and message for both (AC-16) |
| the proposer answers an offer that has also expired | `trades.only_recipient_answers`: checked before the state |
| an accepted or rejected offer past its lifetime | `trades.offer_already_answered`: a final state is checked before the clock |
| a rejection exactly at `expiresAt` | `trades.offer_expired` |
| an id that is not a UUID | bare `invalid` from the schema |

## Definition of Done

- [ ] `test/trades/offer.test.ts`: AC-12 answers 200 with state `rejected`; owners and balances unchanged; the proposer's next proposal with the same terms answers 201
- [ ] `test/trades/offer.test.ts`: 404 `trades.offer_not_found` for a third player, with a body equal to the one for an unknown id; 400 `trades.only_recipient_answers`
- [ ] `test/trades/offer.test.ts`: 409 `trades.offer_already_answered` on a second rejection; 409 `trades.offer_expired` with the clock moved past 5 minutes; the offer keeps its state after each
- [ ] the route declares JSON schemas for params and every response of the contract
- [ ] `pnpm check` green
