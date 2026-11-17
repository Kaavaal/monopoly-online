# Backfill — `properties.room_id`

Step 2 of the three-step change that makes `properties.room_id` `NOT NULL`
(`20261117083003_backfill_properties_room_id`).

**What it does.** One statement: every title deed whose `room_id` is empty gets the id of the bootstrap room,
`00000000-0000-7000-8000-000000000001`.

**Order.** After `create_rooms`, `bootstrap_rooms` and `add_room_id_to_properties`; before
`set_properties_room_id_not_null`.

**Size and time.** `properties` holds the title deeds of the board: tens of rows, at most a few hundred. The
update is a single statement inside the migration's transaction and takes milliseconds. No batching.

**If it stops midway.** The migration runner wraps the file in a transaction, so a failure leaves no row
changed and the file is applied again at the next start. The statement touches only rows with an empty
`room_id`, so running it twice changes nothing the second time.

**Rows that arrive later.** A title deed inserted without a room after this step, by code that does not
write `room_id` yet, is caught by step 3: its copy puts such a row into the bootstrap room too.

**Check after the run.**

```sql
SELECT count(*) FROM properties WHERE room_id IS NULL;   -- expect 0
```

**Rollback.** The `.down.sql` empties `room_id` for every title deed of the bootstrap room. It cannot tell a
backfilled title deed from one created in the bootstrap room afterwards.
