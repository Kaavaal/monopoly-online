CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL CHECK (token IN ('car', 'hat', 'dog', 'ship', 'boot', 'iron', 'thimble', 'wheelbarrow')),
  created_at TEXT NOT NULL
);
