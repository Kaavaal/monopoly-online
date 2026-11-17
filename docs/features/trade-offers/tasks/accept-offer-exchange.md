---
id: T12
title: "Accept a trade offer: the exchange in one transaction"
layer: "ports"
deps: [T3, T11]
external: [P1, P2, P3, P4]
acs: ["AC-07", "AC-08", "AC-09", "AC-12", "AC-14", "AC-16", "AC-17", "AC-18"]
files_hint: ["src/trades/app/service.ts", "src/trades/infra/http/routes.ts", "test/trades/offer.test.ts"]
owner: "Kaavaal"
estimate: "L"
status: "todo"
---

# T12 — Accept a trade offer: the exchange in one transaction

## Why

US-02 and US-07, the flow the three quality goals are about. Derives from [PRD §5 AC-07, AC-16, AC-17, AC-18](../PRD.md), [sad §6 Critical flow 1](../sad.md), [ADR-0002](../adr/0002-exchange-in-one-sqlite-transaction-with-guarded-commands.md), [data-model.md § `trade_offers`](../data-model.md) (`state` is the column it changes) and [openapi.yaml `acceptTradeOffer`](../contracts/openapi.yaml).

## What

- The `accept` use case and route: inside the T3 helper, load the offer, run the answer guards of T11, check both players are in the room, call the guarded command of `board` with every title deed leg and of `bank` with every money leg, mark the offer accepted.
- Any refusal rolls everything back; the offer stays pending. The refusal message of `board` or `bank` is passed on.
- A refused re-check writes one structured line to the request log with the offer id and the reason (sad §8 Logging).

## Definition of Done

- [ ] test AC-07: 200, state accepted, every deed and all money on the other side, the room total unchanged
- [ ] test AC-16: a deed changed owner → 409 naming the deed, nothing moved, the offer still pending
- [ ] test AC-17: a side lacks the money → 409 naming the side, nothing moved, still pending
- [ ] test AC-18: the proposer or the recipient left the room → 409, nothing moved, still pending
- [ ] tests AC-08, AC-09, AC-12 and AC-14 on the accept route, with the bodies of T11
- [ ] test: a refusal that fails several checks returns the first in the order of PRD §5
- [ ] no `await` between the start and the end of the transaction
- [ ] `pnpm check` green

## Notes

- Hard rule (ADR-0002): nothing awaits inside the transaction, in `trades` and in the commands it calls.
- If this passes 500 lines of diff, split the refusal tests AC-16 to AC-18 into a follow-up task.
