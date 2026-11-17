# Epic — <slug>

> [game-prd](../game-prd.md) · [game-sad](../game-sad.md) · [game-data-model](../game-data-model.md) ·
> [game-contracts](../game-contracts/openapi.yaml) · [game-adr](../game-adr/) · [CONTEXT](../CONTEXT.md)

## Goal

<Two or three sentences from game-prd §2: what a player can do once every task is done.>

## Prerequisites

| # | Context | What this feature needs from it | Blocks |
|---|---|---|---|
| P1 | <ctx> | <the api call the design makes, missing from src/<ctx>/module.ts> | <task ids> |

## Waves

```mermaid
flowchart LR
  subgraph W1[Wave 1]
    T1["T1 migration: <slug>"]
  end
  subgraph W2[Wave 2]
    T2["T2 infra: <slug>"]
  end
  P1(["P1 <ctx>: <what>"])
  T1 --> T2
  P1 -.-> T2
```

## Tasks

See [tracker.md](./tracker.md) for status and [tasks.json](./tasks.json) for the machine form.

| # | Task | Layer | Wave | Deps | Needs | ACs | Codes |
|---|---|---|---|---|---|---|---|
| T1 | [<title>](./<task-slug>.md) | migration | 1 | — | — | AC-NN | — |

## Hard rules

<Only the rules of game-sad §11 and the accepted ADRs a task could break, one line each.>
