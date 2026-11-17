# Endpoint audit: access checks and input validation

- date: 2026-11-17
- commit: 5d2fcc0
- scope: 11 live routes (lobby, board, /health) and the 5 planned trade-offer operations of `docs/features/trade-offers/contracts/openapi.yaml`
- method: one finder per route group, then an independent verifier re-checked every finding against the code and the contract
- result: 21 findings raised, 19 confirmed, 2 rejected, 0 not verified

Planned operations are audited as a contract: a finding there is a gap in the specification, not in running code.

# Confirmed findings

## POST /players

### lobby-5: Name uniqueness is case-insensitive for ASCII only

- category: validation
- severity: low
- claim: The 'case-insensitive' name uniqueness is enforced only by SQLite COLLATE NOCASE, which folds only ASCII letters, so POST /players accepts a name that differs from an existing one only by the case of a non-ASCII letter (e.g. 'Élan' when 'élan' exists) and returns 201 instead of 409.
- finder evidence: src/lobby/domain/player.ts:23-24 (findByName documented as case-insensitive); src/lobby/app/service.ts:16-19,29 (assertNameFree relies on findByName, no normalisation of the name); src/lobby/infra/sqlite/playerRepo.ts:21 (WHERE name = ? COLLATE NOCASE); migrations/0002_lobby_players_name_nocase.sql:1 (unique index also NOCASE)
- verifier: Name uniqueness on create rests only on SQLite NOCASE (lookup and unique index), which folds ASCII only; the service does no case normalisation. An in-memory node:sqlite probe confirmed it: with 'élan' stored, the NOCASE lookup for 'Élan' returns nothing and the unique index accepts the insert, so the route returns 201, not 409.
- verifier evidence: src/lobby/app/service.ts:16-19,25,29-30; src/lobby/infra/sqlite/playerRepo.ts:21; migrations/0002_lobby_players_name_nocase.sql:1; src/lobby/domain/player.ts:23-24,29-36; src/lobby/infra/http/routes.ts:7 (no pattern); requirement 'name uniqueness is case-insensitive' in CAPSTONE_LOG.md:33

### lobby-7: Invisible-only names pass the 'not blank' rule

- category: validation
- severity: low
- claim: The name check is minLength 1 in the schema plus String.prototype.trim() in the domain, and trim() does not remove format characters such as U+200B ZERO WIDTH SPACE, so POST /players with name "​" is accepted (201) although the domain rule says the name must not be blank.
- finder evidence: src/lobby/infra/http/routes.ts:7,35-39 (name schema: type string, minLength/maxLength only, no pattern); src/lobby/domain/player.ts:28-36 (validateName: trim, count code points, error text 'not blank'); src/lobby/app/service.ts:25
- verifier: The schema for name is only type string with minLength 1 / maxLength 32, no pattern, and validateName only trims and counts code points. String.prototype.trim() does not strip U+200B (probe: trimmed length stays 1), so a name of one zero-width space passes both checks and is inserted with 201, although the rule is to reject a blank name.
- verifier evidence: src/lobby/infra/http/routes.ts:7,35-39; src/lobby/domain/player.ts:7-8,29-36; src/lobby/app/service.ts:25,30; requirement 'trim the name and reject a blank one' in CAPSTONE_LOG.md:32-33; tests cover only spaces: test/lobby/player.test.ts:59

## GET /players

No confirmed findings.

## GET /players/:id

No confirmed findings.

## PATCH /players/:id

### lobby-1: Any caller can rename or re-token any player

- category: access
- severity: high
- claim: PATCH /players/:id has no authentication and no check that the caller is the player named by :id, so anyone who knows a player id (GET /players returns all of them) can change that player's name and token.
- finder evidence: src/lobby/infra/http/routes.ts:59-74 (no security hook, no credential header in the schema, handler passes only params.id and body); src/lobby/app/service.ts:40-47 (update takes no actor, checks only existence and name uniqueness); src/app.ts:13-25 (no auth hook registered on the app); src/shared/errors.ts:15-17 (no unauthorized kind exists)
- verifier: The PATCH route has only a params and body schema and passes just the id and body to the service; update() takes no actor and checks only existence, field validity and name uniqueness. No hook or credential check exists anywhere in src (grep for auth/secret/bearer/addHook/preHandler/onRequest returns nothing), and errors.ts has no unauthorized kind.
- verifier evidence: src/lobby/infra/http/routes.ts:59-74; src/lobby/app/service.ts:40-47; src/app.ts:13-27; src/lobby/module.ts:20-22; src/shared/errors.ts:15-17

