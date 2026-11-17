---
id: T14
title: "Reconcile the contract report and the docs with the built feature"
layer: "docs"
deps: [T13]
external: []
acs: []
files_hint: ["docs/features/trade-offers/contracts/api-sync-report.md", "test/contracts/trade-offers.contract.ts", "test/contracts/trade-offers.contract.test.ts", "docs/features/trade-offers/CONTEXT.md", "CLAUDE.md"]
owner: "Kaavaal"
estimate: "M"
status: "todo"
---

# T14 — Reconcile the contract report and the docs with the built feature

## Why

A change to the contract and the route land together, with the sync report re-run (`.claude/rules/openapi.md`, Checks). The deferrals of [api-sync-report.md](../contracts/api-sync-report.md) are closed or carried forward by name.

## What

- Re-run the reconcile; close the deferral on `unauthorized`; carry the others forward.
- Regenerate the contract types and let `test/contracts/trade-offers.contract.ts` compile against the routes as built.
- Write the contract rows of [tests/test-plan.md](../tests/test-plan.md): the real success and refusal responses of the five routes validated against `openapi.yaml`.
- Add the four terms of sad §12 to CONTEXT.md; name `trades` among the contexts in CLAUDE.md.

## Definition of Done

- [ ] api-sync-report.md verdict is PASS or PASS (with deferrals)
- [ ] the contract rows of the test plan pass for all five routes, in `pnpm check`
- [ ] `pnpm contract:types` leaves no diff, or the diff is committed with the route change that caused it
- [ ] `pnpm check` green

## Notes

- Covers no AC of its own; it closes the documentation loop of the epic.
