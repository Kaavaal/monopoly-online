-- board. Backfill, step 2 of 3. Promote as migrations/NNNN_board_properties_room_id_backfill.sql.
-- Every title deed without a room moves to the bootstrap room. See backfill-room_id.md.
UPDATE properties
SET room_id = '00000000-0000-7000-8000-000000000001'
WHERE room_id IS NULL;
