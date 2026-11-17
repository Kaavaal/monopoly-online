---
id: T8
title: "Propose a trade offer: happy path and request-only refusals"
layer: "ports"
deps: [T7]
external: [P1, P2, P3, P4]
acs: ["AC-01", "AC-02", "AC-03", "AC-05", "AC-06b"]
files_hint: ["src/trades/app/service.ts", "src/trades/infra/http/routes.ts", "test/trades/offer.test.ts"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T8 — Propose a trade offer: happy path and request-only refusals

## Why

US-01, the part that needs no state of other offers. Derives from [PRD §5 AC-01, AC-02, AC-03, AC-05, AC-06b](../PRD.md), [sad §6 Propose a trade offer](../sad.md), [data-model.md § `trade_offers` and `trade_offer_properties`](../data-model.md) and [openapi.yaml `createTradeOffer`](../contracts/openapi.yaml).

## What

- The `propose` use case and the route with its JSON schemas for body and responses.
- Refusals 2–7 of the contract, in its order: schema, proposer other than the acting player, a title deed on both sides, a side that gives nothing, an offer to oneself, a recipient or title deed that does not exist.
- `expires_at` is the clock time plus the offer lifetime.

## Definition of Done

- [ ] test AC-01: 201, state pending, both sides as sent, `expiresAt` five minutes after the controlled clock; owners and balances unchanged
- [ ] tests AC-02, AC-03 (including a side with no title deed and an amount of 0), AC-06b and AC-05 (offer to oneself): 400 `invalid`, no offer recorded, the message names the part to correct
- [ ] test: two refusals at once → the earlier one in the contract order is returned
- [ ] the response matches the `TradeOffer` schema of the contract
- [ ] `pnpm check` green

## Notes

- AC-05 is split: the offer to oneself is here, another room is in T9.
- Lane: shares `service.ts`, `routes.ts` and the test file with T9–T13.
