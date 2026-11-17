-- board. Down of 0008_board_properties_room_id_not_null: rebuilds the table with room_id nullable again.
CREATE TABLE properties_new (
  id TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color_group" TEXT NOT NULL CHECK ("color_group" IN ('brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue')),
  "price" INTEGER NOT NULL CHECK ("price" >= 1 AND "price" <= 400),
  "rent" INTEGER NOT NULL CHECK ("rent" >= 0),
  "owner_id" TEXT,
  created_at TEXT NOT NULL,
  room_id TEXT
);
INSERT INTO properties_new (id, "name", "color_group", "price", "rent", "owner_id", created_at, room_id)
SELECT id, "name", "color_group", "price", "rent", "owner_id", created_at, room_id
FROM properties;
DROP TABLE properties;
ALTER TABLE properties_new RENAME TO properties;
CREATE UNIQUE INDEX IF NOT EXISTS properties_name_nocase ON properties ("name" COLLATE NOCASE);
