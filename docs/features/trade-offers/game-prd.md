---
status: Approved
owner: "Kaavaal"
updated_at: "2026-11-17"
feature_size: "S"
stage: "02"
brief: "../../idea-brief.md"
reference: "src/board"
---

# PRD: trade offers

> Inputs: [brief](../../idea-brief.md) · [CONTEXT](./CONTEXT.md) · reference context `src/board`

## 1. Context

Players in a room cannot trade, so a color group ends up in one hand only by luck, nobody gains a decisive
lead and a game has no natural end. Every player in a room has this problem, most of all one who is one or
two title deeds short of a color group. Nothing has been measured: there are no live players yet.

Trading has to exist before turns and rent arrive, otherwise the first full games stall. There is no outside
deadline; the order of upcoming work sets the urgency.

The approach is the brief's A, "Accept-or-Expire, Nothing More": a proposer sends one recipient a trade offer
of title deeds and/or money; the recipient accepts or rejects it as a whole, or it expires after 5 minutes.
On acceptance ownership, balances and room membership are checked again, and everything changes hands at
once or nothing does. One pending offer per proposer, no withdrawal, no signal that an offer arrived.

Prerequisites, each a separate feature, in this order:

1. rooms and their members
2. money accounts: a balance per player and a move of money between two players
3. title deeds that belong to a room, with an owner change for several deeds at once

This feature also needs the game to know which player is acting (§11).

Data this feature reads or changes: players and rooms in `lobby` (read), title deed owners in `board` (read
and change), balances in `bank` (read and change). Nothing from `turns`. Which context owns trade offers is
open (§11).

Decisions kept against the critic:

- AC-04 and AC-05 stay `invalid` although the same reasons are `conflict` at acceptance (AC-08, AC-09,
  AC-10). Owner's reason: when an offer is proposed it does not exist yet, so a request that names what is
  not the giver's, or a player outside the room, is wrong on its own; `conflict` is for an offer that already
  exists and no longer matches ownership, balances or the room.

## 2. Goals

- A player who is short of a color group can get the missing title deed by making a deal, at any moment of
  the game, as at a real table.
- A recipient who accepts is never left having given without being paid: an exchange happens in full or not
  at all.
- A recipient sees every offer that needs an answer now; a proposer always knows how each of their offers
  ended; an ignored offer ends by itself.

## 3. Non-goals

- Counter-offers: a recipient who wants other terms rejects and proposes an offer of their own.
- Houses and mortgages: neither exists; an offer holds title deeds and money only.
- Trading only in a player's own turn: the table rule allows any moment.
- Several recipients and partial acceptance: the glossary fixes one recipient and a whole answer.
- Gifts and one-sided trades: each side must give something. This guards against typos, not against
  collusion (§8).
- Withdrawing an offer: parked with approaches B and C; the proposer waits for an answer or for the
  5 minutes.
- Closing a pending offer the moment it can no longer be honoured: parked with approaches B and C. A refused
  acceptance changes nothing and the offer stays pending until its 5 minutes run out (AC-08 to AC-10).
- A signal that an offer arrived, and offers visible to the whole room: parked with approach B; the game
  cannot reach players yet.
- A pause before proposing again after a rejection: no real table has one; watched in §8.
- A check that both sides of a trade are of similar value: not in the brief; watched in §8.
- cut in the walk: a recipient's view of answered and expired incoming offers, because the incoming list is
  about what needs an answer now.

## 4. User stories

### US-01: Propose a trade offer

**As a** proposer
**I want** to offer one player in my room some of my title deeds and/or money for some of theirs
**So that** I can get the deed I am missing for a color group without waiting for luck

### US-02: Accept a trade offer

**As a** recipient
**I want** to accept a pending offer as a whole
**So that** everything named in it changes hands at once and I am never left having given without being paid

### US-03: Reject a trade offer

**As a** recipient
**I want** to reject a pending offer
**So that** the proposer knows the answer and is free to offer other terms

