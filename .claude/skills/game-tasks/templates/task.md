---
id: T1
title: "<imperative, in CONTEXT.md terms>"
layer: "migration|domain|infra|ports|wiring|shared|docs"
context: "<ctx>"
deps: []
needs: []
acs: []
codes: []
files_hint: []
estimate: "S"
status: "todo"
---

# T1 — <title>

## Why

<One or two sentences: which user story this moves forward and why it comes in this place of the order.>

## Linked artifacts

- [game-prd §5 AC-NN](../game-prd.md)
- [game-sad §6 <flow>](../game-sad.md)
- [game-data-model § <table>](../game-data-model.md)
- [game-contracts `<operationId>`](../game-contracts/openapi.yaml)
- [game-adr NNNN](../game-adr/NNNN-<name>.md)
- [CONTEXT.md](../CONTEXT.md)

## Checklist

1. <first commit-sized step>
2. <next step>
3. <next step>

## Edge cases

| Case | Expected |
|---|---|
| <case from the AC or the flow's alt branch> | <code from CONTEXT.md or the state after> |

## Definition of Done

- [ ] <an HTTP test through makeTestApp() per AC and per code of this task, naming status and code>
- [ ] <for a migration: the rehearsal up/down/up passes and `pnpm migrate` applies it on a fresh db>
- [ ] `pnpm check` green
