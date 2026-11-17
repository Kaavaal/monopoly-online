---
status: Accepted
owner: "Kaavaal"
updated_at: "2026-11-17"
feature: "trade-offers"
---

# 0001 Own trade offers in a new `trades` context

## Context

The PRD leaves open which context owns trade offers (§11, first question) and uses the error prefix `trades`
provisionally. The repo has four contexts: `lobby`, `board`, `bank`, `turns`. A trade offer names title deeds
(`board`) and money (`bank`) of two players in one room (`lobby`), and one acceptance changes deeds and money
together. It is decided now because every later section names the owner of the offers table and the api calls
that cross a boundary.

## Why this is an ADR

| Rework ≥ 3 days | ≥ 2 contexts | Real alternative | Database |
|---|---|---|---|
| yes: moving offers to another context later is a new migration plus a rework of three apis and all tests | yes: the context map in `ARCHITECTURE.md`, the creation order in `src/app.ts` | yes | yes: the offers tables, in a new `trades` migration |

4 of 4. A change to `ARCHITECTURE.md` is an ADR whatever the score.

## Drivers

- Repo rule: a context takes only the api of a context created before it; the graph stays acyclic
  (`ARCHITECTURE.md`, context map).
- Repo rule: one feature touches one context; no context reads another's tables (`CLAUDE.md`).
- QG-1 (SAD §1): one acceptance changes deeds and money together, so one place must call both `board` and
  `bank`.
- PRD §1: the feature reads `lobby`, reads and changes `board` and `bank`, takes nothing from `turns`.

## Options

1. **A new `trades` context**: owns the offers, takes `LobbyApi`, `BoardApi` and `BankApi`, is created last.
2. **Offers inside `board`**: `board` takes `BankApi`; a new arrow board → bank, and `bank` must be created
   before `board`.
3. **Offers inside `bank`**: `bank` takes `BoardApi`; a new arrow bank → board, and the money context owns
   offers that name title deeds.

## Decision

**Chosen**: option 1. `board` and `bank` stay unaware of each other, the creation order only grows at the end
(lobby, board, bank, turns, trades), and the rules each context owns keep their own prefix in PRD §10.2
(`board.deed_owner_changed`, `bank.insufficient_funds`, `trades.*`). The provisional `trades` prefix becomes
final.

## Consequences

- Good: no arrow between `board` and `bank`; `turns` can later take `TradesApi` only if it is moved after
  `trades`, which nothing asks for today.
- Bad: a fifth context for one entity; three apis to grow (`LobbyApi`, `BoardApi`, `BankApi`) before the
  feature can be built.
- Changes in the repo: `ARCHITECTURE.md` (a `trades` row in the context map; arrows trades → lobby, trades →
  board, trades → bank; creation order), `src/app.ts` (create and register `trades` last), a new folder
  `src/trades/`, `CLAUDE.md` (the list of contexts in its first line).

## Links

- PRD: [game-prd.md](../game-prd.md) §1, §10.2, §11 first question
- SAD: [game-sad.md](../game-sad.md) §4 choice 1, §5
- Related ADR: [0002](./0002-shared-run-exchange-in-one-transaction.md) says how `trades` changes `board` and
  `bank` together; [0003](./0003-lobby-resolve-the-acting-player-from-a-lobby-issued-secret.md) adds the
  `LobbyApi` call `trades` starts every request with
- Migration: `migrations/NNNN_trades_offers.sql`, the next free number when the feature is built
