---
id: T1
title: "Let the refusal factories carry a dotted code"
layer: "shared"
context: "shared"
deps: []
needs: []
acs: [AC-02]
codes: []
files_hint: [src/shared/errors.ts]
estimate: "S"
status: "todo"
---

# T1 — Let the refusal factories carry a dotted code

## Why

Every refusal of a trade offer answers with a dotted code under the status of its kind. Today the three
factories always send the bare kind, so no later task can raise `trades.*` until this lands. It comes first
because the domain (T6) throws through these factories.

## Linked artifacts

- [game-adr 0004](../game-adr/0004-shared-carry-the-dotted-refusal-code-in-the-code-field.md): the decision
  and the exact change
- [game-sad §8 Refusals](../game-sad.md#8-crosscutting-concepts)
- [game-prd §10.2](../game-prd.md#102-refusals): the codes the argument will carry
- [CONTEXT.md § Sentinel errors](../CONTEXT.md#sentinel-errors)
- [src/shared/errors.ts](../../../../src/shared/errors.ts), [src/shared/http.ts](../../../../src/shared/http.ts)

## Checklist

1. Add an optional second argument `code` to `notFound`, `conflict` and `invalid`; it defaults to the bare
   kind. The status still comes from the kind.
2. Confirm `src/shared/http.ts` needs no change: it already renders `AppError.code`.
3. Run the `lobby` and `board` tests untouched to prove the old routes answer as before.

## Edge cases

| Case | Expected |
|---|---|
| a factory called with one argument | `code` is the bare kind, as today |
| `conflict(message, 'board.deed_owner_changed')` | status 409, `code` is the dotted code |
| a JSON schema failure | still the bare `invalid` from `src/shared/http.ts`; not touched here |

## Definition of Done

- [ ] `src/shared/errors.ts`: `notFound`, `conflict` and `invalid` take `(message, code?)`; `AppError` is unchanged
- [ ] `git diff --stat` shows no change under `test/lobby`, `test/board` or in `src/shared/http.ts`
- [ ] `pnpm check` green
