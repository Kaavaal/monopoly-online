---
status: Approved
owner: "Kaavaal"
reviewers: []
updated_at: "2026-11-17"
feature_size: "S"
stage: "03"
ticket: ""
---

# PRD — trade-offers

> **Inputs (required):** [idea-brief](../../idea-brief.md) · [CONTEXT](./CONTEXT.md)
> **Reference module:** `src/board` — title deeds, their owners, the kinds of refusal already in use.
> **External context channels used:** project docs: [ARCHITECTURE.md](../../../ARCHITECTURE.md),
> [board-property.md](../board-property.md).

## 1. Context

Without trading, a player completes a color group only by luck, so nobody gains a decisive advantage and a game
has no natural end. The players affected sit in one room at the same time, most of all a player one or two
title deeds short of a color group. This comes from tabletop experience: the product has no live players yet and
a full game cannot be played on it, so nothing has been measured.

Trading has to exist before turns and rent arrive. Otherwise the first full games stall, because color groups do
not come together. There is no external deadline; the order of upcoming work sets the urgency.

The committed approach is Approach A from the idea brief, "Accept-or-Expire, Nothing More" (§13): a proposer
sends one recipient a trade offer of title deeds, money or both; the recipient accepts or rejects it as a whole,
or it becomes an expired offer; on acceptance ownership and balances are checked again and everything changes
hands at once or nothing does. A proposer has one pending offer at a time, an offer cannot be taken back, and
the product sends no signal that an offer arrived.

Traceability:

- Reference module `src/board`: a title deed has a name, a color group and an optional owner, and the owner must
  be a known player. Title deeds are shared by the whole product today, not tied to a room, and anyone can change
  a deed's owner. Refusals come in three kinds: the thing does not exist, the action conflicts with the current
  state, the input is not valid.
- [ARCHITECTURE.md](../../../ARCHITECTURE.md): the parts of the product that will hold money and turns are still
  empty, and each part owns its own data. Which part owns trade offers is not decided (§8).
- Prerequisites, each a separate feature and outside this PRD (the feature is sized S on that basis): rooms with
  their players, money accounts with balances, title deeds that belong to one room, and a way for the product to
  know which player is acting.
- Decisions taken in the write-prd interview on 2026-11-17: the offer lifetime is five minutes; each side of an
  offer must give something; a player can look up their own offers on request; the glossary terms dead offer and
  withdrawn offer describe behaviour that is not part of this version (§3).

## 2. Goals

- A player short of a color group can get the missing title deed from another player in the room through a deal
  both of them agreed to.
- A trade happens in full or not at all: no player gives a title deed or money without receiving what was
  agreed.
- An offer nobody answers ends on its own, so it never holds up its proposer or the table.

## 3. Non-goals

- Counter-offers: a recipient who wants other terms rejects the offer and makes a new one, so an answer stays a
  plain yes or no.
- Houses and mortgages: neither exists in the product; an offer holds title deeds and money only.
- Restricting trading to a player's own turn: offers can be made and answered at any moment, as at a real table,
  and turns do not exist yet.
- Trade offers to several recipients, and partial acceptance: the glossary fixes one recipient and a whole
  answer.
- Taking an offer back (withdrawn offer) and a mark on offers that complete a color group: both belong to the
  parked Approach C and are first in line for the next iteration (idea brief §13).
- Closing an offer that can no longer be honoured (dead offer): it comes back with Approach C if the first trial
  games show refused acceptances (idea brief §14; the Refused acceptances KPI in §7). Until then such an offer is
  refused only when someone tries to accept it.
- A signal that an offer arrived: the product has no way to tell a player that something changed. Players say
  it out loud and look at their own offers.
- A history of answered offers for the recipient: the recipient's list holds only the pending offers addressed
  to them. Offers they already answered and expired offers are not listed in this version; a recipient who tries
  to answer such an offer is still told how it ended (AC-09, AC-12).
- A check that a trade is fair: a title deed may be traded for a single coin. Collusion is an accepted risk in
  this version (§6.1).

## 4. User stories

### US-01: Propose a trade offer

**As a** proposer
**I want** to offer one player in my room some of my title deeds, money or both in exchange for some of theirs
**So that** I can get the title deed I am missing for a color group without waiting for luck

### US-02: Accept a trade offer

**As a** recipient
**I want** to accept a pending offer as a whole
**So that** everything named in it changes hands at once and the deal is done

### US-03: Reject a trade offer

**As a** recipient
**I want** to reject a pending offer
**So that** the proposer knows the answer is no and is free to make another offer

### US-04: Let an unanswered offer expire

**As a** proposer
**I want** an offer the recipient ignores to end on its own when its offer lifetime runs out
**So that** I am not left waiting, unable to make a new offer

### US-05: Find pending offers addressed to me

**As a** recipient
**I want** to see only the pending offers addressed to me
**So that** I can answer them before their lifetime runs out

### US-06: See how my offer ended