### lobby-6: Name uniqueness is case-insensitive for ASCII only

- category: validation
- severity: low
- claim: PATCH /players/:id checks the new name with the same ASCII-only COLLATE NOCASE lookup, so a player can be renamed to a name that differs from another player's only by the case of a non-ASCII letter and gets 200 instead of 409.
- finder evidence: src/lobby/app/service.ts:42,44 (validateName then assertNameFree); src/lobby/app/service.ts:16-19; src/lobby/infra/sqlite/playerRepo.ts:21; migrations/0002_lobby_players_name_nocase.sql:1
- verifier: The rename path uses the same assertNameFree -> findByName NOCASE lookup with no normalisation, and the UPDATE is guarded only by the same ASCII-only NOCASE index, so a rename differing by the case of a non-ASCII letter returns 200. Same root cause as lobby-5 but a separate route (PATCH), so not a duplicate.
- verifier evidence: src/lobby/app/service.ts:40-46 (42 validateName, 44 assertNameFree, 45 update); src/lobby/app/service.ts:16-19; src/lobby/infra/sqlite/playerRepo.ts:18,21; migrations/0002_lobby_players_name_nocase.sql:1; src/lobby/infra/http/routes.ts:7,64-69

### lobby-8: Invisible-only names pass the 'not blank' rule

- category: validation
- severity: low
- claim: PATCH /players/:id validates name with the same schema and validateName, so a rename to "​" (or any string of non-whitespace invisible characters) returns 200 although the domain rule says the name must not be blank.
- finder evidence: src/lobby/infra/http/routes.ts:7,64-69; src/lobby/domain/player.ts:28-36; src/lobby/app/service.ts:42
- verifier: PATCH reuses the same name schema and validateName, so a rename to U+200B (or other invisible non-whitespace characters) passes the schema and the trim/length check and is written with 200. Same root cause as lobby-7 but a separate route, so not a duplicate.
- verifier evidence: src/lobby/infra/http/routes.ts:7,64-69; src/lobby/domain/player.ts:29-36; src/lobby/app/service.ts:42,45; test/lobby/player.test.ts:150 (only the spaces case is tested)

## DELETE /players/:id

### lobby-2: Any caller can delete any player

- category: access
- severity: high
- claim: DELETE /players/:id has no authentication and no check that the caller is the player named by :id, so anyone who knows a player id can delete that player.
- finder evidence: src/lobby/infra/http/routes.ts:76-83 (schema has params only, handler calls players.remove(req.params.id)); src/lobby/app/service.ts:49-51 (remove takes no actor, only checks the row existed); src/app.ts:13-25 (no auth hook)
- verifier: The DELETE route validates only that :id is a uuid and calls players.remove(id); remove() takes no actor and only checks that a row was deleted. No auth hook is registered on the app or in the lobby module.
- verifier evidence: src/lobby/infra/http/routes.ts:76-83; src/lobby/app/service.ts:49-51; src/lobby/infra/sqlite/playerRepo.ts:19,31-33; src/app.ts:13-27

### lobby-3: Deleting a player who owns title deeds is not checked

- category: validation
- severity: medium
- claim: DELETE /players/:id removes the player without checking whether any property references it as owner, so a caller can leave properties.owner_id pointing at a player that no longer exists, a state the board service itself refuses to create ('ownerId ... is not a known player').
- finder evidence: src/lobby/app/service.ts:49-51 (remove only calls players.delete); src/lobby/infra/sqlite/playerRepo.ts:19,31-33 (plain DELETE FROM players); migrations/0003_board_properties.sql:7 (owner_id TEXT with no REFERENCES, so PRAGMA foreign_keys in src/shared/db.ts:8 does not block it); src/board/app/service.ts:34-36 (board requires the owner to exist on POST/PATCH); src/board/app/service.ts:25-26 (a dangling ownerId is served with ownerName null)
- verifier: remove() does a plain DELETE with no ownership precondition, and properties.owner_id has no REFERENCES clause, so PRAGMA foreign_keys does not block it; the board service rejects an unknown ownerId on create/update yet serves the dangling one with ownerName null. It is a missing state precondition on the delete rather than a body-schema gap, but nothing in schema, domain or database covers it.
- verifier evidence: src/lobby/app/service.ts:49-51; src/lobby/infra/sqlite/playerRepo.ts:19,31-33; migrations/0003_board_properties.sql:7; src/shared/db.ts:8; src/board/app/service.ts:24-26,34-36,47,69; src/lobby/module.ts:9-11

