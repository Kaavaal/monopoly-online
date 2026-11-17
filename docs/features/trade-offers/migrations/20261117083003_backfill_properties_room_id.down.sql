-- Also clears title deeds created in the bootstrap room after the backfill: the two cannot be told apart.
UPDATE properties
SET room_id = NULL
WHERE room_id = '00000000-0000-7000-8000-000000000001';
