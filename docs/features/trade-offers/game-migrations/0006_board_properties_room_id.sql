-- board. Expand, step 1 of 3. Promote with the commit in which every insert of a title deed writes room_id.
-- Nullable: SQLite cannot add NOT NULL without a default; NOT NULL comes in 0008.
-- No REFERENCES: rooms belongs to lobby, and a context holds no foreign key into another context's table.
ALTER TABLE properties ADD COLUMN room_id TEXT;
