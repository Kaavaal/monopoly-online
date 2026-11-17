-- board. Expand, step 1 of 3. Promote as migrations/NNNN_board_properties_room_id.sql.
-- Nullable on purpose: the code that writes room_id ships with this step, NOT NULL comes in step 3.
-- No REFERENCES: rooms belongs to lobby, and contexts do not hold foreign keys into each other's tables.
ALTER TABLE properties ADD COLUMN room_id TEXT;
