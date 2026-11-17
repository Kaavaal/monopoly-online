---
id: T11
title: "Reject a trade offer"
layer: "ports"
deps: [T9]
external: [P1, P2, P3, P4]
acs: ["AC-08", "AC-09", "AC-10", "AC-10b", "AC-12", "AC-14", "AC-18"]
files_hint: ["src/trades/app/service.ts", "src/trades/infra/http/routes.ts", "test/trades/offer.test.ts"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T11 — Reject a trade offer

## Why

US-03, and the answer guards that accept reuses. Derives from [PRD §5 AC-08, AC-09, AC-10, AC-10b, AC-12, AC-14, AC-18](../PRD.md), [sad §6 Reject a trade offer](../sad.md), [data-model.md § `trade_offers`](../data-model.md) and [openapi.yaml `rejectTradeOffer`](../contracts/openapi.yaml).

## What

- The `reject` use case and route.
- The answer guards, written once for reject and accept: no such offer or not a side of it → `not_found` with one message; the proposer answers → `conflict`; already answered or expired → `conflict` with how it ended.

## Definition of Done

- [ ] test AC-10: 200, state rejected, owners and balances unchanged
- [ ] test AC-10b: the same offer made again at once is a new pending offer with its own lifetime; the earlier one stays rejected
- [ ] test AC-08: the proposer rejects → 409, the offer stays pending
- [ ] tests AC-09 and AC-12: a rejected and an expired offer → 409 that says how it ended
- [ ] test AC-14: a third player and an unknown id get the same 404 body
- [ ] test AC-18: a recipient who left the room still finds the offer in their pending list and can reject it
- [ ] test: a refusal that fails several checks returns the first in the order of PRD §5
- [ ] `pnpm check` green

## Notes

- Same lane as T8–T10.
