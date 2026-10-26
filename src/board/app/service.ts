// Board use cases for properties. Uniqueness is checked here, before the write (see ARCHITECTURE.md, Errors).
import { randomUUID } from 'node:crypto';

import { conflict, invalid, notFound } from '../../shared/errors.js';
import { type Property, type PropertyRefs, type PropertyRepository, validateName, validateColorGroup, validatePrice, validateRent } from '../domain/property.js';

export type PropertyService = ReturnType<typeof createPropertyService>;

export interface PropertyInput {
  name: string;
  colorGroup: string;
  price: number;
  rent: number;
  ownerId?: string | null;
}

export function createPropertyService(properties: PropertyRepository, refs: PropertyRefs) {
  function get(id: string): Property {
    const property = properties.findById(id);
    if (!property) throw notFound(`property ${id} not found`);
    return property;
  }

  function assertNameFree(name: string, exceptId?: string): void {
    const holder = properties.findByName(name);
    if (holder && holder.id !== exceptId) throw conflict(`name ${name} is taken`);
  }

  function checkOwnerId(ownerId: string | null): string | null {
    if (ownerId !== null && !refs.ownerExists(ownerId)) throw invalid(`ownerId ${ownerId} is not a known player`);
    return ownerId;
  }

  return {
    create(input: PropertyInput): Property {
      const property: Property = {
        id: randomUUID(),
        name: validateName(input.name),
        colorGroup: validateColorGroup(input.colorGroup),
        price: validatePrice(input.price),
        rent: validateRent(input.rent),
        ownerId: checkOwnerId(input.ownerId ?? null),
        createdAt: new Date().toISOString(),
      };
      assertNameFree(property.name);
      properties.insert(property);
      return property;
    },

    list(): Property[] {
      return properties.list();
    },

    get,

    update(id: string, patch: Partial<PropertyInput>): Property {
      const property = { ...get(id) };
      if (patch.name !== undefined) property.name = validateName(patch.name);
      if (patch.colorGroup !== undefined) property.colorGroup = validateColorGroup(patch.colorGroup);
      if (patch.price !== undefined) property.price = validatePrice(patch.price);
      if (patch.rent !== undefined) property.rent = validateRent(patch.rent);
      if (patch.ownerId !== undefined) property.ownerId = checkOwnerId(patch.ownerId);
      assertNameFree(property.name, id);
      properties.update(property);
      return property;
    },

    remove(id: string): void {
      if (!properties.delete(id)) throw notFound(`property ${id} not found`);
    },
  };
}
