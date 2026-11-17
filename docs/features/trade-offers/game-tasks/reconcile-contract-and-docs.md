---
id: T14
title: "Reconcile the contract and the docs with the built routes"
layer: "docs"
context: "trades"
deps: [T9, T10, T12]
needs: []
acs: []
codes: []
files_hint: [docs/features/trade-offers/game-contracts/openapi.yaml, docs/features/trade-offers/game-contracts/api-sync-report.md, docs/features/trade-offers/game-sad.md, docs/features/trade-offers/CONTEXT.md]
estimate: "S"
status: "todo"
---

# T14 — Reconcile the contract and the docs with the built routes

## Why

The contract was derived before any route existed and its sync report parks four deferrals. Once the four
routes are built, the report is run again so its verdict describes the code, and the notes that say "not
built yet" are removed.

## Linked artifacts

- [api-sync-report § Deferrals](../game-contracts/api-sync-report.md): the four parked rows
- [game-contracts openapi.yaml](../game-contracts/openapi.yaml)
- [game-sad §6](../game-sad.md#6-runtime-view): reject and list have no flow; §11 open question on the secret
- [CONTEXT.md § Sentinel errors](../CONTEXT.md#sentinel-errors): its AC column and three kinds follow the
  other track; the unnamed refusal for a missing secret
- [API contract rules](../../../../.claude/rules/openapi.md): contract and route land in the same commit series

## Checklist

1. Draw the reject and list flows in game-sad §6 with `/game-sad trade-offers`, from the routes as built.
2. Run `/game-api-contract trade-offers --reconcile`; fix every drift it reports between the route schemas
   and the contract, in the contract or in the route, never by hand in the report.
3. Close or re-park each deferral, and name the refusal for a missing secret in CONTEXT.md once the `lobby`
   secret feature has decided it.

## Edge cases

| Case | Expected |
|---|---|
| the `lobby` secret feature chose a code other than `unauthorized` | the contract follows it; `info.version` changes only with a CHANGELOG line |
| a route answers a status the contract does not list | a finding: fix the route or the contract in this task |
| CONTEXT.md AC numbers | re-pointed to game-prd §5 only if the owner says this track is the one that ships |

## Definition of Done

- [ ] `docs/features/trade-offers/game-contracts/api-sync-report.md` has a new run with verdict `PASS` or `PASS (with deferrals)`, and no deferral that says a route or `errors.ts` is not built
- [ ] `pnpm dlx @stoplight/spectral-cli lint docs/features/trade-offers/game-contracts/openapi.yaml` reports 0 errors
- [ ] `pnpm check` green