## POST /properties

### board-1: Deed creation is unauthenticated and accepts any player as owner

- category: access
- severity: high
- claim: POST /properties has no authentication or authorization step anywhere on its path, so any anonymous caller can create a title deed and assign it to any existing player by passing that player's id as ownerId; the only owner check is that the player exists.
- finder evidence: src/board/infra/http/routes.ts:43-57 (no preHandler/onRequest, no header schema, handler passes req.body straight to the service); src/board/app/service.ts:34-37, 40-53 (checkOwnerId only calls refs.ownerExists, no acting player); src/board/module.ts:16-23 and src/app.ts:13-25 (no auth hook registered; grep for addHook/preHandler/onRequest/authorization in src returns nothing)
- verifier: The POST route has only a body schema and passes req.body to the service; no hook, header schema or acting player exists anywhere in src (grep for addHook/preHandler/onRequest/authorization is empty). The only owner check is that the player exists, so any caller can create a deed owned by any existing player.
- verifier evidence: src/board/infra/http/routes.ts:43-57; src/board/app/service.ts:34-37,40-53; src/board/module.ts:16-23; src/app.ts:13-25

### board-4: Body types are coerced, so null/boolean/string pass as integers and non-strings as name

- category: validation
- severity: medium
- claim: The app keeps Fastify's default Ajv type coercion (only removeAdditional is overridden), so POST /properties accepts wrong-typed JSON values the schema declares as integer/string: {price:"100", rent:null} is stored as price 100, rent 0 and {name:123, price:true, rent:false} as name "123", price 1, rent 0, all with 201; the domain validators run after coercion and cannot see the original type. Confirmed by an in-memory inject probe.
- finder evidence: src/app.ts:13 (ajv customOptions sets only removeAdditional: false, coerceTypes left at Fastify default 'array'); src/board/infra/http/routes.ts:7-10, 47-52 (name/price/rent declared as string/integer); src/board/domain/property.ts:48-55, 64-76 (validators receive the already coerced value)
- verifier: app.ts overrides only removeAdditional, and @fastify/ajv-compiler's defaults keep coerceTypes: 'array', so wrong-typed values are coerced before the domain validators see them. My own in-memory inject probe reproduced it: {price:"100",rent:null} -> 201 with price 100, rent 0; {name:123,price:true,rent:false} -> 201 with name "123", price 1, rent 0.
- verifier evidence: src/app.ts:13; node_modules/.pnpm/@fastify+ajv-compiler@4.0.7/node_modules/@fastify/ajv-compiler/lib/default-ajv-options.js:6; src/board/infra/http/routes.ts:7-10,47-52; src/board/domain/property.ts:48-55,64-76

### board-6: Name uniqueness is case-insensitive only for ASCII

- category: validation
- severity: low
- claim: The documented rule 'name unique case-insensitively (409 on clash)' is enforced with SQLite COLLATE NOCASE, which folds only ASCII letters, so POST /properties accepts two deeds whose names differ only in the case of a non-ASCII letter: 'Élan' then 'élan' both returned 201 in an in-memory inject probe.
- finder evidence: docs/features/board-property.md:13 (rule); src/board/app/service.ts:29-32, 50 (assertNameFree relies on findByName); src/board/infra/sqlite/propertyRepo.ts:26 (WHERE "name" = ? COLLATE NOCASE); migrations/0003_board_properties.sql:10 (unique index also NOCASE, so no backstop); src/board/domain/property.ts:48-55 (validateName trims only, no case or Unicode normalization)
- verifier: The documented case-insensitive uniqueness rule rests only on SQLite NOCASE, which folds ASCII only; neither the domain nor the route normalises case. A throwaway node:sqlite probe with the same lookup and unique index: 'Élan' stored, lookup of 'élan' returns nothing and the second insert succeeds, so POST passes assertNameFree and the index does not backstop it.
- verifier evidence: docs/features/board-property.md:13; src/board/app/service.ts:29-32, 43, 50-51; src/board/infra/sqlite/propertyRepo.ts:26; migrations/0003_board_properties.sql:10; src/board/domain/property.ts:48-55; src/board/infra/http/routes.ts:7

## GET /properties

No confirmed findings.

