---
status: Accepted
owner: "Kaavaal"
updated_at: "2026-11-17"
feature: "trade-offers"
---

# 0002 Run one exchange in one SQLite transaction, with `board` and `bank` guarding their own writes

## Context

An acceptance must change every title deed and all money named in the offer at once or change nothing (PRD
AC-07 to AC-11b), and of two acceptances that touch the same deed or the same money exactly one may win. The
deeds are written by `board`, the money by `bank`, the offer state by `trades`
([0001](./0001-trades-own-trade-offers-in-a-new-context.md)). The repo has no transaction helper: only
`src/shared/migrate.ts` runs `BEGIN` and `COMMIT` by hand. It is decided now because it shapes the write calls
`BoardApi` and `BankApi` must offer.

## Why this is an ADR

| Rework ≥ 3 days | ≥ 2 contexts | Real alternative | Database |
|---|---|---|---|
| yes: it fixes the shape of the write calls of two apis and every exchange test | yes: `src/shared/db.ts`, `BoardApi`, `BankApi` | yes | no: no migration, no shared table |

3 of 4.

## Drivers

- QG-1 (SAD §1), PRD §6 rows 3 and 4: money in a room unchanged by any exchange; exactly one owner per deed
  after every action.
- QG-2 (SAD §1), PRD §6 row 5: exactly one wins, 100 of 100 runs (AC-11, AC-11b).
- PRD AC-08, AC-09, AC-10: a refused acceptance changes nothing, not even the parts that still hold, and the
  offer stays pending.
- PRD §10.2: `board.deed_owner_changed` and `bank.insufficient_funds` are rules `board` and `bank` own.
- Repo rule: `node:sqlite` is synchronous, one process, one file; a SQLite constraint error is a 500, so a
  check is made in a service before the write (`ARCHITECTURE.md`, slice anatomy).

## Options

1. **One transaction opened by `trades`, guarded writes in `board` and `bank`**: `trades` begins, calls "move
   these deeds from this owner to that one" and "move this money from this player to that one", marks the
   offer accepted, commits; each call refuses when its own rule does not hold, and a refusal rolls back.
2. **Check first, then write, no transaction**: `trades` reads owners and balances through the apis, then
   calls the writes; safe against races while nothing awaits, not against a crash or an unexpected error
   between two writes.
3. **Undo steps on failure**: each write has a reverse call that `trades` runs when a later step fails; the
   crash window stays and every write needs a twin.

## Decision

**Chosen**: option 1. Only a transaction gives "in full or not at all" when the process dies between two
writes (QG-1), and because the guards run inside it, the second of two acceptances sees what the first one
committed and is refused with the owning context's code (QG-2).

## Consequences

- Good: no half-done exchange can be stored; the re-check and the write are one step, so no second copy of
  the ownership and balance rules lives in `trades`.
- Bad: the write calls of `BoardApi` and `BankApi` must stay synchronous and must not open a transaction of
  their own; nothing inside the transaction may await. A move to an asynchronous database reopens this
  decision.
- Bad: a refusal from `board` or `bank` passes through `trades` unchanged, so `trades` routes answer with
  `board.*` and `bank.*` codes.
- Changes in the repo: `src/shared/db.ts` (a helper that runs a function between `BEGIN IMMEDIATE` and
  `COMMIT`, with `ROLLBACK` when it throws), `BoardApi` and `BankApi` (the guarded write calls, built by
  their prerequisite features).

## Links

- PRD: [game-prd.md](../game-prd.md) AC-07, AC-08, AC-09, AC-10, AC-11, AC-11b; §6 rows 3, 4, 5; §10.2
- SAD: [game-sad.md](../game-sad.md) §4 choice 2, §6 flow 1, §8 Transactions
- Related ADR: [0001](./0001-trades-own-trade-offers-in-a-new-context.md) makes `trades` the one caller of
  both contexts; [0003](./0003-lobby-resolve-the-acting-player-from-a-lobby-issued-secret.md) runs before the
  transaction opens
- Migration: none
