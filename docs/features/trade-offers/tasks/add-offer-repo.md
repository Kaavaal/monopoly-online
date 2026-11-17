---
id: T6
title: "Add the offer repository on node:sqlite"
layer: "infra"
deps: [T2, T5]
external: []
acs: ["AC-01", "AC-13", "AC-15"]
files_hint: ["src/trades/infra/sqlite/offerRepo.ts"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T6 — Add the offer repository on `node:sqlite`

## Why

Storage for the two tables, with the reads the flows draw. Derives from [data-model.md § Indexes](../data-model.md) and [sad §6 Flags](../sad.md).

## What

- Insert an offer with its title deed rows; load one offer by id; the unanswered, unexpired offer of a proposer; the pending offers addressed to a recipient; every offer of a proposer; set the state.
- Lists are ordered by `created_at`, then `id` (`.claude/rules/openapi.md`).

## Definition of Done

- [ ] every method of the T5 interface is implemented, with no SQL outside this file
- [ ] the time is an argument of each read that needs it; the repo does not read a clock
- [ ] `pnpm typecheck` and `pnpm arch:check` green

## Notes

- Exercised through HTTP from T8 on.
