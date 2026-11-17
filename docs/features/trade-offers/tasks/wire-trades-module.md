---
id: T7
title: "Wire the trades module and resolve the acting player"
layer: "wiring"
deps: [T4, T6]
external: [P2]
acs: ["AC-06b", "AC-14"]
files_hint: ["src/trades/module.ts", "src/trades/infra/http/routes.ts", "src/app.ts", "test/trades/offer.test.ts", "ARCHITECTURE.md", ".dependency-cruiser.cjs"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T7 — Wire the `trades` module and resolve the acting player

## Why

`trades` is a new context created last in the composition root, and every route needs the acting player. Derives from [ADR-0001](../adr/0001-own-trade-offers-in-a-new-trades-context.md), [ADR-0003](../adr/0003-identify-the-acting-player-by-a-lobby-issued-secret.md) and [sad §5, §8 Authentication](../sad.md).

## What

- `src/trades/module.ts` builds repo → service → routes and exports an empty `TradesApi`.
- `src/app.ts` creates `trades` after `lobby`, `board` and `bank` and hands it their apis and the clock.
- One hook in `routes.ts` reads the bearer credential and asks `LobbyApi` which player holds it; the routes get the acting player id from it.
- ARCHITECTURE.md gains `trades` in the context map; the dependency-cruiser config gains it if the rules name contexts.

## Definition of Done

- [ ] test: no `Authorization` header → 401 with the envelope `{ error: { code: "unauthorized", message } }`
- [ ] test: an unknown secret → the same 401
- [ ] `trades` imports `lobby`, `board` and `bank` only as `import type` of their apis from `module.ts`
- [ ] `pnpm check` green

## Notes

- Blocked by P2: without the player secret there is no acting player and no `unauthorized` kind.
- The test file is created here; T8–T13 extend it, so they run in one lane.