### US-04: See my trade offers

**As a** proposer or recipient
**I want** to see, as a recipient, the pending offers addressed to me with what each side gives and when the
lifetime runs out, and, as a proposer, every offer I sent with its state
**So that** I answer in time and know how my own offers ended

## 5. Acceptance criteria

### AC-01 (US-01) — happy

**Given** a proposer and another player in the same room, the proposer owns deed X and holds at least 50,
the other player owns deed Y, and the proposer has no pending offer
**When** the proposer offers X and 50 for Y
**Then** a pending offer addressed to that recipient exists with a lifetime of 5 minutes, both see what each
side gives, and no deed or money has changed hands

### AC-02 (US-01) — error

**Given** a proposer in a room
**When** they propose something that is not a trade: one side gives nothing, the recipient is the proposer,
a deed is named twice, or a money amount is not a whole number above zero
**Then** no offer is created and the proposer is told why

### AC-03 (US-01) — error

**Given** a proposer in a room
**When** the offer names a recipient or a deed that does not exist
**Then** no offer is created and the proposer is told what is unknown

### AC-04 (US-01) — error

**Given** a proposer and a recipient in the same room
**When** the offer names a deed the giving side does not own at that moment, or more money from the proposer
than the proposer holds
**Then** no offer is created and the proposer is told what is not theirs to give; the recipient's money is
not checked now, only at acceptance (AC-09)

### AC-05 (US-01) — cross-context

**Given** a proposer in one room and a player who is not in that room
**When** the proposer addresses an offer to that player
**Then** no offer is created and the proposer is told the player is not in their room

### AC-06 (US-01) — invariant

**Given** a proposer who already has a pending offer
**When** they propose another, to anyone
**Then** the new offer is not created, the first stays pending and unchanged, and the proposer is told they
already have one waiting

### AC-07 (US-02) — happy

**Given** a pending offer whose lifetime has not run out, both sides in the room, each still owning the
deeds they give and holding the money they give
**When** the recipient accepts
**Then** every deed and all money named change hands at once, the offer is an accepted offer, the money in
the room adds up to what it was before, and every deed has exactly one owner

### AC-08 (US-02) — cross-context

**Given** a pending offer in which a deed has changed owner since it was made
**When** the recipient accepts
**Then** nothing changes hands, not even the parts that still hold, the recipient is told a deed has a new
owner, and the offer stays pending until its lifetime runs out

### AC-09 (US-02) — cross-context

**Given** a pending offer in which a side no longer holds the money it gives
**When** the recipient accepts
**Then** nothing changes hands, the recipient is told there is not enough money, and the offer stays pending
until its lifetime runs out; it can be accepted again once the money is there

### AC-10 (US-02) — cross-context

**Given** a pending offer whose proposer or recipient has left the room
**When** the recipient accepts
**Then** nothing changes hands, the recipient is told a player has left the room, and the offer stays pending
until its lifetime runs out

### AC-11 (US-02) — timing

**Given** two pending offers that both give away the same deed: one in which its owner gives it, one in
which another proposer asks its owner for it
**When** both recipients accept at the same moment
**Then** exactly one exchange takes place in full; the other recipient is told the deed has a new owner, and
for them nothing changes hands

### AC-11b (US-02) — timing

**Given** a player holding 500 who gives 300 in each of two pending offers: one they proposed, one addressed
to them
**When** both offers are accepted at the same moment
**Then** exactly one exchange takes place in full; the other acceptance is refused because there is not
enough money, nothing changes hands for it, its offer stays pending, and the money in the room adds up to
what it was before

### AC-12 (US-03) — happy

**Given** a pending offer whose lifetime has not run out
**When** the recipient rejects it
**Then** it is a rejected offer, nothing changes hands, and the proposer may at once propose again, the same
terms included

### AC-13 (US-02, US-03) — timing

**Given** an offer whose 5 minutes have run out
**When** the recipient accepts or rejects at that moment or later
**Then** the answer is refused, the offer is an expired offer, nothing changes hands, and the recipient is
told it expired

