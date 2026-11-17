-- board. Contract, step 3 of 3. Promote only after the board commit that makes every insert of a title deed
-- write room_id (the commit promoted with 0006) is in, and no other insert path is left.
-- SQLite cannot change a column, so the table is rebuilt. Columns, CHECKs and the index are copied from
-- `schema.ts --sql` (migrations/0003_board_properties.sql); only room_id changes. The runner wraps this file
-- in a transaction.
-- A row whose room_id is still NULL fails the copy, the migration and the start of the app, on purpose:
-- it means code that does not write room_id is still running. Fix: run the UPDATE of 0007 by hand, restart.
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
INSERT INTO properties_new (id, "name", "color_group", "price", "rent", "owner_id", created_at, room_id)
SELECT id, "name", "color_group", "price", "rent", "owner_id", created_at, room_id
FROM properties;
DROP TABLE properties;
ALTER TABLE properties_new RENAME TO properties;
CREATE UNIQUE INDEX IF NOT EXISTS properties_name_nocase ON properties ("name" COLLATE NOCASE);
