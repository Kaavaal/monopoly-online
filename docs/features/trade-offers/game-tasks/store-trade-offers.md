---
id: T7
title: "Store and read trade offers"
layer: "infra"
context: "trades"
deps: [T5, T6]
needs: []
acs: [AC-01, AC-06, AC-17]
codes: []
files_hint: [src/trades/infra/sqlite/offerRepo.ts]
estimate: "M"
status: "todo"
---

# T7 — Store and read trade offers

## Why

Proposing writes an offer with its deeds, answering loads one and changes its state, and the two lists read
by proposer and by recipient. The repository implements the interface of T6 on the two tables of T4 and T5,
one prepared statement per read, so each read uses the index designed for it.

## Linked artifacts

- [game-data-model § Indexes](../game-data-model.md#indexes): the reads and the index each one uses;
  [§ Tables](../game-data-model.md#tables)
- [game-prd AC-01](../game-prd.md#ac-01-us-01--happy), [AC-06](../game-prd.md#ac-06-us-01--invariant),
  [AC-17](../game-prd.md#ac-17-us-04--happy)
- [game-sad §8 Time](../game-sad.md#8-crosscutting-concepts)
- [CONTEXT.md § Org-filter invariant](../CONTEXT.md#org-filter-invariant): every read is filtered by the
  acting player
- [src/board/infra/sqlite/propertyRepo.ts](../../../../src/board/infra/sqlite/propertyRepo.ts) as the shape
  of a repository

## Checklist

1. Insert an offer with its deed rows, and load one offer by id with its deeds folded into the two sides.
2. The three reads by player: the offers a proposer has in the stored state `pending`, every offer of a
   proposer, the stored-pending offers of a recipient that expire after a given moment. Lists are ordered by
   `created_at`, then `id`.
3. Change the stored state of one offer to accepted or rejected.

## Edge cases

| Case | Expected |
|---|---|
| a stored `pending` row past its lifetime | returned as stored; the caller asks the state function of T6, the repository never decides "expired" |
| the insert of an offer and its deeds | no `await` between the statements; the deed rows never exist without their offer |
| a constraint error | a 500 by design; the service checks before it writes (ARCHITECTURE.md) |
| column names | snake_case in SQL, camelCase in the returned offer |

## Definition of Done

- [ ] `src/trades/infra/sqlite/offerRepo.ts` implements the repository interface of `src/trades/domain/offer.ts`; every statement is prepared once
- [ ] `EXPLAIN QUERY PLAN` of the reads by proposer and by recipient on a migrated db names `trade_offers_proposer_id` and `trade_offers_recipient_pending`; the output is pasted in the commit message
- [ ] `pnpm check` green
