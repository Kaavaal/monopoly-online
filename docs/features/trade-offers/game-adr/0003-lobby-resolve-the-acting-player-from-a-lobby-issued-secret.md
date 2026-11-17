---
status: Accepted
owner: "Kaavaal"
updated_at: "2026-11-17"
feature: "trade-offers"
---

# 0003 Resolve the acting player in `lobby` from a secret it issued

## Context

Only the recipient may answer an offer, and any other player must be told there is no such offer (PRD AC-15,
AC-16, §8 "acting in someone else's name"). The repo has no way to tell which player sends a request: routes
take ids from the path and the body and believe them. The PRD leaves this open (§11, second question) and
calls it a prerequisite outside the feature. It is decided now because the first step of every flow in SAD §6
depends on it.

## Why this is an ADR

| Rework ≥ 3 days | ≥ 2 contexts | Real alternative | Database |
|---|---|---|---|
| no: while `trades` is the only caller, changing it is a day or two | yes: a new `LobbyApi` call that `trades`, and later every context with player actions, takes | yes | yes: a secret stored with the player, in a `lobby` migration |

3 of 4.

## Drivers

- PRD AC-15, AC-16 and §10.1: what a request may do depends on who sends it.
- PRD §8: acting in someone else's name is refused.
- SAD §3: trust ends at the HTTP interface; "I am player X" is not believed without a check.
- Repo rule: players belong to `lobby`; another context reaches them through `LobbyApi` (`CLAUDE.md`).

## Options

1. **A secret issued by `lobby`**: `lobby` gives a player a secret once, every request carries it, and
   `LobbyApi` turns it into a player id or into nothing.
2. **A player id sent by the client and believed**: no new storage, but anyone acts as anyone.
3. **Leave it to the prerequisite feature**: this document only says "the acting player is known".

## Decision

**Chosen**: option 1. It is the smallest thing that makes AC-15 and AC-16 true and not only testable, and it
keeps the knowledge of players in `lobby`. `trades` asks `LobbyApi` who is acting at the start of every
request and never takes the actor's id from the body.

## Consequences

- Good: one place decides who acts; every later context with player actions reuses the same call.
- Bad: a fourth prerequisite feature before trade offers can be built: issuing, storing and looking up the
  secret is designed and built in `lobby`, not here.
- Bad: it is not a login. A lost secret cannot be recovered in this version, and a request without a valid
  secret needs a refusal that PRD §10.2 does not list (SAD §11).
- Changes in the repo: `LobbyApi` in `src/lobby/module.ts` (a call that resolves a secret into a player id), a
  `lobby` migration, both by the prerequisite feature.

## Links

- PRD: [game-prd.md](../game-prd.md) AC-15, AC-16, §8, §10.1, §11 second question
- SAD: [game-sad.md](../game-sad.md) §3, §4 choice 3, §8 Acting player
- Related ADR: [0001](./0001-trades-own-trade-offers-in-a-new-context.md) makes `trades` the first caller;
  [0002](./0002-shared-run-exchange-in-one-transaction.md) starts only after the actor is known
- Migration: none in this feature; the prerequisite feature in `lobby` adds one and takes its number then