## GET /properties/:id

No confirmed findings.

## PATCH /properties/:id

### board-2: Any caller can edit any deed and transfer or clear its owner

- category: access
- severity: high
- claim: PATCH /properties/:id identifies no acting player and never compares a caller to the deed's current ownerId, so an anonymous caller can change name, colorGroup, price and rent of any deed and set ownerId to any existing player or to null, taking a deed from its owner.
- finder evidence: src/board/infra/http/routes.ts:71-86 (no auth hook, body allows ownerId at line 78); src/board/app/service.ts:63-73 (update loads the deed and applies the patch; line 69 only runs checkOwnerId = player exists, lines 34-37); docs/features/board-property.md:25-26 (clearing and transfer are plain PATCH)
- verifier: PATCH accepts ownerId in the body and the service applies the patch after loading the deed, checking only that the new owner exists; nothing identifies a caller or compares it to the current ownerId. The feature doc describes clearing and transfer as plain PATCH and names no access rule.
- verifier evidence: src/board/infra/http/routes.ts:71-86; src/board/app/service.ts:63-73 (line 69 -> 34-37); docs/features/board-property.md:25-26

### board-5: Coerced null/boolean silently overwrite rent and price

- category: validation
- severity: medium
- claim: Because body coercion is on, PATCH /properties/:id with {"rent": null} (or false) returns 200 and sets rent to 0, and {"price": true} sets price to 1, instead of a 400 for a non-integer; a deed created with rent 7 came back with rent 0 after PATCH {rent:null} in an in-memory inject probe.
- finder evidence: src/app.ts:13 (coerceTypes not disabled); src/board/infra/http/routes.ts:9-10, 76-81 (price/rent typed integer in the PATCH body); src/board/app/service.ts:67-68 (patch.rent !== undefined is true for the coerced 0, validateRent(0) passes); src/board/domain/property.ts:71-76
- verifier: Fastify's default Ajv options keep coerceTypes on and src/app.ts only overrides removeAdditional, so null/false become 0 and true becomes 1 before the integer check; the service then sees a defined, valid integer. My own in-memory inject probe: deed with rent 7, PATCH {rent:null} -> 200 rent 0, {rent:false} -> 200 rent 0, {price:true} -> 200 price 1, while {rent:'x'} -> 400.
- verifier evidence: src/app.ts:13 (only removeAdditional overridden); node_modules/.pnpm/@fastify+ajv-compiler@4.0.7/node_modules/@fastify/ajv-compiler/lib/default-ajv-options.js:6 (coerceTypes: 'array'); src/board/infra/http/routes.ts:9-10, 76-81; src/board/app/service.ts:67-68; src/board/domain/property.ts:64-76

### board-7: Rename can collide with a non-ASCII case variant of another deed

- category: validation
- severity: low
- claim: PATCH /properties/:id checks the new name with the same ASCII-only COLLATE NOCASE lookup, so a deed can be renamed to a name that differs from another deed's name only in the case of a non-ASCII letter (e.g. to 'élan' while 'Élan' exists) and gets 200 instead of the 409 the case-insensitive uniqueness rule requires.
- finder evidence: docs/features/board-property.md:13; src/board/app/service.ts:65, 70 (validateName then assertNameFree(property.name, id)); src/board/app/service.ts:29-32; src/board/infra/sqlite/propertyRepo.ts:26; migrations/0003_board_properties.sql:10
- verifier: PATCH runs the same validateName + assertNameFree path over the same ASCII-only NOCASE lookup and index, so a rename to 'élan' while 'Élan' exists is not caught and returns 200. Same root cause as board-6 but a separate entry point (PATCH vs POST), so not counted as a duplicate; one fix in the shared name comparison closes both.
- verifier evidence: docs/features/board-property.md:13; src/board/app/service.ts:65, 70-71, 29-32; src/board/infra/sqlite/propertyRepo.ts:22, 26; migrations/0003_board_properties.sql:10; src/board/infra/http/routes.ts:71-85

## DELETE /properties/:id

### board-3: Any caller can delete any deed, owned ones included

