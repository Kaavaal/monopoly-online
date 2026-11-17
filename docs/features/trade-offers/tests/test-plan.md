---
status: Draft
owner: "Kaavaal"
reviewers: []
updated_at: "2026-11-17"
feature_size: "M"
---

# Test plan — trade-offers

A proposer offers one recipient in the same room title deeds, money or both; the recipient accepts or rejects
the offer as a whole, or it expires after five minutes; an acceptance moves everything named in the offer at
once or nothing. This plan maps every acceptance criterion of [PRD.md](../PRD.md) §5 to at least one named
test. It is written before any test exists; `implement-tasks` writes the red tests against it.

Inputs read: [PRD.md](../PRD.md) §5 and §6, [sad.md](../sad.md) §6 and §10, [data-model.md](../data-model.md),
[contracts/openapi.yaml](../contracts/openapi.yaml), [tasks/_epic.md](../tasks/_epic.md).

Levels were chosen by the owner on 2026-11-17: integration for every criterion, contract on top for the five
routes, load for the two latency targets. No unit level and no separate end-to-end level.

## Levels

| Level | Scope | Strategy (generic — no tool names) |
|---|---|---|
| Unit | <!-- N/A: the repo tests only through its HTTP entry point (CLAUDE.md); a domain rule is covered by the integration test of the route that applies it --> | — |
| Integration | One route of `trades` exercised through its real HTTP entry point, against the real database engine with every migration applied and the real `lobby`, `board` and `bank` contexts behind their apis. | A fresh in-memory database and a fresh app per test, built by the repo's test-app helper. Nothing is mocked; the only test double is the clock handed to the app. |
| Contract | The shape of what each of the five routes returns, success and refusal, against `contracts/openapi.yaml`. | Validate the real response of a running app against the schema the contract declares for that route and outcome. No hand-written copy of the schema. |
| E2E | <!-- N/A: the product has one surface, the HTTP api, and the integration level already enters through it; a separate tier would repeat it --> | — |
| Load | The two latency targets of PRD §6. | A separate run with a seeded room, outside the suite that gates a commit. |

No UI surface is declared (`target_surfaces: [backend-service]`), so the component, visual-regression and
e2e-through-UI tiers do not apply.

## AC coverage

Every row is one test. "Nothing changes" means: no offer is recorded or changed, every title deed keeps its
owner and every balance stays the same.

### Propose a trade offer (US-01)

