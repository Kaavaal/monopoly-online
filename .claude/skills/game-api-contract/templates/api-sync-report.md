# api-sync-report — <slug>

**Verdict:** PASS | PASS (with deferrals) | FAIL
**Run:** <n>, <first run | --reconcile>, <date>
**Sources:** game-prd.md ✓ · game-data-model.md ✓/✗ · game-sad.md §6 ✓/✗ · game-adr/ <list> · CONTEXT.md ✓/✗
**Scenario:** A | B, <why>
**Rules file:** `.claude/rules/openapi.md` <bootstrapped | read>
**Codegen:** `test/contracts/<slug>.game-api.ts`, typecheck <green | red, see below>

## What changed since the last run

<reconcile only: the source diff in one line per change, and what it did to the contract>

## Operations

| Operation | Method and path | Story | §6 flow | Tables |
|---|---|---|---|---|

## Field origins

| Field | Origin | Confidence |
|---|---|---|

high: a column with a matching type and bound. medium: a PRD field with no column. low: a sequence message
only.

## Refusals

| Code | Kind, status | Operations | §6 branch | PRD row |
|---|---|---|---|---|

## Drift check

1. Operation ↔ table: <✓ | ✓ (deferred: …) | ✗ …>
2. Code ↔ refusal table and errors.ts: <…>
3. Schema ↔ constraint: <…>
4. Coverage: <…>
5. Sequence ↔ responses: <…>

Ban list: <clean | what it found>

## Codegen

<the command, and on red the tsc error as printed>

## unresolved_origins

<none in scenario A>

## Deferrals

| What | Why parked | Next step, owner |
|---|---|---|

<or: none>
