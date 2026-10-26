// PropertyRepository on node:sqlite. Columns are snake_case; rows map to the camelCase domain type.
import type { Db } from '../../../shared/db.js';
import type { ColorGroup, Property, PropertyRepository } from '../../domain/property.js';

function toProperty(row: Record<string, unknown>): Property {
  return {
    id: String(row.id),
    name: String(row.name),
    colorGroup: String(row.color_group) as ColorGroup,
    price: Number(row.price),
    rent: Number(row.rent),
    ownerId: row.owner_id === null ? null : String(row.owner_id),
    createdAt: String(row.created_at),
  };
}

export function createPropertyRepo(db: Db): PropertyRepository {
  const insert = db.prepare(
    'INSERT INTO properties (id, "name", "color_group", "price", "rent", "owner_id", created_at) VALUES (:id, :name, :colorGroup, :price, :rent, :ownerId, :createdAt)',
  );
  const update = db.prepare(
    'UPDATE properties SET "name" = :name, "color_group" = :colorGroup, "price" = :price, "rent" = :rent, "owner_id" = :ownerId WHERE id = :id',
  );
  const remove = db.prepare('DELETE FROM properties WHERE id = ?');
  const byId = db.prepare('SELECT * FROM properties WHERE id = ?');
  const byName = db.prepare('SELECT * FROM properties WHERE "name" = ? COLLATE NOCASE');
  const all = db.prepare('SELECT * FROM properties ORDER BY created_at, id');

  return {
    insert(property) {
      insert.run({ id: property.id, name: property.name, colorGroup: property.colorGroup, price: property.price, rent: property.rent, ownerId: property.ownerId, createdAt: property.createdAt });
    },
    update(property) {
      update.run({ id: property.id, name: property.name, colorGroup: property.colorGroup, price: property.price, rent: property.rent, ownerId: property.ownerId });
    },
    delete(id) {
      return Number(remove.run(id).changes) > 0;
    },
    findById(id) {
      const row = byId.get(id);
      return row && toProperty(row);
    },
    findByName(name) {
      const row = byName.get(name);
      return row && toProperty(row);
    },
    list() {
      return all.all().map(toProperty);
    },
  };
}
