---
id: T10
title: "List incoming and outgoing trade offers"
layer: "ports"
deps: [T9]
external: [P1, P2, P3, P4]
acs: ["AC-11", "AC-13", "AC-14", "AC-15"]
files_hint: ["src/trades/app/service.ts", "src/trades/infra/http/routes.ts", "test/trades/offer.test.ts"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T10 — List incoming and outgoing trade offers

## Why

US-04, US-05 and US-06. Derives from [PRD §5 AC-11, AC-13, AC-14, AC-15](../PRD.md), [sad §6 the two list flows and Let an unanswered offer expire](../sad.md), [data-model.md § `trade_offers` and `trade_offer_properties`](../data-model.md) and [openapi.yaml `listIncomingTradeOffers` and `listOutgoingTradeOffers`](../contracts/openapi.yaml).

## What

- The two list use cases and routes. Both read only the offers of the acting player.
- The state in a response is the derived one: an unanswered offer past its lifetime is shown as expired in the outgoing list and is absent from the incoming list.

## Definition of Done

- [ ] test AC-13: incoming holds the pending offers only; an expired one is not shown
- [ ] test AC-15: outgoing holds each offer with its recipient, both sides and its state
- [ ] test AC-11: with the clock moved past `expiresAt` the offer is expired in the outgoing list and nothing changed hands
- [ ] test AC-14 (seeing): a third player gets an empty array from both routes
- [ ] both lists are plain arrays ordered by `createdAt`, then `id`
- [ ] `pnpm check` green

## Notes

- Accepted and rejected states in the outgoing list are asserted in T11 and T12, where they first exist.
- No dependency on T11; they share files, so they run one after the other.
