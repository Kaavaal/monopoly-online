---
status: Accepted
owner: "Kaavaal"
reviewers: []
updated_at: "2026-11-17"
feature_size: S
stage: "04-05"
ticket: ""
---

# 0001 — Own trade offers in a new `trades` context

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Kaavaal, with Claude during the architecture-design walk

## Context

A trade offer is created, answered and listed by rules of its own, and to check and carry out an exchange it
needs three things other contexts own: players and rooms in `lobby`, title deed owners in `board`, balances in
`bank`. The repo has four contexts, each owning its tables and reaching the others only through a typed api,
created in a fixed order in `src/app.ts` so the dependency graph stays acyclic. PRD §8 left open which context
owns trade offers, due at architecture-design. Moving the entity later means a new migration, a new folder and
a rewrite of every import and test path.

## Decision drivers

- Quality goals 1 and 2 of the SAD (exchange atomicity, concurrency correctness): one place must see `lobby`,
  `board` and `bank` at once.
- PRD §3: trading is not tied to a player's turn.
- CONTEXT glossary: a trade offer is not a transfer; a recipient is not the payee of a transfer.
- ARCHITECTURE.md: a context takes only the api of a context created before it; `board` and `bank` do not
  depend on each other today.

## Considered options

1. **A new `trades` context** — `src/trades/` with the usual slice anatomy, created after `lobby`, `board` and
   `bank`, taking their three apis.
2. **Inside `turns`** — `turns` is already planned to use `lobby`, `board` and `bank`, so the graph gains no
   edge and no fifth context appears.
3. **Inside `bank`** — treat an exchange as a kind of movement of value; `bank` gains a dependency on `board`.

## Decision outcome

**Chosen:** option 1, a new `trades` context. It is the only option in which no existing context gains a
dependency and the name says what the code does. `turns` is "dice rolls and moves", and PRD §3 keeps trading
independent of turns; `bank` would have to know about title deeds, and the glossary keeps trade offers and
transfers apart.

## Consequences

**Positive**
- `board` and `bank` stay independent of each other; each only gains commands in its own api.
- Trade offers can ship, change or be removed without touching the turn rules.
- The dependency-cruiser rules are written for any folder under `src/`, so the new context is covered without
  editing them.

**Negative**
- A fifth context for one entity: one more module in the composition root, one more row in the context map of
  ARCHITECTURE.md and in the context list of CLAUDE.md, both to be updated when the code lands.
- `trades` depends on three contexts, the widest fan-in in the repo; a change to any of the three apis can
  break it.

**Neutral**
- If `turns` later needs to know about offers (for example to forbid trading during a dice roll), `turns` must
  be created after `trades` or the rule must live in `trades`; the creation order in `src/app.ts` is revisited
  then.
- The migration is `migrations/NNNN_trades_<name>.sql` with the next free number.

## Links

- PRD: [PRD.md](../PRD.md) §3, §8
- SAD: [sad.md](../sad.md) §4, §5
- Related ADR: [0002](./0002-exchange-in-one-sqlite-transaction-with-guarded-commands.md),
  [0003](./0003-identify-the-acting-player-by-a-lobby-issued-secret.md)
