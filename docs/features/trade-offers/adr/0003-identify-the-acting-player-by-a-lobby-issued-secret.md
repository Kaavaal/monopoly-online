---
status: Accepted
owner: "Kaavaal"
reviewers: []
updated_at: "2026-11-17"
feature_size: S
stage: "04-05"
ticket: ""
---

# 0003 — Identify the acting player by a player secret that `lobby` issues

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Kaavaal, with Claude during the architecture-design walk

## Context

The backend has no notion of who sends a request: anyone can change any player and any title deed. Trade
offers are the first feature whose rules depend on it. PRD §6.1 lists three permission checks (an offer only in
one's own name, only the recipient answers, only the proposer and the recipient learn anything about an offer)
and asks for a light security review of how the product learns which player is acting, at architecture-design.
PRD §8 holds the same question open with the due date "before architecture-design". Players belong to `lobby`,
so the mechanism is built there as a separate prerequisite feature; this record fixes what `trades` relies on,
because it shapes every `trades` request. Leaving the mechanism open was not an option: both PRD sections
require it to be settled at this stage.

## Decision drivers

- PRD §6.1 abuse case "acting as another player": denied.
- PRD AC-06b, AC-08, AC-14: the three permission checks must be testable.
- SAD §3: no external systems in this version, so no third-party identity provider.
- CLAUDE.md: one feature touches one context; `lobby` owns players.

## Considered options

1. **A player secret issued by `lobby`** — a random secret given once when a player is created, stored as a
   hash, sent by the client as a bearer credential; `trades` asks `lobby` whose it is.
2. **An `X-Player-Id` header without a secret** — the client names the player; the backend only checks that
   such a player exists.

## Decision outcome

**Chosen:** option 1. It is the smallest mechanism that actually denies acting as another player. Player ids
are listed openly, so option 2 guards against mistakes and not against intent, and leaves the PRD §6.1 abuse
case unmet.

What `trades` relies on:

- `lobby` creates a random secret of at least 128 bits when a player is created, returns it once in that
  response, and stores only its SHA-256 hash. A fast hash is enough because the secret is random, not chosen
  by a person.
- The client sends `Authorization: Bearer <secret>` with every `trades` request.
- `LobbyApi` gains a lookup from a secret to a player id. A `trades` route resolves the acting player before it
  calls the service; the service takes the acting player id as an argument and never treats a player named in
  the request body as a claim of identity. A body that names a proposer other than the acting player is refused
  (AC-06b, SAD §8).
- A request with no secret or an unknown one is refused with HTTP 401 and a fourth error kind, `unauthorized`,
  added to `src/shared/errors.ts` by the `lobby` feature.
- The name is **player secret**. `token` is already a field of a player: the piece on the board (car, hat).

Light security review, the rest of the list:

- Snooping: a player who is neither side of an offer gets `not_found`, the same answer as for an offer that
  never existed (AC-14). Offer ids are random UUIDs, so they cannot be guessed or walked.
- Cross-room trade: refused from room membership read through `LobbyApi`, at proposal and again at acceptance.
- Guessing a secret: not rate-limited. With 128 random bits this is accepted for this version.
- Transport: the repo terminates no TLS. Over plain HTTP the secret is readable on the network; accepted for
  trial tables on one local network and listed in SAD §11.

## Consequences

**Positive**
- The three permission checks of PRD §6.1 are enforceable and testable through HTTP.
- No external system and no new dependency: `node:crypto` covers the random bytes and the hash.
- Other contexts can use the same lookup when their rules start to depend on the acting player.

**Negative**
- A prerequisite feature in `lobby` with a migration of `players`; trade offers cannot be tested for
  permissions before it ships.
- A lost secret cannot be recovered: there is no rotation, no revocation and no expiry in this version.
- Players created before the feature have no secret. Today these are test and development rows only.
- Every `trades` test has to create players and carry their secrets.

**Neutral**
- `shared/errors.ts` grows from three kinds to four; CLAUDE.md and ARCHITECTURE.md name the three and are
  updated by the `lobby` feature.
- The existing `lobby` and `board` routes stay open to anyone until their own features say otherwise.

## Links

- PRD: [PRD.md](../PRD.md) §5 (AC-06b, AC-08, AC-14), §6.1, §8
- SAD: [sad.md](../sad.md) §3, §4, §8, §11
- Related ADR: [0001](./0001-own-trade-offers-in-a-new-trades-context.md)
