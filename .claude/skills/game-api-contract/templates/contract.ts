// Rows of game-data-model.md mapped to the response schema of game-contracts/openapi.yaml. Only tsc checks
// this file: after the contract changes and the types are regenerated, it has to compile again.
import type { <Resource> } from './<slug>.game-api.js';

export type <Resource>Row = {
  id: string;
  // one property per column, snake_case as stored
  created_at: string;
};

export function to<Resource>(row: <Resource>Row): <Resource> {
  return {
    id: row.id,
    createdAt: row.created_at,
  };
}