| AC (PRD.md §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| AC-01 | an offer of title deeds and money between two players of one room is recorded as pending | integration | the proposer is shown what each side gives and when the lifetime runs out; owners and balances are unchanged |
| AC-01 | an offer of money only, and one of title deeds only, are both recorded | integration | each is a pending offer addressed to the recipient |
| AC-01 | the recorded offer has the shape the contract declares | contract | the response matches the pending-offer schema |
| AC-02 | a negative amount is refused | integration | no offer; the proposer is told which amount to correct |
| AC-02 | an amount that is not a whole number is refused | integration | no offer; the proposer is told which amount to correct |
| AC-02 | a title deed named twice is refused | integration | no offer; the proposer is told which title deed is repeated |
| AC-02 | a title deed that does not exist is refused | integration | no offer; the proposer is told which title deed is unknown |
| AC-02 | a recipient that does not exist is refused | integration | no offer; the proposer is told the player is unknown |
| AC-03 | an offer in which the proposer gives nothing is refused | integration | no offer; told that each side must give a title deed or money |
| AC-03 | an offer in which the recipient gives nothing is refused | integration | same |
| AC-03 | a side with no title deed and an amount of zero is refused | integration | same: zero means no money |
| AC-03 | a side with a title deed and an amount of zero is accepted as a side | integration | a pending offer is recorded; that side gives no money |
| AC-04 | a second offer while one is pending is refused, to the same recipient and to another | integration | no second offer; told the limit is one and when the current one runs out |
| AC-05 | an offer addressed to oneself is refused | integration | no offer; told a trade is between two different players of one room |
| AC-05 | an offer to a player of another room is refused | integration | same |
| AC-05 | an offer naming a title deed of another room is refused with the same-room rule, not as a deed the side does not own | integration | no offer; told the trade is only for title deeds of the room |
| AC-06 | an offer in which the proposer gives a title deed they do not own is refused | integration | no offer; told which title deed the proposer cannot give |
| AC-06 | an offer asking the recipient for a title deed they do not own is refused | integration | no offer; told which title deed the recipient cannot give |
| AC-06 | an offer in which the proposer gives more money than they have is refused | integration | no offer; told which amount the proposer cannot give |
| AC-06 | an offer asking the recipient for more money than they have is refused | integration | no offer; told which amount the recipient cannot give |
| AC-06b | an offer that names another player as its proposer is refused | integration | no offer; told an offer is made only in one's own name |
| AC-02 – AC-06b | every refusal of a proposal has the shape the contract declares | contract | each response matches the refusal schema |

### Accept a trade offer (US-02, US-07)

| AC (PRD.md §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| AC-07 | an accepted offer moves every title deed and all money at once | integration | each title deed has its new owner, both balances changed by the amounts named, the offer is accepted, the recipient is shown what they gave and received |
| AC-07 | the accepted offer has the shape the contract declares | contract | the response matches the accepted-offer schema |
| AC-08 | the proposer cannot accept their own pending offer | integration | refused; told only the recipient answers; the offer stays pending, nothing changes |
| AC-09 | an accepted offer cannot be accepted again | integration | refused; told the offer was accepted; nothing changes |
| AC-09 | a rejected offer cannot be accepted | integration | refused; told the offer was rejected; nothing changes |
| AC-12 | an expired offer cannot be accepted | integration | refused; told the offer has expired; nothing changes |
| AC-12 | an acceptance one instant before the lifetime ends goes through; at the instant it ends and one instant after it is refused | integration (controlled clock) | the first is accepted; the other two are refused as expired and nothing changes |
| AC-14 | a third player cannot accept an offer between two others, in any state | integration | answered exactly as for an offer that does not exist; nothing changes |
| AC-16 | acceptance is refused when a title deed changed owner after the offer was made | integration | refused; told which title deed no longer belongs to the side giving it; the offer stays pending, nothing changes |
| AC-16 | a title deed that left its owner and came back before the acceptance does not block it | integration | the offer is accepted |
| AC-17 | acceptance is refused when the proposer can no longer pay | integration | refused; told the proposer cannot pay; the offer stays pending, nothing changes |
| AC-17 | acceptance is refused when the recipient can no longer pay | integration | refused; told the recipient cannot pay; the offer stays pending, nothing changes |
| AC-17 | an exchange whose title deed part holds and whose money part fails leaves no trace | integration | the title deed keeps its owner, the room total is unchanged, the offer stays pending |
| AC-18 | acceptance is refused when the proposer has left the room | integration | refused; told both players must be in the room; the offer stays pending |
| AC-18 | acceptance is refused when the recipient has left the room | integration | same |
| AC-18 | a recipient who left the room still finds the offer and can reject it | integration | the offer is in their pending list; rejecting it makes it a rejected offer |
| AC-19 | of two acceptances competing for one title deed exactly one goes through | integration, 100 repetitions, each on a fresh app | one accepted, one refused as in AC-16; the title deed has one owner, the room total is unchanged |
| AC-19b | of two acceptances competing for money one player cannot pay twice exactly one goes through | integration, 100 repetitions, each on a fresh app | one accepted, one refused as in AC-17 and still pending; the room total is unchanged |
| AC-08 – AC-18 | every refusal of an acceptance has the shape the contract declares | contract | each response matches the refusal schema |

### Reject a trade offer (US-03)

| AC (PRD.md §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| AC-10 | a rejected offer changes nothing and frees the proposer | integration | the offer is rejected, owners and balances are unchanged, the proposer can make a new offer at once |
| AC-10 | the rejected offer has the shape the contract declares | contract | the response matches the rejected-offer schema |
| AC-10b | the same offer made again right after a rejection is a new pending offer | integration | a new offer with its own lifetime; the earlier one is still rejected |
| AC-08 | the proposer cannot reject their own pending offer | integration | refused; told only the recipient answers; the offer stays pending |
| AC-09 | an accepted offer cannot be rejected, and a rejected one cannot be rejected again | integration | refused; told how the offer ended; nothing changes |
| AC-12 | an expired offer cannot be rejected | integration | refused; told the offer has expired; nothing changes |
| AC-14 | a third player cannot reject an offer between two others | integration | answered exactly as for an offer that does not exist; the offer is unchanged |
| AC-08 – AC-14 | every refusal of a rejection has the shape the contract declares | contract | each response matches the refusal schema |

### Expiry and the two lists (US-04, US-05, US-06)

| AC (PRD.md §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| AC-11 | an unanswered offer is expired once five minutes have passed | integration (controlled clock) | the proposer's list shows it as expired; owners and balances are unchanged |
| AC-11 | the proposer can make a new offer once the earlier one expired | integration (controlled clock) | a new pending offer is recorded |
| AC-13 | the recipient's list holds only pending offers addressed to them | integration | each with its proposer, what each side gives and when its lifetime runs out |
| AC-13 | offers the recipient answered and offers that expired are not in their list | integration (controlled clock) | the list holds neither the accepted, the rejected nor the expired offer |
| AC-13 | a recipient with no pending offers gets an empty list | integration | an empty list, not a refusal |
| AC-14 | a third player finds an offer between two others in neither of their lists | integration | both lists of the third player are without it, whatever its state |
| AC-15 | the proposer's list holds every offer they made with its state | integration (controlled clock) | pending, accepted, rejected and expired offers, each with its recipient and what each side gives; only the pending one shows when its lifetime runs out |
| AC-15 | the proposer's list does not hold offers addressed to them | integration | an offer they received is absent from the list of offers they made |
| AC-13, AC-15 | both lists have the shape the contract declares | contract | each response matches the list schema, including the empty list |

### Which refusal applies when several do

| AC (PRD.md §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| order 1 before 2, 3 | a third player answering an ended offer learns nothing about it | integration | answered as for an offer that does not exist, not as ended |
| order 2 before 3 | the proposer answering their own expired offer is told only the recipient answers | integration | not told that it expired |
| order 2 before 3 | the proposer answering their own accepted offer is told only the recipient answers | integration | not told how it ended |
| order 3 before 4 | an expired offer whose title deed also changed owner is refused as expired | integration (controlled clock) | told it expired, not which title deed changed |
| order 4: room before title deeds | the proposer left the room and a title deed changed owner | integration | told both players must be in the room |
| order 4: title deeds before money | a title deed changed owner and a side cannot pay | integration | told which title deed changed, not who cannot pay |

## Edge cases / error paths

Each error and authorization criterion has its own rows above (AC-02, AC-06b, AC-08, AC-14). Boundary and
failure cases the PRD implies beyond them:

- a request that does not prove who is acting, or proves it with an unknown credential, on each of the five
  routes → expected: refused before any rule runs, nothing changes, the shape of the refusal matches the
  contract. PRD §6.1 names this "acting as another player"; it has no AC of its own and arrives with the
  `lobby` prerequisite (ADR-0003)
- an offer id that is malformed, and one that is well-formed but unknown, on accept and reject → expected:
  answered as an offer that does not exist
- an amount equal to the side's whole balance → expected: the offer is recorded; after acceptance that side
  has no money left
- an offer that gives every title deed a side owns → expected: recorded and accepted like any other
- two players each with a pending offer to the other, both accepted one after the other → expected: both
  exchanges take place; the room total is unchanged
- the same acceptance sent twice in a row → expected: the first goes through, the second is refused as an
  offer already accepted (AC-09)
- a proposer who changed rooms while their offer is pending → expected: the offer still counts against the
  limit of one until it ends (PRD §1, ADR-0004)
- dependency unavailable → <!-- N/A: the database is in the same process and the PRD states no fallback behaviour -->

## Test data

- Seed strategy: every test builds its own data through the public routes of the contexts that own it: a room
  with its players, a balance per player, title deeds with their owners. Small builder functions shared by the
  suite: a room of N players, a title deed owned by a player, a pending offer between two players. No fixture
  file and no shared seeded database; the bootstrap room of `data-model.md` is the only row a migration
  inserts.
- Entities touched: `trade_offers` and `trade_offer_properties` (`trades`), `properties` with `room_id`
  (`board`), rooms and players (`lobby`), balances (`bank`).
- Integration dependency: the real database engine, in memory, with every migration applied. Not a mocked
  store and not mocked apis of the other contexts.
- Clock: a controlled clock handed to the app for every test marked "controlled clock"; the system clock
  otherwise.
- Cleanup boundary: per test. Each test gets a fresh database and a fresh app and closes the app when it ends,
  so no test sees the rows of another. The 100 repetitions of AC-19 and AC-19b each get their own.
- Blocked until the prerequisites exist: rooms with their players (P1), the player secret (P2), title deeds
  that belong to one room (P3) and money accounts (P4) of `tasks/_epic.md`. No test of this plan can be written
  through HTTP before them.

## NFR validation (load)

- Latency p95 ≤ 250 ms, making or answering an offer → scenario: a room of 8 players in which the acting
  player already has 50 ended offers; at least 100 calls of propose, 100 of accept and 100 of reject in one
  run; assert the p95 of the server-side duration of each action ≤ 250 ms.
- Latency p95 ≤ 150 ms, listing a player's offers → scenario: the same room and run; at least 100 calls of
  each of the two list actions; assert the p95 of each ≤ 150 ms.
- Tool: the load tool already in the repo if one is added, or a timed run through the app's own entry point.
- Exchange atomicity, Concurrency and Expiry accuracy are numeric too, but they are correctness, not load:
  they are the integration rows of AC-17 (fails midway), AC-19, AC-19b and AC-12 above.
- Availability: <!-- N/A: PRD §6 sets no target; there is no production deployment -->

## CI placement

- On every PR and before every commit: integration and contract. The repeated tests of AC-19 and AC-19b run
  here too; each repetition is in memory.
- Before a release, or on a schedule: load. It is outside the suite that gates a commit, because a time
  threshold fails on a busy machine without a change in the code.
- Owners in `tasks/`: T7 the requests without a valid player secret, T8–T13 the integration rows, T13 the
  load run, T14 the contract rows.
