---
id: T12
title: "Accept a trade offer: the exchange, in full or not at all"
layer: "ports"
context: "trades"
deps: [T2, T11]
needs: [P1, P2, P3, P4]
acs: [AC-07, AC-08, AC-09, AC-10, AC-13, AC-14, AC-15, AC-16]
codes: [trades.offer_not_found, trades.only_recipient_answers, trades.offer_already_answered, trades.offer_expired, trades.player_left_room, board.deed_owner_changed, bank.insufficient_funds]
files_hint: [src/trades/app/service.ts, src/trades/infra/http/routes.ts, test/trades/offer.test.ts]
estimate: "L"
status: "blocked"
---

# T12 — Accept a trade offer: the exchange, in full or not at all

## Why

US-02, the point of the feature: every title deed and all money named change hands at once. It is the only
action that writes in three contexts, so it comes after the transaction helper (T2) and after the answer
refusals of T11, which it reuses.

## Linked artifacts

- [game-contracts `acceptTradeOffer`](../game-contracts/openapi.yaml): statuses and the order of the eight refusals
- [game-sad §6 Flow 1](../game-sad.md#6-runtime-view);
  [§8 Transactions, Logging, Refusals](../game-sad.md#8-crosscutting-concepts);
  [§10 QG-1](../game-sad.md#10-quality-requirements)
- [game-prd AC-07](../game-prd.md#ac-07-us-02--happy), [AC-08](../game-prd.md#ac-08-us-02--cross-context),
  [AC-09](../game-prd.md#ac-09-us-02--cross-context), [AC-10](../game-prd.md#ac-10-us-02--cross-context),
  [AC-13 to AC-16](../game-prd.md#ac-13-us-02-us-03--timing), [§7 M3](../game-prd.md#7-metrics)
- [game-adr 0002](../game-adr/0002-shared-run-exchange-in-one-transaction.md)
- [CONTEXT.md § Invariants](../CONTEXT.md#invariants), [§ Sentinel errors](../CONTEXT.md#sentinel-errors)

## Checklist

1. `POST /trade-offers/{id}/accept`, happy path inside the helper of T2: room re-check, deeds moved by
   `board`, money moved by `bank`, the offer marked accepted. A test helper sums the balances of the room and
   reads every deed's owner before and after.
2. The four answer refusals of T11 on this route, one test each.
3. `trades.player_left_room` (AC-10), then `board.deed_owner_changed` (AC-08) and `bank.insufficient_funds`
   (AC-09): the refusals of `board` and `bank` pass through unchanged, and the offer stays pending.
4. One info log line per attempt refused by the re-check, with the offer id and the code, no player names.

## Edge cases

| Case | Expected |
|---|---|
| a deed moved, then the money is refused | the deed is back with its owner: everything rolls back |
| AC-09, then the payer gets the money, then accept again | 200, the exchange takes place |
| a refused attempt | the offer still lists as `pending` for both sides until its lifetime runs out |
| an attempt refused by one of the four answer refusals | no log line: M3 counts only the re-check |
| `board` or `bank` opens its own transaction or awaits | game-adr 0002 broken; the AC-08 and AC-09 tests turn red (game-sad §11) |

## Definition of Done

- [ ] `test/trades/offer.test.ts`: AC-07 answers 200 with state `accepted`; each deed has its new owner, each balance its new amount, and the room's money adds up to what it was
- [ ] `test/trades/offer.test.ts`: 404 `trades.offer_not_found`, 400 `trades.only_recipient_answers`, 409 `trades.offer_already_answered`, 409 `trades.offer_expired` on accept
- [ ] `test/trades/offer.test.ts`: 409 `trades.player_left_room`, 409 `board.deed_owner_changed`, 409 `bank.insufficient_funds`; after each, owners and balances are unchanged and the offer is `pending`
- [ ] `src/trades/app/service.ts` calls nothing asynchronous between the start of the transaction and its end; the log line is written outside it
- [ ] `pnpm check` green
