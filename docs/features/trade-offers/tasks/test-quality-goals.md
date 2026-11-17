---
id: T13
title: "Test the quality goals: atomicity, concurrency, expiry edge, latency"
layer: "tests"
deps: [T10, T12]
external: [P1, P2, P3, P4]
acs: ["AC-12", "AC-19", "AC-19b"]
files_hint: ["test/trades/offer.test.ts"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T13 — Test the quality goals: atomicity, concurrency, expiry edge, latency

## Why

The NFR table is measured, not assumed. Derives from [PRD §5 AC-19, AC-19b, §6](../PRD.md) and [sad §10](../sad.md).

## What

- QG-1: an offer whose title deed leg holds and whose money leg fails; assert the deed kept its owner, the room total is the same and the offer is pending.
- QG-2: two offers give the same deed (AC-19), or money one player cannot pay twice (AC-19b); both acceptances sent together, 100 repetitions of each case on fresh apps; one 200, one 409, invariants hold.
- QG-3: answers one millisecond before, at, and one millisecond after `expires_at` with a controlled clock.
- QG-4: server-side duration of the five actions, at least 100 calls of each in a room of 8 players where the acting player has 50 ended offers; p95 against 250 ms and 150 ms.

## Definition of Done

- [ ] QG-1 test passes and fails when the helper of T3 is bypassed
- [ ] QG-2: 100 of 100 repetitions of each case give exactly one success
- [ ] QG-3: the answer at `expires_at` is refused with `conflict`
- [ ] QG-4: p95 within the targets on the sample PRD §6 names
- [ ] `pnpm check` green

## Notes

- QG-2 guards the design (it fails if an `await` enters the transaction); it does not search for a race (sad §10).
