---
status: Comparison
owner: "Kaavaal"
updated_at: "2026-11-16"
stage: "01"
score:
  rice: 1.75
  state: confirmed
feasibility: confirmed
---

# Game brief: trade offers

A comparison run of the game-brief skill. `idea-brief.md` stays the input for write-prd until the layout is settled at the end of the module.

## 1. Raw idea

> Players in a room can't trade today, so a color group almost never ends up in one hand and games drag on until
> someone quits. I want a player to offer another player a deal: some of my title deeds and/or cash for some of
> theirs; the other side accepts or declines, and if they ignore it, the offer expires. Like haggling at a real
> table, but with the server checking that both sides still own what they give.

## 2. At the table

- **Real table:** the official rule. Any two players may trade title deeds and money at any moment, in anyone's
  turn. Nobody waits.
- **Online now:** no trading. A color group completes only by luck, so no one gains a decisive lead. Tabletop
  experience, not measured: a full game cannot be played yet.

## 3. Players

Every player in a room, above all one holding part of a color group. Expected in playtests: about 7 players a
month (assumed; no live players yet).

## 4. Why now

The owner wants games of the same length that more often end decisively. Trading puts a complete color group in
one hand, so it must exist before rent gives that group its weight.

## 5. Out of scope

- counter-offers · the recipient rejects and sends a new trade offer
- houses and mortgages · neither exists; offers hold title deeds and money only
- several recipients, partial acceptance · one recipient answers the whole offer
- turn-only trading · the official rule allows any moment
- one-sided trades · each side must give something; guards against typos, not collusion (§10)

## 6. Other games

