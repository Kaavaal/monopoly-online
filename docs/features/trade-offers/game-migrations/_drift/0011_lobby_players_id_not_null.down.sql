-- lobby. Down of 0011_lobby_players_id_not_null: rebuilds players with the id nullable again.
CREATE TABLE players_new (
  id TEXT PRIMARY KEY,
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
