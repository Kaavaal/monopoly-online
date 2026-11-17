---
status: Draft
owner: "Kaavaal"
updated_at: "2026-11-17"
feature_size: "S"
stage: "04-05"
prd: "game-prd.md"
target_surfaces: [backend-service]
---

# SAD: trade offers

> Inputs: [PRD](./game-prd.md) · [CONTEXT](./CONTEXT.md) · [ARCHITECTURE.md](../../../ARCHITECTURE.md) ·
> ADRs in [game-adr/](./game-adr/)

## 1. Introduction and goals

After this feature a proposer can offer one recipient in the same room some of their title deeds and/or money
for some of the recipient's. The recipient accepts or rejects the trade offer as a whole, or it becomes an
expired offer after its offer lifetime of 5 minutes. On acceptance ownership, balances and room membership are
checked again, and everything named changes hands at once or nothing does. Without trading a color group ends
up in one hand only by luck and the first full games stall ([PRD](./game-prd.md) §1, §2).

**Quality goals**

1. QG-1 Integrity: an exchange happens in full or not at all; money in a room is unchanged by any exchange and
   every title deed has exactly one owner after every action (PRD §6 rows 3, 4).
2. QG-2 One winner: when two players act on the same thing at once, exactly one wins, 100 of 100 runs (PRD §6
   row 5).
3. QG-3 Speed: p95 of one write action (propose, accept, reject) ≤ 5 ms; p95 of one list action, 300 rows
   ≤ 10 ms (PRD §6 rows 1, 2).

**Stakeholders**

| Role | Interest |
|---|---|
| proposer | creates a trade offer, sees every offer they sent with its state |
| recipient | sees pending offers addressed to them, accepts or rejects each as a whole |
| game owner | approves this document and the ADRs |

## 2. Constraints

**Stack**: Node 24, TypeScript 6.0.3, Fastify 5.12.7, `node:sqlite`, vitest 5.0.5, pnpm 11.0.9.

**Repo rules**

- one feature touches one context; another context is reached through its `<Ctx>Api` from `module.ts`, handed
  over in `src/app.ts`
- a context takes only the api of a context created before it in `src/app.ts`; the graph stays acyclic
- imports point inward: `infra` → `app` → `domain` → `shared/errors`; no context reads another's tables
- schema changes are new files `migrations/NNNN_<ctx>_<name>.sql`, next free number is 0004; applied migrations
  are frozen
- refusals leave domain and app code as `notFound` / `conflict` / `invalid` from `src/shared/errors.ts`; a
  SQLite constraint error is a 500, so every check is made in the service before the write
- every route declares a JSON schema for params, body and response
- tests go through HTTP with `makeTestApp()`
- `node:sqlite` is synchronous: with no `await` between a read and a write nothing can race
- `pnpm check` is green before every commit

**From the PRD**

- three prerequisites are separate features, in this order: rooms and their members (`lobby`), money accounts
  with a move of money between two players (`bank`), title deeds that belong to a room with an owner change for
  several deeds at once (`board`). None exists in the code today: `lobby` has players only, `BankApi` and
  `BoardApi` are empty. This document names what trade offers need from each; it does not design them
- the game must know which player is acting (PRD §11); AC-15 and AC-16 cannot be tested without it
- nothing from `turns`
- no outside deadline; the order of upcoming work sets the urgency
- out of scope, PRD §3: counter-offers, withdrawal, closing an offer that can no longer be honoured, any signal
  that an offer arrived, several recipients, partial acceptance

## 3. Context and scope

A proposer and a recipient reach the backend over HTTP with JSON; nothing else talks to it. Trust ends at the
HTTP interface: neither the body nor "I am player X" is believed without a check, and what a player may see is
decided inside the backend (PRD §8, AC-15, AC-16). The same player is a proposer in one trade offer and a
recipient in another; the diagram shows the two roles, not two kinds of account.

**External systems**: none, as a decision of this version. The expiry of an offer needs no scheduler or queue,
and no signal reaches players (PRD §3).

```mermaid
C4Context
    title trade offers — System Context

    Person(proposer, "proposer", "Creates a trade offer, sees the offers they sent")
    Person(recipient, "recipient", "Sees pending offers addressed to them, accepts or rejects")
    System(game, "monopoly-online backend", "One Node.js process, one SQLite file")

    Rel(proposer, game, "Creates and lists trade offers", "HTTP, JSON")
    Rel(recipient, game, "Lists, accepts, rejects trade offers", "HTTP, JSON")
```

