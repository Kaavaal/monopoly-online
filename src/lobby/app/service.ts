// Lobby use cases. Name uniqueness is checked here, before the write (see ARCHITECTURE.md, Errors).
import { randomUUID } from 'node:crypto';

import { conflict, notFound } from '../../shared/errors.js';
import { type Player, type PlayerRepository, validateName, validateToken } from '../domain/player.js';

export type PlayerService = ReturnType<typeof createPlayerService>;

export function createPlayerService(players: PlayerRepository) {
  function get(id: string): Player {
    const player = players.findById(id);
    if (!player) throw notFound(`player ${id} not found`);
    return player;
  }

  function assertNameFree(name: string, exceptId?: string): void {
    const holder = players.findByName(name);
    if (holder && holder.id !== exceptId) throw conflict(`name ${name} is taken`);
  }

  return {
    create(input: { name: string; token: string }): Player {
      const player: Player = {
        id: randomUUID(),
        name: validateName(input.name),
        token: validateToken(input.token),
        createdAt: new Date().toISOString(),
      };
      assertNameFree(player.name);
      players.insert(player);
      return player;
    },

    list(): Player[] {
      return players.list();
    },

    get,

    update(id: string, patch: { name?: string; token?: string }): Player {
      const player = { ...get(id) };
      if (patch.name !== undefined) player.name = validateName(patch.name);
      if (patch.token !== undefined) player.token = validateToken(patch.token);
      assertNameFree(player.name, id);
      players.update(player);
      return player;
    },

    remove(id: string): void {
      if (!players.delete(id)) throw notFound(`player ${id} not found`);
    },
  };
}
