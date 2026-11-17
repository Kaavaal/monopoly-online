---
status: Accepted
owner: "<game owner>"
updated_at: "<YYYY-MM-DD>"
feature: "<slug>"
---

# NNNN <decision, imperative>

<!-- File name: NNNN-<ctx>-<decision>.md, <ctx> = context that owns the decision, `shared` for src/shared. -->

## Context

<!-- 2-4 sentences: what the PRD asks, what the repo has today, why it is decided now. -->

## Why this is an ADR

| Rework ≥ 3 days | ≥ 2 contexts | Real alternative | Database |
|---|---|---|---|
| <yes/no: why> | <yes/no: which> | <yes/no> | <yes/no: which migration or table> |

## Drivers

<!-- Each bullet cites a QG from SAD §1, a PRD §6 row, a PRD AC or a repo rule. Nothing else. -->

- <driver>

## Options

<!-- Every option the owner saw, none that a repo rule already rules out. -->

1. **<option>**: <one sentence>.
2. **<option>**: <one sentence>.

## Decision

**Chosen**: option <n>. <1-2 sentences tied to the drivers.>

## Consequences

- Good: <...>
- Bad: <...>
- Changes in the repo: <files outside the feature's own context, e.g. src/app.ts, src/shared/db.ts,
  ARCHITECTURE.md>

## Links

- PRD: [<PRD file>](../<PRD file>) <AC ids, §6 rows>
- SAD: [game-sad.md](../game-sad.md) §<N>
- Related ADR: <[NNNN](./NNNN-...md) and how they fit together | none: <why>>
- Migration: <migrations/NNNN_<ctx>_<name>.sql | none>
