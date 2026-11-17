---
name: game-prd
description: >
  PRD for a monopoly-online feature, written with the game owner. Same flow as the SDLC write-prd skill
  (read inputs, settle open questions, draft, walk each section, clean-context critic, write), tuned to this
  backend: offer and turn lifecycles as a state machine, who may do what per glossary role, refusals mapped to
  the three error kinds in src/shared/errors.ts, and NFR defaults measured on this stack. Writes
  docs/features/<slug>/game-prd.md. Use on "/game-prd <slug>", "game PRD for <feature>".
argument-hint: <slug> [--reference src/<ctx>]
---

# game-prd

Turns a confirmed brief into `docs/features/<slug>/game-prd.md`. The reader is whoever runs architecture and
API design next, so the PRD says what players can do and what the server refuses, and hands over a refusal
table they can turn into error codes without asking again.

The person answering is the game owner. Rules of the table are theirs to decide; never answer a question for
them.

## Before you start

1. Read `CLAUDE.md`, `ARCHITECTURE.md` (context map, slice anatomy) and `src/shared/errors.ts`.
2. Required, stop with a message if missing:
   - `docs/features/<slug>/CONTEXT.md`, the glossary. Its roles are the only roles the PRD may use.
   - a brief with `status: Confirmed` in its frontmatter: `game-brief.md` first, else `idea-brief.md`.
     A brief in any other status is not an input. Say which one you took.
3. Reference context: the `--reference src/<ctx>` argument, or the shipped context the brief calls nearest.
   Read its `domain/` and `app/service.ts` and note which checks throw `notFound`, `conflict`, `invalid`.
   No other channels: no wiki, no ticket tracker, no repo-wide scan.
4. If `docs/features/<slug>/game-prd.md` exists, update it instead of starting over.

## Asking

Every question goes through `AskUserQuestion`, up to 4 per call, in the language the person writes in. Each
option says what lands in the PRD and what it costs later. No depth dial and no size question: a game feature
is small, and `.size` is read if present, never asked.

## Flow

### 1. Settle the brief's open questions

Collect the brief's open questions due at this stage ("write-prd", "PRD") and its edge cases that have no
answer yet. Ask them first, in batches. A table rule left open here becomes a guess in an AC.

### 2. Glossary on the spot

Any word the PRD needs that the glossary lacks (a state name, a role) gets a line in `CONTEXT.md` now, through
`/sdlc:fix-term <word> for <slug>` if the plugin is loaded, else by asking the definition and its NOT
directly. State names in §9 must be glossary terms.

### 3. Draft

Fill `templates/PRD-template.md` in memory. §1–§8 are the usual eight sections, with fair play in place of
the generic security block. §9 states and §10 refusals are added after them so §1–§7 keep write-prd's
numbers, and open questions close the document as §11.

Sources: §1–§3 and §7 from the brief, roles from the glossary, §9 states from the glossary, refusal kinds
from the reference context. Every brief edge case either becomes an AC or a Non-goal with its reason.

### 4. Walk the sections

Order: §4 stories, §5 AC, §9 states, §10 rules and refusals, §6 NFR, §7 KPI. For each section, show the
whole section first, then one question per item with these options:

- **Approve**: kept as is.
- **Edit**: the owner gives the new wording; redraft and ask once more, the second answer is final. When an
  edit narrows a story or an AC, write what was cut as a line in §3 Non-goals with the owner's reason, and say
  so in the next question.
- **Add edge case** (AC only): the owner names a situation; draft it as its own AC with a `b` suffix on the
  same story and ask once.
- **Open question**: the item moves to §11 with owner and due; no owner or due means Drop.
- **Drop**: removed. Dropping a whole story is fine; dropping the last AC of a kept story is not, draft a
  replacement.

Keep an edits log (item, action, before, after, reason). The critic reads it.

### 5. Gates

Check after the walk; fix by drafting and asking again:

- every story has an AC; every AC names its story
- each of the six AC types is present: happy, error, authorization, invariant, cross-context, timing.
  Timing is any rule where the clock or two players acting at once decides the outcome; if the feature has
  neither, write `<!-- N/A: reason -->` instead
- every §9 transition and every final state is reached by at least one AC
- every refusing AC (all types but happy) has a row in §10.2
- §10.1 has a cell for every glossary role and every action in §4
- the NFR table has the money and ownership rows whenever `bank` or `board` data changes hands

### 6. Critic

One sub-agent with a clean context: `sdlc:critic` if the plugin is loaded, else `general-purpose`. Prompt from
`references/critic.md` with the draft and the edits log pasted in; it reads the glossary and the brief
itself. Ask the owner about each finding: take the fix, give other wording, or keep the draft with a reason.
A kept draft adds a line under §1 "Decisions kept against the critic".

### 7. Write and check

Write `docs/features/<slug>/game-prd.md` with `status: Draft`. The owner sets `Approved` by hand after
reading it; never set it yourself. Then:

- §5 has no implementation tokens. Over §5 only:
  `grep -nE '\b(GET|POST|PUT|PATCH|DELETE)\b|(^|\s)/[a-z]|([Ss]tatus|HTTP|[Cc]ode)[^.]{0,12}\b[1-5][0-9]{2}\b|[a-z_]+\.[a-z_]+|\{'`.
  A status number counts only next to "status", "HTTP" or "code", so money amounts like 500 stay as the
  owner said them. Error codes and kinds live in §10.2, nowhere else.
- no storage, framework or library names in §1–§8 (`grep -iE 'sqlite|fastify|vitest'`)
- §11 rows all carry owner and due

Suggest the commit `02: PRD for <slug> via game-prd` and the next step `/sdlc:clarify-prd <slug>`, noting that
it reads `PRD.md`.

## Conventions this skill hands over

**Refusal kinds** are the three in `src/shared/errors.ts` and nothing else:

| Kind | Status | Use when |
|---|---|---|
| `invalid` | 400 | the request makes no sense on its own: bad amount, a deed named twice, unknown player |
| `not_found` | 404 | the thing is gone, or the actor may not know it exists (hide-existence) |
| `conflict` | 409 | the request was fine but the state moved on: deed changed owner, offer already answered, lifetime ran out |

**Error codes** are `<ctx>.<error_name>`, snake_case, `<ctx>` the context that owns the rule (`trades`,
`board`, `bank`, `lobby`, `turns`): `trades.offer_expired`, `bank.insufficient_funds`. Today's routes send
the bare kind as `code`; the dotted name is what new routes send, and §10.2 is where it is decided.

**Deny or hide.** An actor who is part of the thing (proposer, recipient) gets a refusal that says why. An
actor who is not gets `not_found`, as if the thing did not exist.

**NFR defaults** for this stack, used unless the owner sets others. Measured on 2026-11-17 on the board routes
through `makeTestApp()` (in process, in-memory db, 300 calls): p95 0.10 ms create, 0.22 ms change owner,
0.91 ms list of 300. The targets leave room for a slower machine and more rules, nothing more.

| Aspect | Default target | Measurement |
|---|---|---|
| p95 of one write action | ≤ 5 ms | timed `app.inject` calls in the feature's test file, 300 calls |
| p95 of one list action, 300 rows | ≤ 10 ms | same |
| money in a room | unchanged by any exchange | sum of balances before and after, asserted in every exchange test |
| title deed owners | exactly one per deed after every action | asserted in every exchange test |
| two players acting on the same thing at once | exactly one wins, 100 of 100 runs | repeated test |
| availability | N/A until there is a deployment | |