**As a** proposer
**I want** to see the trade offers I made and the state of each
**So that** I know whether the deal happened and whether I can propose again

### US-07: Refuse a trade that no longer holds

**As a** recipient
**I want** an acceptance to go through only if both sides still own what they give and can still pay
**So that** I never hand over a title deed or money and get less than was agreed

## 5. Acceptance criteria

### AC-01 (US-01) — happy path

**Given** a proposer and another player are in the same room, the proposer owns every title deed they offer and
has at least the money they offer, the other player owns every title deed asked of them and has at least the
money asked of them, and the proposer has no pending offer
**When** the proposer offers those title deeds, money or both in exchange for the other player's
**Then** the system records a pending offer addressed to that player as its recipient, and confirms to the
proposer what each side gives and when the offer lifetime runs out; no title deed and no money changes hands yet

### AC-02 (US-01) — error

**Given** a proposer is in a room
**When** the proposer submits an offer that names an amount of money that is negative or not a whole number,
names the same title deed twice, or names a title deed or a player that does not exist
**Then** the system creates no offer and tells the proposer which part of the offer must be corrected

### AC-03 (US-01) — domain invariant

**Given** a proposer is in a room with another player
**When** the proposer submits an offer in which one side gives neither a title deed nor money
**Then** the system creates no offer and tells the proposer that each side of a trade offer must give at least
one title deed or some money

### AC-04 (US-01) — domain invariant

**Given** a proposer already has a pending offer
**When** the proposer submits another offer, to the same or to a different player
**Then** the system creates no offer and tells the proposer that they may have only one pending offer at a time,
and when the current one runs out

### AC-05 (US-01) — cross-context

**Given** a proposer is in a room
**When** the proposer addresses an offer to themselves or to a player who is not in the same room
**Then** the system creates no offer and tells the proposer that a trade offer is possible only between two
different players of the same room

### AC-06 (US-01) — cross-context

**Given** a proposer and another player are in the same room
**When** the proposer submits an offer in which a side gives a title deed it does not own, or more money than it
has
**Then** the system creates no offer and tells the proposer which title deed or which amount the named side
cannot give

### AC-06b (US-01) — authorization

**Given** a player is in a room
**When** the player attempts to make a trade offer in which another player is named as the proposer
**Then** the system creates no offer and tells the player that a trade offer can be made only in one's own name

### AC-07 (US-02) — happy path

**Given** a pending offer, both sides still in the room, each side still owning every title deed it gives and
still having at least the money it gives
**When** the recipient accepts the offer
**Then** every title deed and all money named in the offer change hands at once, the offer becomes an accepted
offer, and the system confirms to the recipient what they gave and what they received

### AC-08 (US-02) — authorization

**Given** a pending offer
**When** its proposer attempts to accept or reject it
**Then** the system refuses and tells the proposer that only the recipient can answer a trade offer; the offer
stays pending

### AC-09 (US-02) — domain invariant

**Given** an offer that is already an accepted offer or a rejected offer
**When** the recipient attempts to accept or reject it
**Then** the system refuses, tells the recipient how the offer ended, and changes nothing

### AC-10 (US-03) — happy path

**Given** a pending offer
**When** the recipient rejects it
**Then** the offer becomes a rejected offer, no title deed and no money changes hands, the system confirms the
rejection to the recipient, and the proposer can make a new offer at once

### AC-10b (US-03) — happy path

**Given** the recipient has just rejected an offer
**When** the same proposer at once makes the same offer to the same recipient again
**Then** the system records it as a new pending offer with its own offer lifetime, and the earlier offer stays a
rejected offer

### AC-11 (US-04) — happy path

**Given** a pending offer that the recipient has not answered
**When** its offer lifetime of five minutes runs out
**Then** the offer is an expired offer, no title deed and no money changes hands, and the proposer can make a
new offer

### AC-12 (US-04) — domain invariant

**Given** an expired offer
**When** the recipient attempts to accept or reject it, even if the answer was sent in the last moment and
arrived after the offer lifetime had run out
**Then** the system refuses, tells the recipient that the offer has expired, and changes nothing

### AC-13 (US-05) — happy path

**Given** a recipient with pending offers addressed to them
**When** the recipient asks for their offers
**Then** the system shows only the pending offers addressed to them, each with its proposer, what each side
gives and when its offer lifetime runs out; offers they already answered and expired offers are not shown

### AC-14 (US-05) — authorization

**Given** a trade offer in any state between a proposer and a recipient
**When** another player, who is neither of them, attempts to see, accept or reject it
**Then** the system does not reveal that the offer exists and changes nothing

### AC-15 (US-06) — happy path

**Given** a proposer who has made trade offers
**When** the proposer asks for the offers they made
**Then** the system shows each of them with its recipient, what each side gives and its state (pending,
accepted, rejected or expired) and, for a pending offer, when its offer lifetime runs out

### AC-16 (US-07) — cross-context

