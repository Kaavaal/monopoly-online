-- board. Contract, step 3 of 3. Promote as migrations/NNNN_board_properties_room_id_not_null.sql.
-- BREAKING: an insert without room_id fails from here on. Promote only with the code that always writes it.
-- SQLite cannot add NOT NULL to an existing column, so the table is rebuilt. Every other column, the CHECK
-- constraints and the index are copied unchanged from migrations/0003_board_properties.sql.
CREATE TABLE properties_new (
  id TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color_group" TEXT NOT NULL CHECK ("color_group" IN ('brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue')),
  "price" INTEGER NOT NULL CHECK ("price" >= 1 AND "price" <= 400),
  "rent" INTEGER NOT NULL CHECK ("rent" >= 0),
  "owner_id" TEXT,
  created_at TEXT NOT NULL,
  room_id TEXT NOT NULL
);
-- COALESCE catches a title deed inserted without a room between step 2 and this step.
INSERT INTO properties_new (id, "name", "color_group", "price", "rent", "owner_id", created_at, room_id)
SELECT id, "name", "color_group", "price", "rent", "owner_id", created_at,
       COALESCE(room_id, '00000000-0000-7000-8000-000000000001')
FROM properties;
DROP TABLE properties;
ALTER TABLE properties_new RENAME TO properties;
CREATE UNIQUE INDEX IF NOT EXISTS properties_name_nocase ON properties ("name" COLLATE NOCASE);
