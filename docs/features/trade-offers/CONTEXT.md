---
status: Living
updated_at: "2026-11-17"
---

# Domain Context — trade-offers

## Glossary

- accepted offer — a trade offer the recipient accepted and whose exchange took place in full: every title deed and all money named in it changed hands at once; it cannot be answered again. NOT an acceptance attempt (an attempt that fails the re-check of ownership and balances changes nothing and does not make the offer accepted).
- acting player — the player a request is made by, as the player secret proves it; the only player who can be a proposer or answer as a recipient. NOT a player named in the request (an id in a request body names someone, it never says who is acting).
- expired offer — a trade offer the recipient did not answer within its lifetime; it can no longer be accepted or rejected, and no title deeds or money change hands. NOT rejected offer (a rejected offer was explicitly refused by the recipient; an expired offer ended with no decision from them).
- offer lifetime — the fixed time a trade offer stays pending after the proposer creates it, five minutes for every offer; once it runs out the offer is an expired offer. NOT a turn timer (a lifetime belongs to one offer and runs whatever else happens in the room; it does not limit a player's turn).
- pending offer — a trade offer the recipient has not answered and whose lifetime has not run out; it is the only kind of trade offer that can be accepted or rejected. NOT open offer (the idea brief says "open offer" for the same thing; pending offer is the one canonical name).
- proposer — the player who creates a trade offer and names what they give and what they ask for in return. NOT owner (an owner holds a title deed in board; a proposer may own none of the deeds in the offer, e.g. when offering only money).
- recipient — the one player a trade offer is addressed to and the only player who can accept or reject it. NOT the payee of a transfer (a payee receives money in bank without being asked; a recipient only gets a proposal and receives nothing unless they accept it).
- rejected offer — a trade offer the recipient explicitly refused; it can no longer be accepted, and no title deeds or money change hands. NOT expired offer (an expired offer ended with no decision from the recipient).
- room — the group of players who play one game together on one board; trade offers are possible only between players of the same room. NOT game (a game is one play-through with a start and an end; a room is the players it is played by).
- trade offer — a proposal from one player to another player in the same room to give their own title deeds and/or money in exchange for the other's title deeds and/or money; the recipient accepts or rejects it as a whole, and it expires if left unanswered. NOT transfer (a transfer is a one-way movement of money between accounts in bank; a trade offer is a two-sided proposal that needs the recipient's consent).

## Invariants

- An exchange always happens in full or not at all: after any acceptance attempt the total money held by the players of the room is unchanged and every title deed has exactly one owner.
- Each side of a trade offer always gives at least one title deed or some money, and a title deed is named at most once in the whole offer.
- A trade offer is always between two different players of the same room.
- A proposer can never have more than one pending offer at a time.
- A trade offer is answered at most once. Accepted, rejected and expired are final; nothing moves an offer out of them.
- An offer is never answered after its lifetime has run out, even when the answer was sent before and arrived after.
- Ownership, balances and room membership are always checked again at acceptance; what held when the offer was made proves nothing.

## Sentinel errors

The names follow [game-adr/0004](./game-adr/0004-shared-carry-the-dotted-refusal-code-in-the-code-field.md). `contracts/openapi.yaml` sends only the kind in `code`; `game-contracts/openapi.yaml` sends the name. Three kinds differ between the two contracts (marked). AC numbers are those of [PRD.md](./PRD.md) §5.

| Name | When | Kind | AC |
|---|---|---|---|
| `trades.not_a_trade` | a side gives nothing, a deed is named twice, an amount is negative or fractional, the recipient is the proposer | invalid | AC-02, AC-03, AC-05 |
| `trades.unknown_player_or_deed` | the recipient or a title deed does not exist | invalid | AC-02 |
| `trades.recipient_not_in_room` | the recipient or a title deed is of another room | conflict (game: invalid) | AC-05 |
| `trades.not_yours_to_give` | at proposal, a side gives a deed it does not own or more money than it has | conflict (game: invalid) | AC-06 |
| `trades.pending_offer_exists` | the proposer already has a pending offer | conflict | AC-04 |
| `trades.offer_not_found` | no such offer, or the acting player is neither of its sides; one message for both | not_found | AC-14 |
| `trades.only_recipient_answers` | the proposer tries to accept or reject their own offer | conflict (game: invalid) | AC-08 |
| `trades.offer_already_answered` | the offer is accepted or rejected | conflict | AC-09 |
| `trades.offer_expired` | the offer's lifetime has run out | conflict | AC-12 |
| `trades.player_left_room` | at acceptance, a side is no longer in the room | conflict | AC-18 |
| `board.deed_owner_changed` | at acceptance, a giver no longer owns a title deed; owned by `board` | conflict | AC-16, AC-19 |
| `bank.insufficient_funds` | at acceptance, a payer lacks the money; owned by `bank` | conflict | AC-17 |

Two refusals have no name yet: a proposer other than the acting player (AC-06b, `invalid`) and a missing or unknown player secret (`unauthorized`, arrives with the `lobby` prerequisite, [ADR-0003](./adr/0003-identify-the-acting-player-by-a-lobby-issued-secret.md)).

## Org-filter invariant

The tenant here is the room. A trade offer stores no room of its own: it belongs to the room of its two players, and every title deed in it belongs to that room too. Room membership is read from `lobby` when the offer is made and again at acceptance ([data-model.md](./data-model.md) § `trade_offers`).

Every read is filtered by the acting player, never by a room or an id alone: the incoming list holds only pending offers whose recipient is the acting player, the outgoing list only offers whose proposer is the acting player. An offer the acting player is not a side of answers exactly like one that does not exist (`trades.offer_not_found`), so another player of the same room learns nothing about it.

## Out of scope

- withdrawn offer · the proposer taking an offer back belongs to the parked Approach C, first for the next iteration (PRD §3).
- dead offer · closing an offer that can no longer be honoured comes back only if trial games show refused acceptances; until then such an offer is refused when someone accepts it (PRD §3).
- counter-offer · a recipient who wants other terms rejects and makes a new offer, so an answer stays yes or no.
- several recipients and partial acceptance · one recipient, one whole answer.
- color group mark · a flag on offers that would complete a color group goes with Approach C.
- arrival signal · the product cannot tell a player that something changed; players look at their lists.
- fairness check · a title deed may go for a single coin; collusion is an accepted risk (PRD §6.1).
- houses, mortgages and turn-bound trading · none of them exists in the product yet.
