CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color_group" TEXT NOT NULL CHECK ("color_group" IN ('brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue')),
  "price" INTEGER NOT NULL CHECK ("price" >= 1 AND "price" <= 400),
  "rent" INTEGER NOT NULL CHECK ("rent" >= 0),
  "owner_id" TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX properties_name_nocase ON properties ("name" COLLATE NOCASE);