### AC-14 (US-02, US-03) — invariant

**Given** an accepted or rejected offer
**When** the recipient answers it again
**Then** the answer is refused, the offer keeps its state, nothing changes hands a second time, and the
recipient is told it was already answered

### AC-15 (US-02, US-03) — authorization

**Given** a pending offer
**When** its proposer tries to accept or reject it
**Then** the answer is refused, the offer stays pending, and the proposer is told only the recipient can
answer

### AC-16 (US-02, US-03, US-04) — authorization

**Given** an offer between two players
**When** any other player, in the room or outside it, tries to see, accept or reject it
**Then** they are told there is no such offer, exactly as for an offer that never existed, and the offer is
unchanged

### AC-17 (US-04) — happy

**Given** a player who sent some offers and has others addressed to them
**When** they look at their offers
**Then** as a recipient they see only pending offers addressed to them, each with what each side gives and
when its lifetime runs out; as a proposer they see every offer they sent with its state; nothing announces a
new offer

### AC-18 (US-04) — happy

**Given** a pending offer nobody answered for 5 minutes
**When** either side looks at their offers afterwards
**Then** the recipient no longer sees it, the proposer sees it as an expired offer, nothing has changed
hands, and the proposer can propose again

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| p95 of one write action (propose, accept, reject) | ≤ 5 ms | timed calls in the feature's test file, 300 calls |
| p95 of one list action, 300 rows | ≤ 10 ms | same |
| money in a room | unchanged by any exchange | sum of balances before and after, in every exchange test |
| title deed owners | exactly one per deed after every action | in every exchange test |
| two players acting on the same thing at once | exactly one wins, 100 of 100 runs | repeated test (AC-11, AC-11b) |

## 7. Metrics

Window for M1 to M3: the first quarter of playtests, about five tables of four. Counted by hand.

| # | Metric | Baseline | Target | Window |
|---|---|---|---|---|
| M1 | share of finished games in which a player holds a complete color group | about 10%, assumed, unmeasured | 35% | first quarter of playtests |
| M2 | share of trade offers that end as expired offers | none | ≤ 40% | same |
| M3 | share of acceptance attempts refused by the re-check (deed has a new owner, not enough money, player left) | none | ≤ 10% | same |
| M4 | exchanges after which the money in the room differs from before | 0 | 0 | every exchange, always |

A finished game is one playtest session of one room that the owner declared finished. This holds until the
game has a start and an end of its own; numbers from before and after that change are not comparable.

M2 watches the main risk of the approach: with no arrival signal, offers nobody saw. M4 watches the brief's
top risk, the half-done swap.

Triggers: M3 above target, or players reporting offers sent by mistake, brings back parked approach C
(withdrawal, closing offers that no longer hold). Parked approach B comes back when the game can tell players
that something changed; M2 above target is the reason to build that first.

## 8. Fair play and privacy

What a player learns. Only the proposer and the recipient see a trade offer. Any other player, in the room
or outside it, cannot tell an offer exists. An exchange that took place shows to the room only through its
result: the title deeds have new owners. A recipient no longer sees an incoming offer once it is answered or
expired.

Abuse at the table:

- **Collusion and kingmaking** (a player hands everything to a friend for one coin): allowed. Each side must
  give something, which stops typos and nothing else. Signal: accepted offers in which one side gives no
  title deed and less than a tenth of the listed price of the deeds it receives.
- **A losing player dragging the game on:** a trade offer blocks nobody; a pending offer stops only its own
  proposer from proposing again. Allowed.
- **Flooding another player:** limited. A proposer has one pending offer at a time, so a recipient faces at
  most one offer per other player. Proposing again right after a rejection is allowed. Signal: three or more
  rejected offers in a row from one proposer to one recipient.
- **A player who left the room:** their pending offers cannot be accepted and expire on their own.
- **Acting in someone else's name:** refused. Depends on the game knowing which player is acting (§11).

