---
id: T3
title: "Add the transaction helper to src/shared/db.ts"
layer: "infra"
deps: []
external: []
acs: ["AC-07", "AC-19", "AC-19b"]
files_hint: ["src/shared/db.ts", "test/shared/db.test.ts"]
owner: "Kaavaal"
estimate: "S"
status: "todo"
---

# T3 — Add the transaction helper to `src/shared/db.ts`

## Why

The exchange writes in three contexts and must happen in full or not at all. Derives from [ADR-0002](../adr/0002-exchange-in-one-sqlite-transaction-with-guarded-commands.md) and [sad §8 Transactions](../sad.md).

## What

- One helper in `src/shared/db.ts` that runs a synchronous body between `BEGIN IMMEDIATE` and `COMMIT`, rolls back on a throw and rethrows.
- Called inside an open transaction, it joins it and opens none of its own.

## Definition of Done

- [ ] test: the body returns → the write is visible after the call
- [ ] test: the body throws after a write → the write is gone and the same error leaves the helper
- [ ] test: a nested call that throws rolls the outer transaction back as a whole
- [ ] the body type is synchronous: handing it an async function does not compile
- [ ] `pnpm check` green

## Notes

- No route uses the helper before T12, so this is the one test of the feature that does not go through HTTP. The HTTP proof is the fails-midway test of T13.
- No user of the helper is added here.