| # | Game · link | How they do it | What is missing |
|---|---|---|---|
| 1 | Dicey Deal · [site](https://diceydeal.com/) | an offer mixes cash and deeds; accept, decline or counter | nothing on expiry |
| 2 | Archopoly · [site](https://play.wleeaf.dev/archopoly/) | offers at any time wait in an inbox: accept, reject or counter | no lifetime; private inbox |
| 3 | Monopoly Online · [rules](https://monopoly-game.io/en/rules) | propose in your own turn or while owing a payment; 3 trades a turn; refused when one side is worth over twice the other | no trading outside your turn |
| 4 | monopoly-websockets · [repo](https://github.com/terragady/monopoly-websockets) | cash for one deed; the owner has 20 seconds to answer; the proposer learns the result | one deed for cash only |
| 5 | Colonist.io · [blog](https://blog.colonist.io/improving-the-colonist-trade-system/) | each player's answer shows to the table; counter-offers; embargo | resources, not unique deeds; no lifetime |

Searched "how player-to-player trading works in an online Monopoly-style browser game: propose trade of
properties and cash, accept, decline, counter" and "Colonist.io or Board Game Arena trade offer rules: who can
propose, accept or decline, counter-offer, offer timeout or cancellation" on 2026-11-16. Rows come from page
excerpts, not full reads. None says what a player sees when an offer can no longer be honoured.

## 7. Approaches

One metric for all three: the share of finished games where a player holds a complete color group, about
10% → 50%. Both numbers are assumptions.

### A. Table-faithful trade offers (table-faithful)

- **Thesis:** any player can offer a roommate title deeds and/or cash for theirs at any moment; the recipient
  says yes or no.
- **Gains most:** the player one deed short of a color group.
- **Metric:** shared.
- **Trade-off:** cheapest, but the recipient may miss an offer before it expires.
- **Effort:** S once rooms and money exist. One lifetime for all; the proposer may withdraw.

### B. Open table trade offers (digital-only)

- **Thesis:** every trade offer is a public, timed card in the room; what the proposer promised cannot be
  promised twice.
- **Gains most:** the recipient: a notification, a countdown, a clear outcome.
- **Metric:** shared.
- **Trade-off:** no secret deals or bluffing; the most to build.
- **Effort:** L. Adds a countdown, room trade history, a hold on what was promised, notifications.

### C. Table trade with a visible deal (middle)

- **Thesis:** you offer one player a deal as at a real table, and the game settles what friends argue about:
  what was agreed and whether it was withdrawn in time.
- **Gains most:** the recipient, never held to a deal no longer real.
- **Metric:** shared.
- **Trade-off:** no private offers; haggling means reject and re-offer.
- **Effort:** S to M. A plus two digital parts: an offer is frozen once sent and visible to the whole room,
  with how it ended; an offer that can no longer be honoured is marked dead, reason shown.

## 8. Reviews

### Engineer

- Today `lobby` has players, no rooms; `board` has title deeds shared by the whole game; `bank` and `turns` are
  empty; the game cannot tell which player is asking.
- All three first need two new slices (rooms with membership, accounts with transfers) and deeds tied to a room;
  then A and C add one slice, B about four.
- Missing calls: same-room check, a deed's owner, an owner change for several deeds at once, a player's
  balance, a money move between two accounts. B adds holds, notifications, a signal back from payments.
- Hardest: acceptance swaps deeds and money across two contexts as one all-or-nothing step. Nothing runs in the
  background, so expiry is judged when an offer is read or answered.

### Game designer

- A: private offers hide side deals; bluffing and spam are free.
- B: fairest, but its hold against forced payments is a rule for rent, which does not exist.
- C: outcomes as public as B; bluffs are exposed, not prevented.
- Game length: about neutral in all three.

### Player

- A: light on a phone, but nothing announces an offer; Accept can fail unexplained.
- B: least waiting, but feed, countdowns, history crowd a small screen.
- C: feels like the table; "dead" is a new word, but the reason explains it.

| | Engineer | Game designer | Player |
|---|:---:|:---:|:---:|
| A | + one slice after prerequisites | - hidden deals, free spam and bluffing | - silent failures, offers go unnoticed |
| B | - holds, notifications, a backwards call | 0 fairest, but the hold is premature | 0 fair and clear, heavy on a phone |
| C | + same cost as A, clearer outcomes | + transparency deters abuse cheaply | + table feel, failures explain themselves |

## 9. Edge cases

| Situation | What the player sees | Refusal |
|---|---|---|
| a deed in the offer changed owner before the answer | "offer dead: deed has a new owner" | conflict |
| a side cannot pay at acceptance | "offer dead: not enough money" | conflict |
| the answer arrives after the lifetime | "offer expired" | conflict |
| accept and withdraw land together | the first wins; the other sees how it ended | conflict |
| one deed offered to three players, all accept | the first succeeds; the rest see a dead offer | conflict |
| a side left the room meanwhile | "offer dead: player left the room" | conflict |
| one side gives nothing; an offer to oneself; a deed neither side owns; a recipient from another room | "not a trade"; no offer is created | invalid |
| the offer, a player or a deed in it does not exist | "no such offer" (player, deed) | not found |

## 10. Risks

- **Worst: the one-coin dump.** A losing or leaving player hands every deed to a friend for one coin. The game
  is decided outside its rules, and the metric rises without more decisive games. C only shows it to the room
  afterwards.
- **Debt dodge.** Once rent exists, a player owing money moves deeds to an ally and goes bankrupt empty.
- **Swap mid-move.** An accept lands while another player resolves landing on that deed.
- **Half-done swap.** A failure between deeds and money leaves a player who gave unpaid.
- **Offer flood and sniping.** With no limit one player buries another in public offers; with four or more
  players each visible offer invites a rival one.
- **Unseen offers.** C has no arrival signal.

## 11. Score

For approach C.

- **Reach:** 7 · players a month in playtests (§3), assumed
- **Impact:** 1 · more decisive endings (§2), the game designer's plus; held at 1 because without rent a
  complete color group pays nothing. A: 0.5, B: 1.
- **Confidence:** 0.5 · eight open questions (§15), no measured baseline
- **Effort:** 2 days with prerequisites. `LOG.md` has a plain slice at 2 to 5 agent minutes; priced here at
  0.25 day with review (two prerequisites, the deed change), 1 day for the offer slice as the first with a
  lifecycle and an all-or-nothing swap, 0.25 day for C's final state and reason. A: 1.75 days, B: 5 days.
- **RICE:** 7 × 1 × 0.5 / 2 = 1.75 · confirmed. A: 1.0, B: 0.7.

## 12. Feasibility

- [ ] **Contexts ready:** no. Players and title deeds have code; rooms, membership, accounts and transfers do
  not; deeds are not tied to a room.
- [x] **Rules clear:** the official rule is settled; loose ends in §15.
- [x] **Time:** A and C fit the next two weekends (2 days of 4); B does not.

## 13. Recommendation

**Approach C.** RICE 1.75 against 1.0 for A and 0.7 for B (§11). It fits the owner's next two weekends, though
rooms and accounts come first (§12). It alone has three pluses in §8; the player's cell reads "table feel,
failures explain themselves", where A gets its minus. No game in §6 says what a player sees when an offer can
no longer be honoured; C's dead offer with a reason fills that gap. Owner accepted on 2026-11-16.

## 14. Parked

| Approach | Why parked | Brings it back |
|---|---|---|
| A | hidden deals and silent failed accepts, to save a quarter day | players ask for private deals after playtests |
| B | 5 days, no way to notify players, a hold rule for rent, which does not exist | the game can notify players, and bait offers appear in playtests |

## 15. Open questions

- [ ] Which context owns trade offers? The engineer suggests a fifth one using `lobby`, `board`, `bank`. ·
  Kaavaal, before architecture-design
- [ ] In what order do rooms, accounts, per-room deeds land? · Kaavaal, before write-prd
- [ ] How does the game know who is asking? · Kaavaal, before write-prd
- [ ] Exact offer lifetime (game 4 in §6 uses 20 seconds). · Kaavaal, write-prd
- [ ] What stops the one-coin dump: nothing, or a value check as in game 3 of §6? · Kaavaal, write-prd
- [ ] May a player trade while owing a payment? · Kaavaal, with rent
- [ ] Cap open offers per proposer? · Kaavaal, write-prd
- [ ] What is a finished game? The metric needs it. · Kaavaal, before write-prd

## 16. Contexts touched

| Context | What it gives this feature | Exists today? |
|---|---|---|
| lobby | players; rooms and their members | partly: no rooms |
| board | title deeds, their owners, an owner change for several deeds at once | partly: deeds not per room, no owner change for others |
| bank | accounts, balances, money moves between two players | no |
| turns | nothing in v1 | no |
| owner of trade offers | the offer, its lifetime, final state, reason | no, undecided (§15) |