Personal data: none beyond the player names the room already shows.

## 9. States

| From | Event | To | AC |
|---|---|---|---|
| — | proposer creates a trade offer | pending offer | AC-01 |
| pending offer | recipient accepts and the re-check of ownership, balances and room holds | accepted offer | AC-07, AC-11, AC-11b |
| pending offer | recipient rejects | rejected offer | AC-12 |
| pending offer | offer lifetime (5 minutes) runs out with no answer | expired offer | AC-13, AC-18 |

An acceptance attempt that fails the re-check (AC-08, AC-09, AC-10, the losing side of AC-11 and AC-11b) is
not a transition: the offer stays a pending offer.

Final states: accepted offer, rejected offer, expired offer. Nothing leaves a final state (AC-13, AC-14).

The glossary also has withdrawn offer and dead offer. Neither is a state in this version: both belong to
parked approaches B and C.

## 10. Who may do what, and refusals

### 10.1 Permissions

| Action | proposer | recipient | other player in the room | player outside the room |
|---|---|---|---|---|
| Propose a trade offer | yes, one pending offer at a time; refused beyond that (says why) | yes, as proposer of an offer of their own | yes, as proposer of an offer of their own | refused (says why): both sides must be in one room |
| Accept a trade offer | refused (says why) | yes | hidden | hidden |
| Reject a trade offer | refused (says why) | yes | hidden | hidden |
| See trade offers | yes: every offer they sent, with its state | yes: pending offers addressed to them | hidden | hidden |

### 10.2 Refusals

Kinds follow the reference context: a player or deed named inside a request that does not exist is `invalid`,
as `board` does for an unknown owner; a thing addressed directly that is gone or hidden is `not_found`. A
check made when an offer is proposed is `invalid`, because no offer exists yet and the request is wrong on
its own; the same check on an existing offer at acceptance is `conflict`, because the state moved on. The
`trades` prefix is provisional until the owning context is decided (§11). `board` and `bank` prefixes mark
rules those contexts own.

| AC | Kind | Code | Message to the player |
|---|---|---|---|
| AC-02 | invalid | `trades.not_a_trade` | Not a trade: each side gives something, to another player, each deed once, money in whole amounts above zero |
| AC-03 | invalid | `trades.unknown_player_or_deed` | No such player or title deed |
| AC-04 | invalid | `trades.not_yours_to_give` | A side does not own what the offer says it gives |
| AC-05 | invalid | `trades.recipient_not_in_room` | That player is not in your room |
| AC-06 | conflict | `trades.pending_offer_exists` | You already have an offer waiting for an answer |
| AC-08 | conflict | `board.deed_owner_changed` | A title deed in this offer has a new owner |
| AC-09 | conflict | `bank.insufficient_funds` | Not enough money to make this exchange |
| AC-10 | conflict | `trades.player_left_room` | A player in this offer has left the room |
| AC-11 | conflict | `board.deed_owner_changed` | A title deed in this offer has a new owner |
| AC-11b | conflict | `bank.insufficient_funds` | Not enough money to make this exchange |
| AC-13 | conflict | `trades.offer_expired` | This offer has expired |
| AC-14 | conflict | `trades.offer_already_answered` | This offer was already answered |
| AC-15 | invalid | `trades.only_recipient_answers` | Only the recipient can answer this offer |
| AC-16 | not_found | `trades.offer_not_found` | No such offer |

## 11. Open questions

- [ ] Which context owns trade offers, and how does one acceptance change deeds and money together? Default
  now: a new context, error prefix `trades`. — owner: Kaavaal, due: architecture-design
- [ ] How does the game know which player is acting? Default now: a prerequisite outside this feature;
  AC-15 and AC-16 cannot be tested without it. — owner: Kaavaal, due: before architecture-design
- [ ] Re-check the unverified rows of the brief's §6 against the product pages. Default now: no row of this
  PRD depends on them. — owner: Kaavaal, due: before architecture-design
