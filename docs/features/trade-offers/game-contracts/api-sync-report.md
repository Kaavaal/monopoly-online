# api-sync-report — trade-offers

**Verdict:** PASS (with deferrals)
**Run:** 1, first run, 2026-11-17
**Sources:** game-prd.md ✓ · game-data-model.md ✓ · game-sad.md §6 ✓ (2 of 4 flows drawn) · game-adr/ 0001, 0002, 0003, 0004 · CONTEXT.md ✓
**Scenario:** A, game-data-model.md is present, every stored field comes from a column
**Rules file:** `.claude/rules/openapi.md` read
**Codegen:** `test/contracts/trade-offers.game-api.ts`, typecheck green

## Owner decisions in this run

| Question | Decision |
|---|---|
| `.claude/rules/openapi.md` says `code` = the bare kind; game-adr/0004 says the dotted code | the contract follows game-adr/0004 (by ADR-0004). The rules file was not edited in this run; after review, 19412d5 added an exception for `game-contracts/` that follows game-adr/0004 |
| §6 draws accept and propose only | all four operations are in the contract; reject and list are derived from the PRD and parked as a sequence gap |
| shape of the list | `GET /trade-offers?role=proposer\|recipient`, `role` required |
| shape of the two sides | nested `proposerGives` / `recipientGives`, one `TradeSide` schema |
| finding: refusal for a request without a valid secret | open question; `401 unauthorized` stays in the contract with a comment |
| finding: bare `invalid` for a JSON schema failure, money bounds in the schema | accepted as is |
| finding: game-data-model.md was built from `PRD.md` and `sad.md` | open question; the columns are used as they are |

Where the rules file and the skill disagree on a location (`contracts/` and `/sdlc:api-forge` in the rules
file, `game-contracts/` here), the skill's output path was used: the rules file describes the other track,
which this run does not read or write.

## Operations

| Operation | Method and path | Story | §6 flow | Tables |
|---|---|---|---|---|
| `proposeTradeOffer` | `POST /trade-offers` | US-01 | flow 2 | `trade_offers`, `trade_offer_properties` (write) |
| `acceptTradeOffer` | `POST /trade-offers/{id}/accept` | US-02 | flow 1 | `trade_offers` (read, write `state`), `trade_offer_properties` (read) |
| `rejectTradeOffer` | `POST /trade-offers/{id}/reject` | US-03 | none drawn | `trade_offers` (read, write `state`), `trade_offer_properties` (read) |
| `listTradeOffers` | `GET /trade-offers?role=` | US-04 | none drawn | `trade_offers`, `trade_offer_properties` (read) |

## Field origins

| Field | Origin | Confidence |
|---|---|---|
| `TradeOffer.id` | `trade_offers.id` `TEXT`, `randomUUID()` → `format: uuid` | high |
| `TradeOffer.proposerId` | `trade_offers.proposer_id` `TEXT`, a `lobby` player id → `format: uuid` | high |
| `TradeOffer.recipientId`, `TradeOfferCreate.recipientId` | `trade_offers.recipient_id` `TEXT` → `format: uuid` | high |
| `proposerGives.money` | `trade_offers.proposer_money` `INTEGER NOT NULL`, "`0` when none" → `integer`, `minimum: 0` | high |
| `recipientGives.money` | `trade_offers.recipient_money` `INTEGER NOT NULL` → `integer`, `minimum: 0` | high |
| `proposerGives.propertyIds` | `trade_offer_properties.property_id` of the rows with `giver_id` = `proposer_id` → array of `uuid` | high |
| `recipientGives.propertyIds` | `trade_offer_properties.property_id` of the rows with `giver_id` = `recipient_id` → array of `uuid` | high |
| `TradeOffer.state` | `trade_offers.state`, Note: "`pending`, `accepted` or `rejected`"; `expired` derived from `expires_at` and the clock (game-sad.md §8 Time) | high |
| `TradeOffer.expiresAt` | `trade_offers.expires_at` `TEXT` → `format: date-time` | high |
| `TradeOffer.createdAt` | `trade_offers.created_at` `TEXT` → `format: date-time` | high |
| `role` (query) | not stored; AC-17 and the two reads behind `trade_offers_proposer_id` and `trade_offers_recipient_pending` | medium |

high: a column with a matching type and bound. medium: a PRD field with no column. low: a sequence message
only.

Not surfaced: `trade_offer_properties.offer_id` (it is `TradeOffer.id`) and `giver_id` (it is the key that
holds the side; never sent by the client, game-adr/0003).

## Refusals