- category: access
- severity: high
- claim: DELETE /properties/:id has no authentication and no check of the deed's ownerId, so an anonymous caller who knows or lists an id (GET /properties is open) can delete any title deed, including one a player owns.
- finder evidence: src/board/infra/http/routes.ts:88-95 (no auth hook; handler calls properties.remove(req.params.id)); src/board/app/service.ts:75-77 (remove deletes by id, never reads the deed or its owner); src/board/infra/sqlite/propertyRepo.ts:24, 36-38 (unconditional DELETE ... WHERE id = ?)
- verifier: DELETE validates only the uuid param, then the service deletes by id without reading the deed or its owner; no auth hook exists. An in-memory inject probe returned 204 for an anonymous DELETE.
- verifier evidence: src/board/infra/http/routes.ts:88-95; src/board/app/service.ts:75-77; src/board/infra/sqlite/propertyRepo.ts:24,36-38

## GET /health

No confirmed findings.

## POST /trade-offers (createTradeOffer)

### trade-create-1: No refusal is specified for an acting player who is in no room

- category: validation
- severity: medium
- claim: The ten ordered refusals of createTradeOffer contain no check that the acting player (the proposer) is currently in a room: refusal 9 only tests whether the recipient or a title deed is 'of another room', which is undefined when the proposer has no room. A player who never joined or has left a room can therefore submit an offer whose outcome the contract does not fix (e.g. to another roomless player, money only), although PRD AC-01/AC-05, the sad.md precondition and the CONTEXT invariant all require the proposer to be in a room.
- finder evidence: docs/features/trade-offers/contracts/openapi.yaml:45-60 (refusal list, no proposer-membership check; :58 is the only room check); docs/features/trade-offers/sad.md:297 ('Precondition - the proposer is a player in a room') and :310 ('are the two players in the same room'); docs/features/trade-offers/PRD.md:137,169 (Given a proposer is in a room); docs/features/trade-offers/CONTEXT.md:26 (always between two different players of the same room); docs/features/trade-offers/data-model.md:165-166 (existing players are in no room); docs/features/trade-offers/adr/0004-one-room-per-player.md:69 (a proposer can have left the room)
- verifier: None of the ten ordered refusals tests that the acting player is in a room; refusal 9 only covers a recipient or title deed 'of another room', and the proposer's membership appears in sad.md only as an unenforced precondition note, while data-model.md states existing players are in no room. The one check that could cover it (sad.md:310, 'are the two players in the same room') leaves the answer for a roomless proposer undefined, so a money-only offer between two roomless players has no outcome fixed by the contract.
- verifier evidence: docs/features/trade-offers/contracts/openapi.yaml:45-60 (refusal list; :58 is the only room check); docs/features/trade-offers/sad.md:297 (precondition only), :310, :320 (branch names only 'of another room'); docs/features/trade-offers/PRD.md:146,169-173 (AC-02/AC-05 Given 'a proposer is in a room'); docs/features/trade-offers/CONTEXT.md:26; docs/features/trade-offers/data-model.md:165-166; docs/features/trade-offers/adr/0004-one-room-per-player.md:69-70

### trade-create-2: Body types are coerced by the app's Ajv settings, looser than the contract's schema

- category: validation
- severity: medium
- claim: The contract declares money as `type: integer`, propertyIds as an array and note as string-or-null and says a body that does not match the schema is refused as `invalid` (refusal 2), but src/app.ts overrides only `removeAdditional` and leaves Fastify's default `coerceTypes: 'array'` on. A route built from this schema in buildApp accepts `money: null` (becomes 0), `money: "150"`, `money: true` (becomes 1), `propertyIds: "<uuid>"` (becomes a one-item array) and `note: 12` (becomes "12") with no 400; neither the contract nor sad.md §8 requires strict typing to be switched on. Reproduced in memory with the TradeOfferCreate schema and the same Ajv options: all five bodies returned 200.
- finder evidence: src/app.ts:12-13 (ajv customOptions sets only removeAdditional: false); docs/features/trade-offers/contracts/openapi.yaml:48-49 (refusal 2), :471-479 (propertyIds array, money integer minimum 0), :483-486 (note type); docs/features/trade-offers/sad.md:501 (validation is the route JSON schema, 'the domain checks again'), :503 (a negative or fractional amount is invalid); docs/features/trade-offers/PRD.md:147-149 (AC-02)
- verifier: buildApp overrides only removeAdditional, so Fastify's default Ajv option coerceTypes: 'array' stays on, and nothing in the contract or sad.md §8 requires strict typing. I reproduced it in memory on fastify 5.12.7 with the TradeOfferCreate schema and the same Ajv options: money null (->0), "150" (->150), true (->1), propertyIds as a bare uuid string (->one-item array) and note 12 (->"12") all returned 200, while 1.5 and -1 returned 400.
- verifier evidence: src/app.ts:13; node_modules/.pnpm/@fastify+ajv-compiler@4.0.7/.../lib/default-ajv-options.js:6 (coerceTypes: 'array'); docs/features/trade-offers/contracts/openapi.yaml:48-49 (refusal 2), :471-479 (propertyIds array, money integer minimum 0), :483-486 (note type); docs/features/trade-offers/sad.md:501,503

