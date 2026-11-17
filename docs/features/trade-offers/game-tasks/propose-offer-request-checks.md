---
id: T8
title: "Propose a trade offer: a pending offer, and requests that are not a trade"
layer: "ports"
context: "trades"
deps: [T3, T7]
needs: [P1, P2, P3, P4]
acs: [AC-01, AC-02, AC-03, AC-05]
codes: [trades.not_a_trade, trades.unknown_player_or_deed, trades.recipient_not_in_room]
files_hint: [src/trades/app/service.ts, src/trades/infra/http/routes.ts, src/trades/module.ts, test/trades/offer.test.ts]
estimate: "L"
status: "blocked"
---

# T8 — Propose a trade offer: a pending offer, and requests that are not a trade

## Why

US-01: the first route of the context and the first half of `proposeTradeOffer`. It builds the service, the
route and the test helpers every later route task reuses, and the first three refusals of the flow. The two
refusals that depend on ownership, money and an earlier offer follow in T9.

## Linked artifacts

- [game-contracts `proposeTradeOffer`](../game-contracts/openapi.yaml): schemas, statuses, the order of refusals
- [game-sad §6 Flow 2](../game-sad.md#6-runtime-view); [§8 Acting player, Validation](../game-sad.md#8-crosscutting-concepts)
- [game-prd AC-01](../game-prd.md#ac-01-us-01--happy), [AC-02](../game-prd.md#ac-02-us-01--error),
  [AC-03](../game-prd.md#ac-03-us-01--error), [AC-05](../game-prd.md#ac-05-us-01--cross-context),
  [§10.2](../game-prd.md#102-refusals) for the messages
- [game-adr 0003](../game-adr/0003-lobby-resolve-the-acting-player-from-a-lobby-issued-secret.md),
  [game-adr 0004](../game-adr/0004-shared-carry-the-dotted-refusal-code-in-the-code-field.md)
- [CONTEXT.md § Sentinel errors](../CONTEXT.md#sentinel-errors)
- [generated contract types](../../../../test/contracts/trade-offers.game-api.ts) for the test bodies

## Checklist

1. Test helpers in `test/trades/offer.test.ts`: through HTTP, a room with two players and their secrets, a
   title deed owned by each, money for each. Then the AC-01 test, red.
2. `src/trades/module.ts` builds repository, service and routes, adapting `LobbyApi`, `BoardApi` and `BankApi`
   to the ports of T6; the route `POST /trade-offers` with the schemas of the contract; the service resolves
   the acting player first and writes the pending offer. AC-01 green.
3. `trades.not_a_trade` (AC-02), one test per reason.
4. `trades.unknown_player_or_deed` (AC-03) and `trades.recipient_not_in_room` (AC-05), in the order of flow 2.

## Edge cases

| Case | Expected |
|---|---|
| a proposer id in the body | bare `invalid`: the body schema allows no such field (game-adr 0003) |
| a negative or fractional amount | bare `invalid` from the schema, not `trades.not_a_trade` |
| an unknown recipient who is also not in the room | `trades.unknown_player_or_deed`: checked first |
| no secret, or an unknown one | undecided; see the open question in [_epic.md](./_epic.md). No test until the `lobby` secret feature decides |
| after AC-01 | the owners of both deeds and both balances are what they were |

## Definition of Done

- [ ] `test/trades/offer.test.ts`: AC-01 answers 201 with state `pending` and `expiresAt` 5 minutes after `createdAt`; owners and balances unchanged
- [ ] `test/trades/offer.test.ts`: 400 `trades.not_a_trade` for each of: a side gives nothing, the recipient is the proposer, a deed named twice
- [ ] `test/trades/offer.test.ts`: 400 `trades.unknown_player_or_deed` for an unknown recipient and for an unknown deed; 400 `trades.recipient_not_in_room`; no offer is stored after any refusal
- [ ] the route declares JSON schemas for body and every response of the contract
- [ ] `pnpm check` green
