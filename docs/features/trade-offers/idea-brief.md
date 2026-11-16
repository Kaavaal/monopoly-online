---
status: Confirmed
owner: "Kaavaal"
reviewers: []
updated_at: "2026-11-16"
# feature_size: set by sdlc:classify-size, not here
stage: "01"
depth: medium
ticket: ""
value_score:
  rice: 5
  state: confirmed
  confirmed_at: "2026-11-16"
feasibility_state: confirmed
---

<!-- Stage 01 → see SDLC/plugin/skills/interview/SKILL.md -->
<!-- Why: capture the idea before it's forgotten or retold incorrectly -->

# Idea Brief — trade offers

## 1. Raw idea

> Players in a room can't trade today, so a color group almost never ends up in one hand and games drag on until
> someone quits. I want a player to offer another player a deal: some of my title deeds and/or cash for some of
> theirs; the other side accepts or declines, and if they ignore it, the offer expires. Like haggling at a real
> table, but with the server checking that both sides still own what they give.

## 2. Problem

Without trading, a player completes a color group only by luck, so nobody gains a decisive advantage and a game has
no natural end. This comes from tabletop experience. Nothing has been measured on this product: it has no live
players, and a full game cannot be played on it yet.

## 3. Users

Players sitting in one room at the same time, most of all a player one or two title deeds short of a color group.
Expected audience for the first quarter: about 20 players (five trial tables of four). This number is an assumption.

## 4. Why now

Trading has to exist before turns and rent arrive. Otherwise the first full games stall, because color groups do
not come together. There is no external deadline; the order of upcoming work sets the urgency.

## 5. Out of scope

- counter-offers: a recipient who wants other terms rejects and makes a new trade offer
- houses and mortgages
- restricting trading to a player's own turn; offers can be made and answered at any moment
- trade offers to several recipients, and partial acceptance (the glossary fixes one recipient and a whole answer)

## 6. Competitive analysis

