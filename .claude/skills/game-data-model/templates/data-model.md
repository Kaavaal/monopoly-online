---
status: Draft
owner: "<owner>"
updated_at: "<YYYY-MM-DD>"
feature_size: "<XS|S|M|L>"
sources: ["<PRD file>", "<SAD file>", "CONTEXT.md"]
---

# Data model — <slug>

<!-- Two to four lines: what changes in the schema and in which contexts. -->

Live schema before this feature: `migrations/0001`–`<NNNN>` (from `scripts/schema.ts`).

## ER diagram

Solid lines are foreign keys inside one context. Dotted lines are ids from another context.

```mermaid
erDiagram
    <TABLE_A> ||--o{ <TABLE_B> : "<verb>"
    <OTHER_CONTEXT_TABLE> ||..o{ <TABLE_A> : "<verb>"

    <TABLE_A> {
        text id PK
        text created_at
    }
```

## Tables

### `<table>` — `<context>`, <new | changed>

| Column | Type | Null | Source | Note |
|---|---|---|---|---|
| `id` | `TEXT` | no | convention | `randomUUID()` in the service |
| `created_at` | `TEXT` | no | convention | app clock |

<!-- One table per entity. A changed table lists only its new or changed columns. -->

## Indexes

| Index | Columns | Read it serves (sad.md §6) |
|---|---|---|
| `<table>_<column>` | `(<column>)` | <flow name>: <the read> |

## Migrations

Promote in this order; a step waits for the code named next to it.

| Staged file | Context | Step | Ships with |
|---|---|---|---|
| `NNNN_<context>_<name>.sql` | `<context>` | create / expand / backfill / contract / seed | <code change, or "nothing"> |

## Breaking change

<!-- Only when an existing table changes. Otherwise: "None." -->

<table>.<column>: expand in `NNNN`, backfill in `NNNN` (see `game-migrations/backfill-<column>.md`), contract
in `NNNN`. Between expand and contract the code <writes / reads> ...

## Seeds

<!-- Bootstrap rows with their fixed id and created_at, lookup rows, or "None." -->

## Drift

<!-- field-without-column / column-without-field / type-mismatch / nullability-mismatch, with the _drift/ file;
     then model vs spec. "None found" is a valid line. -->

## Check

| Check | Result |
|---|---|
| Names | |
| Down reverses up | |
| FK columns indexed | |
| No new CHECK / TRIGGER / business DEFAULT | |
| Rehearsal up → down → up | |

Open: <!-- every TBD with its line -->