| Code | Kind, status | Operations | §6 branch | PRD row |
|---|---|---|---|---|
| `trades.not_a_trade` | invalid, 400 | propose | flow 2, alt 1 | AC-02 |
| `trades.unknown_player_or_deed` | invalid, 400 | propose | flow 2, alt 2 | AC-03 |
| `trades.recipient_not_in_room` | invalid, 400 | propose | flow 2, alt 3 | AC-05 |
| `trades.not_yours_to_give` | invalid, 400 | propose | flow 2, alt 4 | AC-04 |
| `trades.pending_offer_exists` | conflict, 409 | propose | flow 2, alt 5 | AC-06 |
| `trades.offer_not_found` | not_found, 404 | accept, reject | flow 1, alt 1; reject: none drawn | AC-16 |
| `trades.only_recipient_answers` | invalid, 400 | accept, reject | flow 1, alt 2; reject: none drawn | AC-15 |
| `trades.offer_already_answered` | conflict, 409 | accept, reject | flow 1, alt 3; reject: none drawn | AC-14 |
| `trades.offer_expired` | conflict, 409 | accept, reject | flow 1, alt 4; reject: none drawn | AC-13 |
| `trades.player_left_room` | conflict, 409 | accept | flow 1, inner alt | AC-10 |
| `board.deed_owner_changed` | conflict, 409 | accept | flow 1, inner alt | AC-08, AC-11 |
| `bank.insufficient_funds` | conflict, 409 | accept | flow 1, inner alt | AC-09, AC-11b |
| `unauthorized` | undecided, 401 | all four | none (game-sad.md §6 note, §11) | none |
| `invalid` | invalid, 400 | all four | none: raised by `src/shared/http.ts` on a JSON schema failure | none |

## Drift check

1. Operation ↔ table: ✓ every operation reads or writes `trade_offers` and `trade_offer_properties`.
2. Code ↔ refusal table and errors.ts: ✓ (deferred: errors.ts gains the code argument with this feature,
   game-adr/0004). The 12 dotted codes are the 12 distinct codes of game-prd.md §10.2, each under the status
   of its kind. Two codes are not PRD rows: `unauthorized` (open question, see Deferrals; `errors.ts` has no
   such kind yet) and the bare `invalid` of a schema failure (accepted by the owner).
3. Schema ↔ constraint: ✓ every `format`, `minimum` and `enum` is in Field origins. `TradeSide` has no
   `uniqueItems`, `minItems` or `maxItems`: no source gives a bound, and AC-02 refuses a deed named twice and
   an empty side in the domain with `trades.not_a_trade`. Accepted by the owner: `money` is `integer`,
   `minimum: 0`, so a fractional or negative amount is refused by the schema with `invalid`, not with
   `trades.not_a_trade` as AC-02 words it.
4. Coverage: ✓ (deferred: `rooms` and `properties.room_id` of game-data-model.md are internal here; they
   belong to the `lobby` rooms and `board` per-room title deeds features and get their routes there).
   AC-01 → 201; AC-02 to AC-05 → 400 examples of propose; AC-06 → 409 of propose; AC-07 → 200 of accept;
   AC-08 to AC-11b, AC-13, AC-14 → 409 examples; AC-12 → 200 of reject; AC-15 → `NotTheRecipient`;
   AC-16 → `OfferNotFound` and the list holding only the actor's offers; AC-17, AC-18 → the two list examples.
5. Sequence ↔ responses: ✓ (deferred: reject and list have no flow in game-sad.md §6). All 8 refusal
   branches of flow 1 and all 5 of flow 2 have a response and a named example.

Ban list: clean (four greps print nothing, `--check` exits 0).

Spectral (`spectral:oas`, not part of `pnpm check`): 0 errors, 5 warnings — `info-contact` and
`operation-tags` on the four operations. Left as they are: the template has neither.

## Codegen

```bash
pnpm exec openapi-typescript docs/features/trade-offers/game-contracts/openapi.yaml \
  -o test/contracts/trade-offers.game-api.ts --root-types --root-types-no-schema-prefix --immutable
pnpm typecheck
```

Green. First run: `test/contracts/trade-offers.game-contract.ts` was written from the template with the row
types of `trade_offers` and `trade_offer_properties`; it compiles against the generated `TradeOffer`.

## unresolved_origins

none

## Deferrals

| What | Why parked | Next step, owner |
|---|---|---|
| Reject and list have no flow in game-sad.md §6 | the SAD left them "to the next stage"; the owner put both operations in the contract from AC-12 to AC-18 | `/game-sad trade-offers` draws the two flows, then `/game-api-contract trade-offers --reconcile`; Kaavaal |
| Refusal for a request without a valid secret: `401 unauthorized` | game-sad.md §11 leaves kind and code to the PRD of the `lobby` secret feature; `errors.ts` has no `unauthorized` | the PRD of the `lobby` player secret feature decides, then `--reconcile`; Kaavaal |
| `src/shared/errors.ts` factories take no code argument | game-adr/0004 changes them with the first `trades` commit | the first `trades` commit; Kaavaal |
| game-data-model.md names `PRD.md` and `sad.md` as its sources; its AC and section references (`AC-06b`, "sad.md §4 choice 4") do not match game-prd.md and game-sad.md | the columns cover everything the contract needs, so the contract does not wait | `/game-data-model trade-offers` against the game track, then `--reconcile`; Kaavaal |
