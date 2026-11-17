-- board. Down of 0007_board_properties_room_id_backfill: empties room_id of every title deed of the
-- bootstrap room. It cannot tell a backfilled title deed from one created in that room afterwards.
UPDATE properties
SET room_id = NULL
WHERE room_id = '00000000-0000-7000-8000-000000000001';
