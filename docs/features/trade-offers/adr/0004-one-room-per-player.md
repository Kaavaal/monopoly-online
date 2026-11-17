---
status: Accepted
owner: "Kaavaal"
reviewers: []
updated_at: "2026-11-17"
feature_size: M
stage: "03"
ticket: ""
---

# 0004 — Keep a player in at most one room at a time

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Kaavaal, with Claude during the clarify-prd sweep. Recorded after the fact with decide-adr: the
  decision was not part of the architecture-design walk.

## Context

PRD AC-18 lets a player leave a room, so a player could join another one, and the PRD did not say whether a
player can be in two rooms at once. The clarify-prd sweep of 2026-11-17 found that three things depend on the
answer: whether the limit of one pending offer (AC-04) is counted per player or per room, whether the two lists
of offers (AC-13, AC-15) cover every room or the current one, and whether a player has one balance or one per
room (AC-01, AC-06). The owner settled it in that session and PRD §1 now states it as an assumption about rooms.
Rooms and their players are a prerequisite feature in `lobby`, so this decision is also a requirement on that
feature.

## Decision drivers

- PRD AC-04, AC-13, AC-15: the limit and both lists are worded per player ("a proposer already has a pending
  offer", "the offers they made").
- CONTEXT.md, org-filter invariant, and data-model.md § `trade_offers`: an offer stores no room; its room is
  the room of its two players, read from `lobby` when the offer is made and again at acceptance.
- SAD §5: `trades` asks `lobby` whether two players are in the same room and `bank` for the balance of a
  player. Neither question names a room.
- SAD quality goal 1 (exchange atomicity): the invariant "the total money held by the players of the room is
  unchanged" needs one balance per player to be checkable.

## Considered options

1. **A player is in at most one room at a time** — the limit of one pending offer, both lists and the balance
   are counted per player.
2. **A player may be in several rooms** — the limit, the lists and the balance are counted per pair of player
   and room; an offer and a money account each carry a room.
3. **Leave it open until the rooms feature in `lobby` is designed** — a question in PRD §8 with "one room" as
   the default for now.

## Decision outcome

**Chosen:** option 1. It is what the acceptance criteria, the data model and the apis of SAD §5 already
assume, so nothing that is written changes. Option 2 adds a room to the offer row, to the money account and
to every question `trades` asks `lobby` and `bank`, for a case the product has no use for: the players of a
game sit in one room at the same time (PRD §1). Option 3 would leave AC-04, AC-13 and AC-15 open to two
readings while the tasks are already cut.

## Consequences

**Positive**
- `trade_offers` needs no `room_id` and no index on it; the one-pending-offer check and both lists filter by
  player only.
- `bank` keeps one balance per player, and the room total of quality goal 1 is the sum over the players of
  the room.
- The apis `trades` needs from `lobby` and `bank` (SAD §5) stay as drawn.

**Negative**
- This is a rule the `lobby` rooms feature must enforce, and that feature does not exist yet. If it lets a
  player join a second room, the per-player limit, lists and balance are silently wrong and nothing in
  `trades` detects it.
- An offer made in a room the proposer has left still counts against their limit until it ends, so a player
  who changes rooms can be unable to propose for up to five minutes (PRD §1).
- Allowing several rooms later is a schema change in three contexts: a room on the offer row, an account per
  player and room in `bank`, membership as a set in `lobby`, plus a backfill of existing rows.

**Neutral**
- A player may still be in different rooms over time; only being in two at once is ruled out.
- The acceptance re-check of room membership (AC-18) is unchanged: it asks whether both players are in the
  same room now.

## Links

- PRD: [PRD.md](../PRD.md) §1 (assumption about rooms), AC-04, AC-13, AC-15, AC-18
- SAD: [sad.md](../sad.md) §5 (what `trades` needs from `lobby` and `bank`), §9
- Data model: [data-model.md](../data-model.md) § `trade_offers`
- Related ADR: [0001](./0001-own-trade-offers-in-a-new-trades-context.md),
  [0003](./0003-identify-the-acting-player-by-a-lobby-issued-secret.md)