## 4. Solution strategy

**Surface**: backend-service.

1. **A new `trades` context owns trade offers**
   ([ADR-0001](./game-adr/0001-trades-own-trade-offers-in-a-new-context.md)): a trade offer is neither a title
   deed nor an account, and one acceptance changes both. `trades` takes `LobbyApi`, `BoardApi` and `BankApi` and
   is created last in `src/app.ts` (lobby, board, bank, turns, trades), so the graph stays acyclic and `board`
   and `bank` stay unaware of each other (§2). It answers PRD §11, first question. Considered: offers inside
   `board` (needs a new arrow board → bank and `bank` created before `board`); offers inside `bank` (bank →
   board, and a money context would own deeds in offers).
2. **One acceptance runs in one SQLite transaction, and `board` and `bank` guard their own writes**
   ([ADR-0002](./game-adr/0002-shared-run-exchange-in-one-transaction.md)): `trades` opens a transaction, asks
   `board` to move the deeds and `bank` to move the money, marks the offer accepted, and commits; nothing inside
   awaits. `board` refuses to move a deed whose owner is not the giving side, `bank` refuses to move money a
   side does not hold, and any refusal rolls everything back, so the offer stays pending. This is QG-1 and
   QG-2: a crash between the two writes cannot leave a half-done exchange, and of two acceptances the second
   one sees the first one's result. A small transaction helper is added to `src/shared/db.ts`. Considered:
   check everything first, then write without a transaction (no race thanks to synchronous SQLite, but a crash
   or an unexpected error between the writes leaves half an exchange); undo steps on failure (more code, the
   same crash window).
3. **The acting player is resolved by `lobby` from a secret it issued to that player**
   ([ADR-0003](./game-adr/0003-lobby-resolve-the-acting-player-from-a-lobby-issued-secret.md)): every request
   carries the secret, `trades` asks `LobbyApi` who is acting and never takes a player id for the actor from
   the body. The secret itself (issue, storage, lookup) is a fourth prerequisite feature in `lobby`; this
   document fixes only that it exists and what `trades` asks. It answers PRD §11, second question, and makes
   AC-15 and AC-16 testable. Considered: a player id sent by the client and believed (anyone acts as anyone,
   against §3 and PRD §8); leaving it undecided for the prerequisite feature (AC-15, AC-16 stay untestable and
   §6 has no first step).

## 5. Building block view

**Slice**

```
src/trades/
├── domain/offer.ts              offer, its states, validation, repository interface
├── app/service.ts               propose, accept, reject, list; takes the three apis
├── infra/sqlite/offerRepo.ts
├── infra/http/routes.ts
└── module.ts                    exports TradesApi (empty: nobody calls trades)
migrations/NNNN_trades_offers.sql   next free number when the feature is built
test/trades/offer.test.ts
```

`trades` owns two tables: trade offers, and the title deeds each side of an offer gives. Columns are left to
the data model.

**Context map delta**

| Context | Owns | Uses before | Uses after |
|---|---|---|---|
| `trades` (new) | trade offers | — | `lobby`, `board`, `bank` |
| `lobby` | players, rooms | nothing | nothing |
| `board` | tiles, title deeds | `lobby` | `lobby` |
| `bank` | player accounts, transfers | `lobby` | `lobby` |

Creation order in `src/app.ts` after this feature: lobby, board, bank, turns, trades. Every arrow from `trades`
points to a context created before it; nothing points to `trades`.

**Api calls across a boundary**

None of these calls exists today; each is built by its prerequisite feature (§2).

| From | To | Call | Reads or writes | PRD AC |
|---|---|---|---|---|
| `trades` | `lobby` | who is acting, from the secret the request carries | read | AC-15, AC-16 |
| `trades` | `lobby` | does this player exist | read | AC-03 |
| `trades` | `lobby` | are these two players members of one room | read | AC-05, AC-10 |
| `trades` | `board` | who owns each of these title deeds, if it exists | read | AC-03, AC-04 |
| `trades` | `board` | move these title deeds from this owner to that one; refuses when a deed has another owner | write | AC-07, AC-08, AC-11 |
| `trades` | `bank` | how much money this player holds | read | AC-04 |
| `trades` | `bank` | move this amount from this player to that one; refuses when the player does not hold it | write | AC-07, AC-09, AC-11b |

