// PlayerRepository on node:sqlite. Columns are snake_case; rows map to the camelCase domain type.
import type { Db } from '../../../shared/db.js';
import type { Player, PlayerRepository, Token } from '../../domain/player.js';

function toPlayer(row: Record<string, unknown>): Player {
  return {
    id: String(row.id),
    name: String(row.name),
    token: String(row.token) as Token,
    createdAt: String(row.created_at),
  };
}

export function createPlayerRepo(db: Db): PlayerRepository {
  const insert = db.prepare(
    'INSERT INTO players (id, name, token, created_at) VALUES (:id, :name, :token, :createdAt)',
  );
  const update = db.prepare('UPDATE players SET name = :name, token = :token WHERE id = :id');
  const remove = db.prepare('DELETE FROM players WHERE id = ?');
  const byId = db.prepare('SELECT * FROM players WHERE id = ?');
  const byName = db.prepare('SELECT * FROM players WHERE name = ? COLLATE NOCASE');
  const all = db.prepare('SELECT * FROM players ORDER BY created_at, id');

  return {
    insert(player) {
      insert.run({ id: player.id, name: player.name, token: player.token, createdAt: player.createdAt });
    },
    update(player) {
      update.run({ id: player.id, name: player.name, token: player.token });
    },
    delete(id) {
      return Number(remove.run(id).changes) > 0;
    },
    findById(id) {
      const row = byId.get(id);
      return row && toPlayer(row);
    },
    findByName(name) {
      const row = byName.get(name);
      return row && toPlayer(row);
    },
    list() {
      return all.all().map(toPlayer);
    },
  };
}
