# Backfill — `<table>.<column>`

Step 2 of 3: `NNNN_<context>_<table>_<column>_backfill.sql`. After `NNNN` (expand), before `NNNN` (contract).

**What it does.** <one sentence: which rows get which value>

**Rows.** Count before the run:

```sql
SELECT count(*) FROM <table> WHERE <column> IS NULL;
```

One `UPDATE` in the runner's transaction; the tables of this game are small, so no batching.

**Check after.** The same query returns 0.

**Undo.** `<the .down.sql statement>`. <What it cannot tell apart, if anything.>

**If the contract step fails on a NULL.** Code that does not write `<column>` is still running: ship it,
run the `UPDATE` above by hand, restart.
