---
id: T9
title: "Propose a trade offer: refusals that depend on state"
layer: "ports"
deps: [T8]
external: [P1, P3, P4]
acs: ["AC-04", "AC-05", "AC-06"]
files_hint: ["src/trades/app/service.ts", "src/trades/infra/http/routes.ts", "test/trades/offer.test.ts"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T9 — Propose a trade offer: refusals that depend on state

## Why

US-01, the checks against other offers, rooms, owners and balances. Derives from [PRD §5 AC-04, AC-05, AC-06](../PRD.md), [sad §6 Propose a trade offer](../sad.md), [data-model.md § `trade_offers` and `trade_offer_properties`](../data-model.md) and [openapi.yaml `createTradeOffer`](../contracts/openapi.yaml).

## What

- One pending offer per proposer, checked in the service against the clock (data-model.md: no unique index can express it).
- The recipient or a title deed of another room; a side that gives a title deed it does not own or more money than it has.

## Definition of Done

- [ ] test AC-04: a second offer → 409, the message says when the current one runs out
- [ ] test AC-05: a recipient of another room, and a title deed of another room → 409
- [ ] test AC-06: a title deed the side does not own, and more money than the side has, for each side → 409 naming the deed or the amount and the side
- [ ] test: after the first offer has expired (controlled clock) a new offer is recorded
- [ ] `pnpm check` green

## Notes

- Same lane as T8.
