---
id: T5
title: "Promote the trade_offer_properties migration"
layer: "migration"
context: "trades"
deps: [T4]
needs: [P1, P3]
acs: [AC-01]
codes: []
files_hint: [docs/features/trade-offers/game-migrations/0010_trades_offer_properties.sql, docs/features/trade-offers/game-migrations/0010_trades_offer_properties.down.sql, migrations/0010_trades_offer_properties.sql]
estimate: "S"
status: "blocked"
---

# T5 — Promote the trade_offer_properties migration

## Why

A trade offer names the title deeds each side gives; they are stored one row per deed next to the offer. The
table has a foreign key to `trade_offers`, so it follows T4 in number order.

## Linked artifacts

- [game-data-model § `trade_offer_properties`](../game-data-model.md#trade_offer_properties--trades-new) and
  § Migrations
- [staged up](../game-migrations/0010_trades_offer_properties.sql) and
  [staged down](../game-migrations/0010_trades_offer_properties.down.sql)
- [game-prd AC-01](../game-prd.md#ac-01-us-01--happy)
- [migration rules](../../../../.claude/rules/migrations.md)

## Checklist

1. Correct the header comment of the staged up file: it says the pair is promoted in the first trades commit;
   it now ships on its own, right after `0009`.
2. Copy the up file to `migrations/` under the same name. The down file stays staged.
3. Rerun the up/down/up rehearsal with both pairs and record the result in game-data-model § Check.

## Edge cases

| Case | Expected |
|---|---|
| `0009_trades_offers` is not in `migrations/` | stop: the foreign key has no table to point at |
| `0009` was renumbered in T4 | this file takes the number right after it |
| the same deed twice in one offer | the primary key would refuse it as a 500; AC-02 refuses it in the domain first (T6) |

## Definition of Done

- [ ] `diff migrations/0010_trades_offer_properties.sql docs/features/trade-offers/game-migrations/0010_trades_offer_properties.sql` prints nothing
- [ ] the rehearsal `.claude/skills/game-data-model/scripts/roundtrip.ts` passes up, down, up; `pnpm migrate` applies `0010_trades_offer_properties` on a fresh db
- [ ] `pnpm check` green
