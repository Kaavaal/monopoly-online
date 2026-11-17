---
id: T2
title: "Add the transaction helper an exchange runs in"
layer: "shared"
context: "shared"
deps: []
needs: []
acs: [AC-07]
codes: []
files_hint: [src/shared/db.ts, test/shared/db.test.ts]
estimate: "S"
status: "todo"
---

# T2 — Add the transaction helper an exchange runs in

## Why

An accepted offer changes title deeds, money and the offer state at once or not at all. The repo has no
transaction helper outside the migration runner; accepting an offer (T12) needs one, and it has no other
dependency, so it can be built now.

## Linked artifacts

- [game-adr 0002](../game-adr/0002-shared-run-exchange-in-one-transaction.md): the helper, `BEGIN IMMEDIATE`,
  and why nothing inside may await
- [game-sad §8 Transactions](../game-sad.md#8-crosscutting-concepts)
- [game-prd AC-07](../game-prd.md#ac-07-us-02--happy)
- [src/shared/db.ts](../../../../src/shared/db.ts); the hand-written `BEGIN` / `ROLLBACK` in
  [src/shared/migrate.ts](../../../../src/shared/migrate.ts) is the pattern to follow, not to refactor

## Checklist

1. Write `test/shared/db.test.ts`: a function that returns commits its writes; a function that throws leaves
   no write behind and the same error reaches the caller. It is a direct test, like `test/scripts/`, because
   no route uses the helper yet.
2. Add the helper to `src/shared/db.ts`: runs a synchronous function between `BEGIN IMMEDIATE` and `COMMIT`,
   `ROLLBACK` when it throws, returns the function's value.
3. Type the callback so a function that returns a promise does not compile.

## Edge cases

| Case | Expected |
|---|---|
| the function throws an `AppError` | rolled back, the same `AppError` rethrown, so the refusal keeps its code |
| SQLite already rolled back when the catch runs | no second `ROLLBACK`; the real error is kept (see `migrate.ts`) |
| the helper called inside a running transaction | not supported; `board` and `bank` writes must not open their own (game-adr 0002) |

## Definition of Done

- [ ] `test/shared/db.test.ts`: commit on return, roll back and rethrow on throw
- [ ] `src/shared/db.ts` exports the helper; `src/shared/migrate.ts` is unchanged
- [ ] `pnpm check` green
