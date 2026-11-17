---
id: T4
title: "Promote the trade_offers migration"
layer: "migration"
context: "trades"
deps: []
needs: [P1, P3]
acs: [AC-01]
codes: []
files_hint: [docs/features/trade-offers/game-migrations/0009_trades_offers.sql, docs/features/trade-offers/game-migrations/0009_trades_offers.down.sql, migrations/0009_trades_offers.sql]
estimate: "S"
status: "blocked"
---

# T4 — Promote the trade_offers migration

## Why

A pending offer needs a table to be written to. The pair is staged and rehearsed; it waits for `0004`–`0008`
of the `lobby` rooms and `board` per-room title deeds features (owner's decision, 2026-11-17: keep the
staged numbers, do not promote into a gap).

## Linked artifacts

- [game-data-model § `trade_offers`](../game-data-model.md#trade_offers--trades-new), § Indexes and
  § Migrations (promote order)
- [staged up](../game-migrations/0009_trades_offers.sql) and
  [staged down](../game-migrations/0009_trades_offers.down.sql)
- [game-prd AC-01](../game-prd.md#ac-01-us-01--happy)
- [migration rules](../../../../.claude/rules/migrations.md)

## Checklist

1. Correct the header comment of the staged up file before it is frozen: it says the pair ships with the
   propose commit and cites `sad.md §4, choice 4`; it now ships on its own, and the source is game-sad §8 Time.
2. Copy the up file to `migrations/` under the same name. The down file stays staged.
3. Rerun the up/down/up rehearsal of game-data-model and record the result in its § Check.

## Edge cases

| Case | Expected |
|---|---|
| `0004`–`0008` are not in `migrations/` yet | stop: the task is blocked by P1 and P3 |
| another feature took `0009` first | renumber the staged files that are not promoted, keep the order (game-data-model § Migrations) |
| the promoted file differs from the staged one | not allowed; `diff` of the two prints nothing |

## Definition of Done

- [ ] `diff migrations/0009_trades_offers.sql docs/features/trade-offers/game-migrations/0009_trades_offers.sql` prints nothing
- [ ] the rehearsal `.claude/skills/game-data-model/scripts/roundtrip.ts` passes up, down, up; `pnpm migrate` applies `0009_trades_offers` on a fresh db
- [ ] `pnpm check` green
