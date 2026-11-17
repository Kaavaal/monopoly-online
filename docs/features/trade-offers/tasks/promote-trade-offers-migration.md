---
id: T1
title: "Promote the staged trade_offers migration"
layer: "migration"
deps: []
external: []
acs: ["AC-01"]
files_hint: ["docs/features/trade-offers/migrations/20261117083005_create_trade_offers.up.sql", "docs/features/trade-offers/migrations/20261117083005_create_trade_offers.down.sql"]
owner: "Kaavaal"
estimate: "S"
status: "todo"
---

# T1 — Promote the staged `trade_offers` migration

## Why

The offer row is what every flow reads and writes. Derives from [data-model.md § `trade_offers`](../data-model.md) and [ADR-0001](../adr/0001-own-trade-offers-in-a-new-trades-context.md).

## What

- Bring the staged pair in line with data-model.md first: the staged `up.sql` has no `note` column (api-sync-report.md, Deferrals). The pair is not applied yet, so it is edited in place, not fixed forward.
- Promote the up file as `migrations/NNNN_trades_offers.sql`, next free number at that moment. The down file stays staged.

## Definition of Done

- [ ] the columns and the two indexes of the promoted file equal data-model.md § `trade_offers` and § Indexes
- [ ] up/down/up rehearsal (`.claude/skills/game-data-model/scripts/roundtrip.ts`) passes on a scratch file
- [ ] no `CHECK`, `TRIGGER` or `DEFAULT` in the file (`.claude/rules/migrations.md`)
- [ ] `pnpm check` green (every test applies the new migration)

## Notes

- Promote only the two `trades` pairs. The `rooms` and `properties.room_id` pairs belong to P1 and P3 (data-model.md, intro).
- The number is taken at promotion: the prerequisites may take `0004` and up before this task runs.
- `note` has no user story and no AC yet (api-sync-report.md, Deferrals); the column ships because data-model.md and the contract carry it.
