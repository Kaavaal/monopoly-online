# Backfill — `properties.room_id`

Step 2 of 3 of the change that makes `properties.room_id` `NOT NULL`:
`0007_board_properties_room_id_backfill.sql`. After `0004`, `0005` and `0006`; before `0008`.

**What it does.** One statement: every title deed whose `room_id` is NULL gets the id of the bootstrap room,
`00000000-0000-7000-8000-000000000001`.

**Row count.** Every row of `properties` that exists when the file is applied; all of them have a NULL
`room_id` right after `0006`. Count them before the run:

```sql
SELECT count(*) FROM properties WHERE room_id IS NULL;
```

The table holds the title deeds of one board: tens of rows. The update runs inside the migration's
transaction and takes milliseconds, so there is no batching. In the rehearsal the count is 1 (`Test Deed`).

**Check after the run.**

```sql
SELECT count(*) FROM properties WHERE room_id IS NULL;                                    -- expect 0
SELECT count(*) FROM properties WHERE room_id = '00000000-0000-7000-8000-000000000001';   -- expect the count from before
```

**If it stops midway.** The runner wraps the file in a transaction, so a failure changes no row and the file
is applied again at the next start. The `WHERE room_id IS NULL` guard makes a second run change nothing.

**Rows that arrive later.** A title deed inserted without a room after this step is not swept by `0008`:
the contract step fails on it, and with it the start of the app (owner's decision, 2026-11-17). To recover,
run the statement of `0007` by hand and start again:

```sql
UPDATE properties SET room_id = '00000000-0000-7000-8000-000000000001' WHERE room_id IS NULL;
```

**Undo.** Production is forward-only, so the undo is a statement run by hand, the same as
`0007_board_properties_room_id_backfill.down.sql`:

```sql
UPDATE properties SET room_id = NULL WHERE room_id = '00000000-0000-7000-8000-000000000001';
```

It cannot tell a backfilled title deed from one created in the bootstrap room afterwards, and it works only
before `0008` is applied.
