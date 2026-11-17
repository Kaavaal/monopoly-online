---
id: T2
title: "Promote the staged trade_offer_properties migration"
layer: "migration"
deps: [T1]
external: []
acs: ["AC-01", "AC-02"]
files_hint: ["docs/features/trade-offers/migrations/20261117083006_create_trade_offer_properties.up.sql", "docs/features/trade-offers/migrations/20261117083006_create_trade_offer_properties.down.sql"]
owner: "Kaavaal"
estimate: "S"
status: "todo"
---

# T2 — Promote the staged `trade_offer_properties` migration

## Why

The title deeds named in an offer, one row per deed and side. Derives from [data-model.md § `trade_offer_properties`](../data-model.md).

## What

- Promote the up file as `migrations/NNNN_trades_offer_properties.sql`, the number right after T1. The down file stays staged.

## Definition of Done

- [ ] the promoted file equals data-model.md § `trade_offer_properties`: PK (`offer_id`, `property_id`), FK to `trade_offers(id)` only
- [ ] up/down/up rehearsal passes together with T1
- [ ] `pnpm check` green

## Notes

- Migration lane: runs after T1, never in parallel with it.