**Given** a pending offer in which a title deed has changed owner since the offer was made
**When** the recipient accepts the offer
**Then** the system refuses the acceptance and tells the recipient which title deed no longer belongs to the
side giving it; no title deed and no money changes hands, and the offer stays pending until it is rejected or
expires

### AC-17 (US-07) — cross-context

**Given** a pending offer in which a side no longer has the money it gives
**When** the recipient accepts the offer
**Then** the system refuses the acceptance and tells the recipient which side cannot pay; no title deed and no
money changes hands, and the offer stays pending until it is rejected or expires

### AC-18 (US-07) — cross-context

**Given** a pending offer whose proposer has left the room
**When** the recipient accepts the offer
**Then** the system refuses the acceptance and tells the recipient that both players must be in the room; no
title deed and no money changes hands, and the offer stays pending until it is rejected or expires

### AC-19 (US-07) — domain invariant

**Given** two pending offers in which the same player gives the same title deed
**When** the recipients of both accept at the same moment
**Then** exactly one acceptance goes through in full and the other is refused as in AC-16; the title deed has
one owner, and the total money held by the players of the room is the same as before the two acceptances

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| Latency p95, making or answering an offer | ≤ 250 ms | server-side duration of the propose, accept and reject actions, sampled in the automated test run |
| Latency p95, listing a player's offers | ≤ 150 ms | server-side duration of the two list actions, same run |
| Exchange atomicity | 0 partial exchanges: after every acceptance attempt the total money in the room is unchanged and every title deed has exactly one owner | invariant check after each acceptance in the automated tests, including a run in which the exchange is made to fail midway |
| Concurrency | of 2 acceptances competing for one title deed, exactly 1 goes through, in 100 of 100 repetitions | repeated automated test |
| Expiry accuracy | 0 answers accepted after the five-minute lifetime has run out | automated test with a controlled clock |

Availability: N/A. The product has no production deployment and no SLO window yet.

## 6.1 Security / privacy

- **Data classification:** internal. Offers are game state of a private room; no real money is involved.
- **Personal data touched:** none. An offer refers to players the product already knows; it adds no new fields
  about a person.
- **AuthZ/AuthN impact:** three new permission checks. Only the acting player can make an offer in their own
  name; only the recipient can accept or reject an offer; only its proposer and its recipient can learn anything
  about an offer: the proposer sees every offer they made, the recipient sees the pending offers addressed to
  them and is told how an offer ended when they try to answer it.
  All three depend on a capability the product lacks today: knowing which player is acting (§8).
- **Abuse cases:**
  - Acting as another player (making an offer in someone else's name, answering an offer addressed to someone
    else): denied. This cannot be enforced until the product knows which player is acting.
  - Cross-room trade (an offer to a player of another room, or naming a title deed of another room): denied, with
    the same-room rule explained.
  - Snooping on other players' offers, pending or ended: the product does not reveal that the offer exists.
  - One-coin dump (a losing or leaving player hands every title deed to a friend for a single coin): allowed
    and accepted in this version. Signal to watch: accepted offers in which one side gives only one coin.
  - Offer flooding: bounded by one pending offer per proposer. A rejected proposer may send the same offer
    again at once (AC-10b); no further limit in this version.
- **Security review:** Required, light. This is the first feature whose rules depend on who is acting; the
  review covers how the product learns that, at architecture-design.

## 7. Metrics / KPIs

- **Complete color groups** — share of finished games in which at least one player holds a complete color
  group. Baseline: about 10% (assumed, unmeasured), target: 35% over the first 50 finished games. Measurement
  plan: counted from the first trial games once a finished game is defined (§8).
- **Answered offers** — share of trade offers accepted or rejected before they expire. Baseline: 0 (new),
  target: at least 60% over the first five trial tables.
- **Refused acceptances** — share of acceptance attempts refused because ownership, a balance or the room
  changed. Baseline: 0 (new), target: at most 10% over the first 50 acceptance attempts. Above that, Approach C
  comes back (idea brief §14).
- **Trade integrity** — number of acceptances after which the total money in a room changed. Baseline: 0,
  target: 0 at all times.

## 8. Open questions

- [ ] How does the product know which player is acting? Default now: every permission check in §5 assumes it
  does. — owner: Kaavaal, due: before /sdlc:architecture-design
- [ ] In what order do rooms, money accounts and per-room title deeds land, each as its own feature? Default
  now: all three ship before trade offers. — owner: Kaavaal, due: before /sdlc:break-tasks
- [ ] Which part of the product owns trade offers, and how does one acceptance change title deeds and money
  together? Default now: undecided. — owner: Kaavaal, due: /sdlc:architecture-design
- [ ] What is a finished game, the base of the first KPI? Default now: the KPI is not measured until this is
  defined. — owner: Kaavaal, due: with the turns feature
- [ ] Is five minutes the right offer lifetime? Default now: five minutes. — owner: Kaavaal, due: after the
  first five trial tables
