# Property (board)

Started: 2026-10-26T21:39:25Z

A title deed on the board: a named, color-grouped lot with a purchase price and a rent, owned by a lobby player once bought.

## Routes

POST, GET, GET /:id, PATCH /:id, DELETE /:id on /properties.

## Decisions

- `name`: 1–40 code points after trim, unique case-insensitively (409 on clash).
- `colorGroup`: exactly the 8 given values, kebab-case lowercase (`light-blue`, `dark-blue`).
- `price`: int 1–400 inclusive.
- `rent`: int ≥ 0, no upper bound (request gave none).
- `ownerId`: optional; omitted or `null` = unowned deed. PATCH with `null` clears the owner.
- No cross-context FK: deleting a player leaves their properties pointing at a gone id (out of scope here).
- No rule tying `rent` to `price` (request gave none).

## Domain rules for feature-tests

- An unknown `ownerId` (well-formed uuid, no such player) is 400 on POST and on PATCH.
- A property created without `ownerId` comes back unowned (`ownerId` null).
- PATCH `ownerId: null` on an owned property makes it unowned again.
- PATCH to another player's id transfers the deed.
- `rent: 0` is accepted; `price: 0` and `price: 401` are 400.

```json slice
{ "context": "board", "entity": "Property", "plural": "properties",
  "summary": "A title deed: named, color-grouped lot with price, rent and an optional owner.",
  "fields": [
  { "name": "name", "type": "text", "min": 1, "max": 40, "unique": true },
  { "name": "colorGroup", "type": "enum",
    "values": ["brown", "light-blue", "pink", "orange", "red", "yellow", "green", "dark-blue"] },
  { "name": "price", "type": "int", "min": 1, "max": 400 },
  { "name": "rent", "type": "int", "min": 0 },
  { "name": "ownerId", "type": "ref", "ref": "lobby.players", "optional": true,
    "fixture": { "url": "/players", "body": { "name": "Alice", "token": "car" } } }
] }
```
