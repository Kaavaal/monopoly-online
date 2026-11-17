-- lobby. Drift fix (proposed, not part of trade-offers): players.id is `TEXT PRIMARY KEY` without NOT NULL,
-- so SQLite accepts a NULL id, while the domain type says `id: string`.
-- Table rebuild; every other column, the CHECK and both unique rules are copied from `schema.ts --sql`.
CREATE TABLE players_new (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL CHECK (token IN ('car', 'hat', 'dog', 'ship', 'boot', 'iron', 'thimble', 'wheelbarrow')),
  created_at TEXT NOT NULL
);
INSERT INTO players_new (id, name, token, created_at)
SELECT id, name, token, created_at
FROM players;
DROP TABLE players;
ALTER TABLE players_new RENAME TO players;
CREATE UNIQUE INDEX IF NOT EXISTS players_name_nocase ON players (name COLLATE NOCASE);