| # | Product · URL | Features | Value per feature (1-5) | Gap |
|---|---|---|---|---|
| 1 | Digital property-trading board games (official edition and clones) · [wiki](https://monopoly.fandom.com/wiki/Trade) | deeds, money and cards in one offer; accept / reject / counter; one clone lets the proposer withdraw and re-checks ownership on answer (unverified) | 3 / 5 / 5 | no offer lifetime, so a game can hang waiting for an answer |
| 2 | Steam Trade Offers · [FAQ](https://help.steampowered.com/en/faqs/view/1115-91C5-050C-1D60) | offers expire after two weeks; sender cancels, recipient declines; an offer turns invalid once an item has left the inventory (all unverified) | 5 / 5 / 5 | lifetime far too long for a real-time game; no table |
| 3 | Colonist.io · [blog](https://blog.colonist.io/improving-the-colonist-trade-system) | counter-offer to any deal; per-player status; embargo on one player | 4 / 4 / 4 | trades interchangeable resources, not unique holdings; lifetime and limits not described |
| 4 | A trading game on Board Game Arena · [thread](https://boardgamearena.com/bug?id=63323) | only the active player proposes (unverified); the game waits for all answers | 3 / 3 | players ask for one-click decline; nothing on expiry |

Footnotes (all 2026-11-16):

1. "online monopoly trade properties cash propose accept decline counter offer digital edition"; page did not
   open, facts from search snippets.
2. "Steam trade offers expire cancel items no longer available"; page came back empty, facts from snippets.
3. "Colonist.io trading rules offer counter accept decline"; the blog post was read in full.
4. "Board Game Arena trade proposal accept refuse counter-offer only active player"; snippets only.

No verified product has an offer lifetime that fits a real-time table.

## 7. Strategic approaches

### Approach A — Accept-or-Expire, Nothing More

- **Thesis**: the proposer sends one recipient a trade offer of title deeds and/or money; the recipient accepts or
  rejects it as a whole, or it becomes an expired offer after a few minutes; on acceptance ownership and balances
  are checked again and everything changes hands at once or nothing does.
- **For whom**: a player one deed short of a color group, at a live table where they can say "check your offers".
- **Outcome metric**: share of games where at least one player holds a complete color group, about 10% → 35%
  (both numbers are assumptions; the baseline is unmeasured).
- **Key trade-off**: offers are never withdrawn or cleaned up; a stale offer fails only when someone accepts it.
- **Effort signal**: S, not counting money accounts and rooms.
- **Recommended?** ●

One open offer per proposer. No in-product signal that an offer arrived.

### Approach B — Open Table Deal Board

- **Thesis**: every player in the room sees every pending trade offer and what it would do to both players' color
  groups, so trading happens in the open with full information.
- **For whom**: active negotiators who read the table, and hesitant players who need to see that a deal is safe.
- **Outcome metric**: the same share of games, about 10% → 45% (assumptions).
- **Key trade-off**: no private deals and more table politics, in exchange for faster completion of color groups.
- **Effort signal**: L.
- **Recommended?** ◯

Stale offers close with a visible reason. The proposer can withdraw. One open offer per recipient.

### Approach C — Fair Trades at Busy Tables

- **Thesis**: the plain accept / reject / expire loop, plus only the rules that keep it fair when several players
  haggle at once, and one nudge toward completing color groups.
- **For whom**: players one or two deeds short of a color group, in rooms of three or more trading at once.
- **Outcome metric**: the same share of games, about 10% → 35% over the first 50 games (assumptions).
- **Key trade-off**: predictable rules, but nothing that makes the feature stand out.
- **Effort signal**: M.
- **Recommended?** ◯

Adds withdrawal, closing of pending offers that no longer hold, limits (three open offers per proposer, one per
recipient), a personal list of offers, and a mark on offers that complete a color group.

## 8. Multi-perspective feedback

### Engineer

- All three share the riskiest part: one all-or-nothing action that changes title deeds and money, which belong to
  two different parts of the product. It is undecided which part owns trade offers.
- This is the first feature with a lifecycle and with time.
- A has the fewest states. B needs the deed and money parts to report changes back, plus a way to reach everyone
  in a room. C keeps its extra rules inside the acceptance, at the cost of more states.

### Executive

- A is the cheapest way to have trading in place before turns and rent, and it does not delay them.
- B is the strongest for players but pushes turns back the most.
- C's completion mark is the only element aimed straight at the metric; its limits solve a load nobody has seen.
- Severity today: low. There are no live players, yet the first full game stalls without trading.

### UX-researcher

- A: the recipient learns of an offer only if told out loud; a typo cannot be fixed; a stale offer fails after the
  recipient has already decided, which reads as being cheated.
- B: the shared board replaces the missing arrival signal and shows what a deal is worth, at the price of privacy.
- C: withdrawal and the completion mark remove the main mistakes, but arrival is still silent, and the two limits
  are rules no real table has.

### Synthesis matrix

|        | Engineer | Executive | UX |
|--------|:--------:|:---------:|:--:|
| App. A | + fewest states, same shared core | + unblocks turns at lowest cost | − offers unseen, then silently expire |
| App. B | − reverse dependencies, missing delivery channel | − large effort breaks why-now | + discoverable, legible, feels like table |
| App. C | 0 more states, but self-contained | 0 metric nudge, yet premature | 0 fair rules, arrival still silent |

## 9. Trade-offs and edge cases

### Trade-offs per approach

| Approach | Pros | Cons |
|---|---|---|
| A | smallest scope; one-sentence rule; fits the why-now | no withdrawal; stale offers linger; arrival depends on voice |
| B | offers cannot be missed; a deal's value is visible | most effort; no private deals; leans on unbuilt turns and rent |
| C | withdrawal; no "accept, then refused"; a nudge toward the metric | twice the effort of A; limits can be turned against a rival |

### Edge cases

- a title deed in a pending offer changes owner before the offer is answered
- the same deed or money sits in several open offers, and two recipients accept within a second
- a player's balance is too low at the moment of acceptance
- the answer arrives at the very moment the offer expires
- a proposer or recipient leaves the room while an offer is pending
- an offer that gives something for nothing, or to oneself, or names a deed neither player owns
- a rejected proposer sends the same offer again at once

## 10. Risks

- **Half-done swap (top attack vector).** One acceptance changes deed owners and money balances kept in two
  different places; a failure between the two leaves a player who gave a deed and was never paid. Signal: total
  money in a room changes after a trade.
- **Double spend.** In A one deed or the same money can sit in several open offers. Signal: negative balances.
- **Built before what it depends on.** Without rent a complete color group earns nothing, so early trading data
  will not predict behaviour once rent arrives.
- **The metric has no denominator.** A game with a start and an end does not exist, and gifts between colluding
  players inflate the count without games ending sooner.
- **Silent expiry.** With no arrival signal and a lifetime of minutes, most offers may die unseen.

## 11. RICE — Claude proposed

- **Reach (R)**: 20 players per quarter — §3 Users; an assumption, there are no live players.
- **Impact (I)**: 1 — §2 and the Executive view in §8: severity is low today, but the first full game stalls
  without trading.
- **Confidence (C)**: 0.5 — nine open questions in §15, an unmeasured problem, a half-verified §6.
- **Effort (E)**: 2 person-weeks for A (4 for C, 9 for B) — effort signals from §7; nominal units that exclude
  money accounts and rooms.
- **RICE = R × I × C / E = 5** for A (2.5 for C, about 1.1 for B)
- **State**: confirmed

## 12. Feasibility — Claude proposed

- [☐] **Tech**: the nearest shipped feature, title deeds (`docs/features/board-property.md`), only asks whether a
  player exists. Trading needs what the code lacks: rooms and money accounts, one action that changes data of two
  other parts at once, and behaviour that depends on time.
- [☑] **Skills**: the same developer and tooling shipped players and title deeds, including a link between two
  parts (`CAPSTONE_LOG.md`). The slice generator covers plain records only; offer behaviour is written by hand.
- [☐] **Time**: the log holds 4.6 min for players, 2 min for title deeds and 80 s for a follow-up, none with a
  lifecycle. The schedule depends on prerequisites nobody has estimated.
- **State**: confirmed

## 13. Recommendation

**Selected: Approach A — Accept-or-Expire, Nothing More.** A scores RICE 5 against 2.5 for C and 1.1 for B (§11).
Feasibility holds on one point of three, with Tech and Time open (§12), so the smallest scope is the sensible
first bet. The Engineer cell in §8 gives A a plus for the fewest states on the same shared core. In §6 digital
board games describe no offer lifetime and Steam's is two weeks; a lifetime of minutes fills that gap. The UX
minus is accepted for now: withdrawal and the completion mark from C are first in line for the next iteration.

**Locked-in pointer**: the PRD describes one recipient, a whole accept or reject, a lifetime of minutes, a
re-check of ownership and balances on acceptance, an all-or-nothing exchange, one open offer per proposer, no
withdrawal, no arrival signal. Prerequisites: money accounts, rooms, a fixed board composition.

## 14. Parked & rejected approaches

| # | Approach | Status | Reason | Revisit trigger |
|---|---|:---:|---|---|
| C | Fair Trades at Busy Tables | parked | twice the effort for rules that answer a load nobody has seen | first trial games show failed acceptances or offers sent by mistake |
| B | Open Table Deal Board | parked | largest effort; needs a way to reach every player in a room | the product can tell players that something changed |
| - | Title deeds only, money later | rejected | the author made money accounts a precondition | - |
| - | Counter-offers | rejected | out of scope (§5) | - |

## 15. Open questions

- [ ] In what order do money accounts, rooms and a fixed board composition land before trading? — owner: Kaavaal, due: before write-prd
- [ ] Which part of the product owns trade offers, and how does one acceptance change deeds and money together? — owner: Kaavaal, due: architecture-design
- [ ] What is a game with a start and an end? The metric has no denominator without it. — owner: Kaavaal, due: before write-prd
- [ ] Title deeds are shared by the whole product today; a room needs its own board. — owner: Kaavaal, due: before write-prd
- [ ] Exact offer lifetime in minutes. — owner: Kaavaal, due: write-prd
- [ ] How does a recipient learn of an offer when nobody says it out loud? — owner: Kaavaal, due: write-prd
- [ ] Are gifts and one-sided trades allowed? — owner: Kaavaal, due: write-prd
- [ ] What happens to pending offers when a player leaves the room? — owner: Kaavaal, due: write-prd
- [ ] Re-check the unverified rows of §6 against the product pages. — owner: Kaavaal, due: before write-prd

## Related

- [CONTEXT.md](CONTEXT.md) — glossary: color group, expired offer, proposer, recipient, room, trade offer
- [board-property.md](../board-property.md) — title deeds, the nearest shipped feature
- [ARCHITECTURE.md](../../../ARCHITECTURE.md) — context map

## DoD self-check

- [x] 15 sections present
- [x] No anti-pattern terms
- [x] Length ≤ 5 pages (~2200 words)
- [x] Frontmatter status: Confirmed
- [x] RICE confirmed (state: confirmed)
- [x] Feasibility confirmed (state: confirmed)
- [x] Recommendation present with rationale citing 4 upstream sections (§6, §8, §11, §12)