```mermaid
C4Container
    title trade offers — Containers

    Person(proposer, "proposer")
    Person(recipient, "recipient")

    Container_Boundary(game, "monopoly-online backend, one Node.js process") {
        Container(trades, "trades context", "TypeScript", "Trade offers and the exchange")
        Container(lobby, "lobby context", "TypeScript", "Players, rooms, the acting player")
        Container(board, "board context", "TypeScript", "Title deeds and their owners")
        Container(bank, "bank context", "TypeScript", "Player accounts, transfers")
    }

    ContainerDb(sqlite, "SQLite file", "node:sqlite", "Each context owns its tables")

    Rel(proposer, trades, "Creates and lists trade offers", "HTTP, JSON")
    Rel(recipient, trades, "Lists, accepts, rejects trade offers", "HTTP, JSON")
    Rel(trades, lobby, "Asks who is acting and who shares a room", "LobbyApi, in-process")
    Rel(trades, board, "Reads owners, moves title deeds", "BoardApi, in-process")
    Rel(trades, bank, "Reads balances, moves money", "BankApi, in-process")
    Rel(trades, sqlite, "Reads and writes trade offers", "SQL")
    Rel(lobby, sqlite, "Reads players and rooms", "SQL")
    Rel(board, sqlite, "Reads and writes owners", "SQL")
    Rel(bank, sqlite, "Reads and writes balances", "SQL")
```

`turns` is not drawn: the feature does not call it.

## 6. Runtime view

Two of the four transitions in PRD §9 are drawn: the two that read or change other contexts' data. Rejecting
an offer, listing offers and the expiry of an offer are left to the next stage. Refusals are checked in the
order the branches are drawn, top to bottom; the first one that applies is the answer.

**Flow 1: pending offer → accepted offer** (AC-07, AC-08, AC-09, AC-10, AC-11, AC-11b, AC-13, AC-14, AC-15,
AC-16)

```mermaid
sequenceDiagram
    actor recipient
    participant trades as trades context
    participant lobby as lobby context
    participant board as board context
    participant bank as bank context
    participant sqlite as SQLite file
    recipient->>trades: accept the trade offer
    trades->>lobby: who is acting
    lobby-->>trades: the acting player
    trades->>sqlite: read the offer
    alt no such offer, or the acting player is neither its proposer nor its recipient
        trades-->>recipient: refused, trades.offer_not_found
    else the acting player is its proposer
        trades-->>recipient: refused, trades.only_recipient_answers
    else the offer is an accepted offer or a rejected offer
        trades-->>recipient: refused, trades.offer_already_answered
    else the offer lifetime has run out
        trades-->>recipient: refused, trades.offer_expired
    else the offer is a pending offer
        trades->>sqlite: begin the transaction
        trades->>lobby: are both players members of one room
        alt a player has left the room
            trades->>sqlite: roll back
            trades-->>recipient: refused, trades.player_left_room
        else both are members of the room
            trades->>board: move the title deeds each side gives
            alt a title deed has another owner
                board-->>trades: refused
                trades->>sqlite: roll back
                trades-->>recipient: refused, board.deed_owner_changed
            else every title deed is with the side that gives it
                board->>sqlite: write the new owners
                trades->>bank: move the money each side gives
                alt a side does not hold the money
                    bank-->>trades: refused
                    trades->>sqlite: roll back
                    trades-->>recipient: refused, bank.insufficient_funds
                else both sides hold the money
                    bank->>sqlite: write the balances
                    trades->>sqlite: mark the offer accepted and commit
                    trades-->>recipient: accepted offer
                end
            end
        end
    end
```

After a roll back the offer is still a pending offer (PRD §9). Two acceptances never interleave: each runs
from "begin the transaction" to "commit" or "roll back" without a pause, so the second one sees what the first
one committed (AC-11, AC-11b).

**Flow 2: — → pending offer** (AC-01, AC-02, AC-03, AC-04, AC-05, AC-06)