### trade-create-3: propertyIds has no upper bound

- category: validation
- severity: low
- claim: TradeOfferSide.propertyIds declares `uniqueItems` and an item format but no `maxItems`, so one authenticated request may name as many distinct UUIDs per side as the body size limit allows, and the flow asks `board` for the owner and room of every one of them before refusing; sad.md states there is no rate limiting and the one-pending-offer limit does not bound requests that end in a refusal.
- finder evidence: docs/features/trade-offers/contracts/openapi.yaml:471-475 (no maxItems); docs/features/trade-offers/sad.md:312-313 ('the owner and the room of every title deed named in the offer'), :508 (Rate limiting: none, bounded only by one pending offer per proposer); docs/features/trade-offers/PRD.md:340-341 (offer flooding)
- verifier: TradeOfferSide.propertyIds has uniqueItems and a uuid item format but no maxItems, and the sync report states outright that neither source bounds the number of title deeds; the flow asks board for the owner and room of every named deed before any refusal, and no rate limit exists. The only bound I found is Fastify's default bodyLimit (1 MiB, app built without an override), which still allows tens of thousands of UUIDs per request, so severity is low but the gap is real.
- verifier evidence: docs/features/trade-offers/contracts/openapi.yaml:471-475 (no maxItems); docs/features/trade-offers/contracts/api-sync-report.md:158 ('No upper bound on money or on the number of title deeds: neither source has one'); docs/features/trade-offers/sad.md:312-313 (board asked for every deed), :316-323 (refusals come after the lookups), :508 (Rate limiting: None); docs/features/trade-offers/PRD.md:340-341 (flooding bounded only by one pending offer); src/app.ts:13 (Fastify created without bodyLimit, default applies)

### trade-create-4: 400 versus 409 tells any player whether a player or title deed id exists in another room

- category: access
- severity: low
- claim: Refusal 7 answers `invalid` (400) when the recipient or a title deed does not exist and refusal 9 answers `conflict` (409) when it exists in another room, so an authenticated player with no pending offer learns from the status alone whether an arbitrary player id or title deed id exists outside their own room. This departs from the room-as-tenant filter of CONTEXT.md and from the repo default that a thing the caller may not know about answers as if it did not exist; the PRD's visibility statement covers only balances and owners inside the caller's room.
- finder evidence: docs/features/trade-offers/contracts/openapi.yaml:54 (refusal 7), :58 (refusal 9), :109-114 (noSuchDeed 400 example), :128-133 (otherRoom 409 example); docs/features/trade-offers/CONTEXT.md:55-57 (tenant is the room; another player learns nothing); docs/features/trade-offers/PRD.md:329-331 (visibility is inside a room); .claude/rules/openapi.md Defaults ('404 not_found (also when the caller may not know the thing exists)'); docs/features/trade-offers/sad.md:498 (the kind split this follows)
- verifier: The contract answers 400 invalid for a recipient or deed that does not exist and 409 conflict for one that exists in another room, with refusal 8 (pending offer) in between, so a player without a pending offer can tell from the status whether an arbitrary id exists outside their room. No document accepts this disclosure: the PRD visibility clause covers only balances and owners inside the room, and the not_found masking is specified only for offers. Practical impact is limited because ids are random UUIDs and the current lobby/board GET-by-id routes are open, but the contract gap is as claimed.
- verifier evidence: docs/features/trade-offers/contracts/openapi.yaml:54 (refusal 7 invalid), :55 (refusal 8), :58 (refusal 9 conflict), :109-114 (noSuchDeed 400), :128-133 (otherRoom 409); docs/features/trade-offers/contracts/api-sync-report.md:199-200 (AC-05 split into two kinds decided at contract stage, another room -> conflict); docs/features/trade-offers/sad.md:318-321, :498; docs/features/trade-offers/CONTEXT.md:39-40, :55-57 (tenant is the room; masking stated only for offers); docs/features/trade-offers/PRD.md:329-331 (visibility inside a room only), :335-337; .claude/rules/openapi.md Defaults ('404 not_found (also when the caller may not know the thing exists)'); src/lobby/infra/http/routes.ts:53, src/board/infra/http/routes.ts:65 (existing open GET by id)

