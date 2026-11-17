---
id: T4
title: "Hand a clock to buildApp and makeTestApp"
layer: "wiring"
deps: []
external: []
acs: ["AC-11", "AC-12"]
files_hint: ["src/app.ts", "src/index.ts", "test/helpers/app.ts"]
owner: "Kaavaal"
estimate: "S"
status: "todo"
---

# T4 — Hand a clock to `buildApp` and `makeTestApp`

## Why

Expiry is derived from the clock, and the expiry tests need a clock they control. Derives from [sad §4 choice 4, §8 Time](../sad.md).

## What

- `buildApp({ db, logger, clock })`: `clock` is optional and defaults to the system clock.
- `makeTestApp()` accepts a clock and passes it on. No context reads the clock yet.

## Definition of Done

- [ ] existing `lobby` and `board` tests pass without a change
- [ ] a test can build an app with a fixed time (used from T8 on)
- [ ] `pnpm check` green

## Notes

- Shares `src/app.ts` with T7, which depends on this task.
