---
status: Accepted
owner: "Kaavaal"
reviewers: []
updated_at: "2026-11-17"
feature_size: M
stage: "04-05"
ticket: ""
---

# 0002 — Run the exchange in one SQLite transaction around guarded commands of `board` and `bank`

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Kaavaal, with Claude during the architecture-design walk

## Context

Accepting a trade offer changes title deed owners in `board` and balances in `bank`, and marks the offer as an
accepted offer in `trades`. PRD §6 allows no partial exchange, even when the exchange fails midway, and
requires that of two acceptances competing for one title deed exactly one goes through. Every context writes
to the same SQLite file through the synchronous `node:sqlite` driver in one process. Neither `BoardApi` nor
`BankApi` has a command yet, so their shape is decided here, and it is seen by three contexts.

## Decision drivers

- PRD §6 Exchange atomicity: 0 partial exchanges.
- PRD §6 Concurrency: exactly 1 of 2 competing acceptances goes through, in 100 of 100 repetitions.
- PRD AC-16, AC-17: a refused acceptance says which title deed no longer belongs to the giving side, or which
  side cannot pay, and the offer stays a pending offer.
- ARCHITECTURE.md: each context owns its tables; another context reaches them only through the api.
- SAD §2: one process, one database file, every database call synchronous.

## Considered options

1. **One transaction, guarded commands** — `trades` opens one SQLite transaction and calls a command of `board`
   and a command of `bank` inside it; each command checks its own rule and throws `conflict` when it is broken;
   any throw rolls the whole transaction back.
2. **One transaction, checks in `trades`** — the same transaction, but `trades` reads owners and balances
   through the apis, decides by itself, then calls plain write commands that check nothing.
3. **Saga with compensations** — no shared transaction; `trades` calls `board`, then `bank`, each committing by
   itself, and calls reverse commands when a later step fails.

## Decision outcome

**Chosen:** option 1. The rule "you give only what is yours" stays with `board` and "you pay only what you
hold" stays with `bank`, where the data lives and where rent and turns will need the same rules later. One
transaction gives all-or-nothing by rollback instead of by hand-written reversal. Option 2 lets `board` and
`bank` accept writes that break their own rules whenever a caller forgets a check. Option 3 exposes a
half-done exchange between its steps and needs a journal of unfinished exchanges to survive a crash, which is
more than this feature's size allows.

How it works:

- A helper in `src/shared/db.ts` runs a synchronous function between `BEGIN IMMEDIATE` and `COMMIT`, and rolls
  back and rethrows on any error. `trades/module.ts` hands it to the service as a function, so `app/` imports
  no adapter.
- Inside the transaction the `trades` service loads the offer, checks that it is still a pending offer and
  that both players are in the room, calls the `board` command with every title deed leg, calls the `bank`
  command with every money leg, then marks the offer as an accepted offer.
- Each command takes all legs of one exchange at once and checks every giver against the state before the
  exchange, so a side must hold what it gives regardless of what it receives (PRD AC-07).
- Nothing inside the transaction awaits. Node handles one request at a time until it yields, so a second
  acceptance starts only after the first has committed or rolled back and then sees the new owner or balance.

## Consequences

**Positive**
- Atomicity and the single winner of a race follow from the transaction and the synchronous driver; no lock
  table, version column or retry loop is needed.
- A refused acceptance leaves no trace in the database: the offer stays a pending offer and can be accepted
  again once the money is there. The refusal and its reason go to the request log (SAD §8), which is how the
  Refused acceptances KPI of PRD §7 is counted.
- The guarded commands are reusable by later features (rent, buying a title deed).
- A money leg that fails after the title deed leg has succeeded is a natural "fails midway" case for the
  atomicity test.

**Negative**
- `trades` holds a transaction around writes of two other contexts. This works only while all contexts share
  one database file; if one moves to its own store, the exchange has to become a saga.
- The guarantee depends on a convention the tools do not check: no `await` between `BEGIN` and `COMMIT`, in
  `trades` and in the commands it calls. Kept by review and by the concurrency test.
- A command of `board` or `bank` must not open a transaction of its own when it is called inside one, so the
  helper has to join a transaction that is already open.

**Neutral**
- The wording of a refusal comes from the context that owns the rule; `trades` passes it on.
- `BEGIN IMMEDIATE` takes the write lock at once. With one process this changes nothing; it matters only if a
  second process ever opens the same file.

## Links

- PRD: [PRD.md](../PRD.md) §5 (AC-07, AC-16 to AC-19), §6
- SAD: [sad.md](../sad.md) §4, §5, §6, §8
- Related ADR: [0001](./0001-own-trade-offers-in-a-new-trades-context.md)