## GET /trade-offers/incoming (listIncomingTradeOffers)

No confirmed findings.

## GET /trade-offers/outgoing (listOutgoingTradeOffers)

No confirmed findings.

## POST /trade-offers/{id}/accept (acceptTradeOffer)

### trade-decide-1: Acceptance re-check cannot tell the offer's room from any room the two players now share

- category: validation
- severity: medium
- claim: The contract's refusal 6 for accept re-checks only that the proposer and recipient are in the same room now and never re-checks the room of the title deeds, and the offer row stores no room; so if both players leave the offer's room and join another one together within the five-minute lifetime, the recipient can accept and exchange title deeds of the original room, although AC-18 requires a refusal when a side has left the room and the create operation refuses a deed of another room.
- finder evidence: docs/features/trade-offers/contracts/openapi.yaml:243-245 (refusal 6: players left the room, owner, money; no deed-room check) vs openapi.yaml:58 (create refuses a title deed of another room); docs/features/trade-offers/data-model.md:112-113 (row stores no room); docs/features/trade-offers/adr/0004-one-room-per-player.md:75-77 (player may be in different rooms over time; re-check asks only whether both are in the same room now); docs/features/trade-offers/sad.md:183,186 (lobby: same-room question; board guarded command refuses only when giver is not the owner), sad.md:255; docs/features/trade-offers/PRD.md:275-278 (AC-18), CONTEXT.md:26,55
- verifier: The accept re-check is defined only as 'are both players in the same room now' plus ownership and money; nothing re-reads the room of the title deeds and the offer row keeps no room to compare against. ADR-0004 explicitly allows a player to be in different rooms over time, so two players who move together to another room pass refusal 6 and exchange deeds of the original room, although create refuses a deed of another room and the PRD lists cross-room trade as denied. No clause in the docs says leaving a room strips ownership, so the ownership check does not close it.
- verifier evidence: docs/features/trade-offers/contracts/openapi.yaml:243-245 (refusal 6: left the room, owner, money only) vs openapi.yaml:58 (create refusal 9: title deed of another room); docs/features/trade-offers/data-model.md:112-113 (row stores no room); docs/features/trade-offers/adr/0004-one-room-per-player.md:75-77 (different rooms over time; re-check asks only same room now); docs/features/trade-offers/sad.md:183,185-186 (deed room needed only for AC-02/AC-06; guarded command refuses only on non-owner), sad.md:255-258; docs/features/trade-offers/PRD.md:275-278 (AC-18), PRD.md:304-305, PRD.md:335-336 (cross-room trade denied); docs/features/trade-offers/CONTEXT.md:30,55

## POST /trade-offers/{id}/reject (rejectTradeOffer)

No confirmed findings.


# Rejected findings

- lobby-4, GET /players: Full player list, with ids, is readable by anyone
  - claim: GET /players requires no credential and returns every player's id, name, token and createdAt, so an unauthenticated caller can enumerate all player ids, which are the only thing PATCH and DELETE /players/:id need.
  - rejected because: The facts are accurate (no credential, every row returned), but the response holds only id, name, token (the board piece, not a secret) and createdAt, so the read itself exposes nothing protected. The harm described is entirely the missing auth on PATCH/DELETE, so it duplicates lobby-1 and lobby-2; a player id is an identifier, not a credential.
- trade-decide-2, POST /trade-offers/{id}/accept (acceptTradeOffer): No refusal specified for a title deed that was deleted after the offer was made
  - claim: The contract lists no refusal for accepting a pending offer that names a title deed which no longer exists (DELETE /properties/:id is live and trade_offer_properties.property_id has no foreign key), so the status and code a caller gets in that case is unspecified: refusal 6 covers only a giver that no longer owns the deed, and the only documented 404 on this route means 'no such offer'.
  - rejected because: A contract clause already covers it: a deleted title deed is a deed the giver no longer owns, so refusal 6 and the board guarded command ('refusing when a giver is not the owner') give 409 conflict with the offer left pending. Nothing unvalidated gets through either way; the claim is about a missing example/wording in the spec, not an access or input-validation gap. The deletion facts themselves are true (DELETE /properties/:id is live, property_id has no FK).

# Not verified

None.

