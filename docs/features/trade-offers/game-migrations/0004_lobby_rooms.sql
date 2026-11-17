-- lobby. Create. Minimal rooms table: the bootstrap room needs a table to live in.
-- The lobby rooms feature owns this table and adds members and any other column with its own migrations.
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL
);