```mermaid
sequenceDiagram
    actor proposer
    participant trades as trades context
    participant lobby as lobby context
    participant board as board context
    participant bank as bank context
    participant sqlite as SQLite file
    proposer->>trades: propose a trade offer
    trades->>lobby: who is acting
    lobby-->>trades: the acting player, now the proposer
    alt a side gives nothing, the recipient is the proposer, a deed is named twice, or an amount is not a whole number above zero
        trades-->>proposer: refused, trades.not_a_trade
    else the request is a trade
        trades->>lobby: does the recipient exist, are both members of one room
        lobby-->>trades: answers
        trades->>board: who owns each title deed named
        board-->>trades: owners, none for an unknown deed
        trades->>bank: how much money the proposer holds
        bank-->>trades: the balance
        trades->>sqlite: read the pending offer of this proposer
        alt the recipient or a title deed does not exist
            trades-->>proposer: refused, trades.unknown_player_or_deed
        else the recipient is not in the proposer's room
            trades-->>proposer: refused, trades.recipient_not_in_room
        else a deed is not owned by the side that gives it, or the proposer holds less than they give
            trades-->>proposer: refused, trades.not_yours_to_give
        else the proposer already has a pending offer
            trades-->>proposer: refused, trades.pending_offer_exists
        else nothing stands in the way
            trades->>sqlite: write the pending offer with its offer lifetime
            trades-->>proposer: pending offer
        end
    end
```

A request that carries no valid secret has no code in PRD §10.2, so no branch is drawn for it (§11).

## 7. Deployment view

<!-- N/A: the feature adds no process, port, env variable or scheduled job -->

Nothing changes: one process, one SQLite file. An offer expires without a job (§8, Time).

## 8. Crosscutting concepts

| Concept | Rule in this feature | Where |
|---|---|---|
| Refusals | kinds stay `invalid` / `not_found` / `conflict`; every `trades` route answers with the dotted code of PRD §10.2 in the `code` field, under the status of its kind. The three factories in `src/shared/errors.ts` take an optional code and default to the bare kind, so `lobby` and `board` routes answer as before. A refusal thrown by `board` or `bank` inside an exchange carries their own code and passes through `trades` unchanged | [ADR-0004](./game-adr/0004-shared-carry-the-dotted-refusal-code-in-the-code-field.md), PRD §10.2 |
| Acting player | resolved by `lobby` from the secret the request carries, first step of every route; never read from the body | [ADR-0003](./game-adr/0003-lobby-resolve-the-acting-player-from-a-lobby-issued-secret.md) |
| Hidden offers | an offer is shown only to its proposer and its recipient; to anyone else it is answered exactly as an offer that never existed, and lists hold only the actor's own offers | PRD §8, §10.1, AC-16 |
| Transactions | only an acceptance opens one, because it writes in three contexts; propose and reject are a lookup and one write in `trades` with no `await` between them | [ADR-0002](./game-adr/0002-shared-run-exchange-in-one-transaction.md), `src/shared/db.ts` |
| Time | an offer stores the moment its offer lifetime runs out. "Expired" is never written: a pending offer whose moment has come is an expired offer on every read and every answer, with no job or timer. The clock is the system clock; tests move it with vitest fake timers | PRD §9, AC-13, AC-18 |
| Logging | one info line per acceptance attempt refused by the re-check, with the offer id and the code, no player names; it is what M3 is counted from. Nothing else is added | PRD §7 M3 |
| Validation | JSON schema on every route for params, body and response; unknown body fields are refused; money is whole numbers | kept, [CLAUDE.md](../../../CLAUDE.md), `src/app.ts` |

## 9. Architecture decisions

| ADR | Decision | Gate | Status | Section |
|---|---|---|---|---|
| [NNNN](./game-adr/NNNN-<ctx>-<decision>.md) | <imperative> | <n of 4> | Accepted | §<N> |

Decided inline, below the gate:

- <decision> (§<N>): <criteria that fired, n of 4>

## 10. Quality requirements

<!-- One scenario per QG plus one per remaining PRD §6 row. Numbers copied from PRD §6 character for
character. How verify names the test file and the helper. -->

**QG-1. <name>**

- When: <trigger>
- Then: <PRD §6 target, verbatim>
- How verify: <test/<ctx>/<file>.test.ts through makeTestApp(), what is asserted>

## 11. Risks and technical debt

<!-- Product risk first when a PRD §7 KPI has a trigger. Severity Low / Medium / High, or Open question with
owner and due. -->

| Risk | Severity | Mitigation | Owner | Due |
|---|---|---|---|---|
| <risk> | <Low/Medium/High/Open question> | <what is done> | <who> | <when, for open questions> |

**Accepted debt**

- <what is left on purpose and when it is looked at again>

## 12. Glossary

<!-- Terms from CONTEXT.md this document uses, in its words. A new term goes here marked "not in CONTEXT"
and to the handoff for /sdlc:fix-term. -->

| Term | Meaning |
|---|---|
| <term> | <from CONTEXT.md> |
