-- board. Backfill, step 2 of 3. No code ships with it. See backfill-room_id.md.
-- Every title deed without a room moves to the bootstrap room (0005).
UPDATE properties
SET room_id = '00000000-0000-7000-8000-000000000001'
WHERE room_id IS NULL;
