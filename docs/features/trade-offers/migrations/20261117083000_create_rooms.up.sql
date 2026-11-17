-- lobby. Promote as migrations/NNNN_lobby_rooms.sql.
-- Minimal shape: the bootstrap room needs a table to live in. The lobby rooms prerequisite owns this table
-- and adds its own columns (members, name) with later migrations.
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
