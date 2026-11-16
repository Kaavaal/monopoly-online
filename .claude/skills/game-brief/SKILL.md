---
name: game-brief
description: >
  Idea brief for a monopoly-online feature, run as an interview with the game owner. Same flow as the
  SDLC interview skill (questions, competitors, three approaches, three reviewers, devil's advocate, RICE,
  feasibility, recommendation), tuned to a small online board game: table rules, game balance, the four
  bounded contexts and the effort we actually measured on past features. Writes
  docs/features/<slug>/game-brief.md. Use on "/game-brief <slug>", "brief for <feature> in the game",
  "game idea brief".
argument-hint: <slug>
---

# game-brief

Turns a game feature idea into `docs/features/<slug>/game-brief.md`. The reader is the person who will write the
PRD next, so the brief speaks about players, rooms, deeds and money, never about tables or endpoints.

The person answering is the game owner: one developer, a few friends who playtest. There are no sales, no
churn dashboards, no market share. Questions and scores are built for that.

## Before you start

1. Read `CLAUDE.md`, `ARCHITECTURE.md` (context map, slice anatomy), `LOG.md` and `CAPSTONE_LOG.md` (measured
   feature times).
2. Read `docs/features/<slug>/CONTEXT.md` if it exists and keep its glossary. A new domain word in an answer
   gets fixed on the spot with `/sdlc:fix-term <word> for <slug>` before you go on, or listed in §15 if the
   plugin is not loaded.
3. If `docs/features/<slug>/game-brief.md` exists, update it instead of starting over.
4. Copy nothing yet. All writing happens in step 10.

## Asking

No depth checkpoint: a game feature is small enough for one route through the flow.


Every question goes through `AskUserQuestion`, 2-3 per call. Ask in the language the person writes in.
Each option says in plain words what will land in the brief and what it costs later. Never answer a question
yourself: the brief is worth nothing if the owner's answers are invented.

## Flow

### 1. Idea

One question: "the idea in 1-3 sentences, your words". Keep it verbatim for §1.

### 2. Table questions

Ask these six in two batches; skip one only when the answers so far already cover it. They replace the
generic product questions because a board game feature fails in its own ways.

- **At the table.** What do people do at a real table today? Is it an official rule, a house rule, or
  something only an app can do?
- **Who waits.** While this happens, who is blocked and for how long? Does it fit inside a turn or run beside
  turns?
- **Balance.** Can two players use it to gang up on a third? Can a losing player use it to drag the game on?
- **Game length.** Should games get shorter, longer, or stay the same? This is usually the success metric.
- **Ownership.** Which contexts own the things it touches (players and rooms in `lobby`, deeds in `board`,
  money in `bank`, rolls and moves in `turns`)? Which of them do not exist yet?
- **Limits.** What is explicitly out for the first version?

### 3. Other games

Search for 3-5 online board games or Monopoly-like apps with the same mechanic. One row each: name, link, how
they do it, what is missing. Write the search query and date under the table. If nothing real turns up, say
so; never fill the table from memory.

### 4. Three approaches

Three sub-agents in one message, each given the idea, the answers and the glossary:

- **A. Table-faithful.** Exactly what players do at a real table, nothing more. Smallest scope.
- **B. Digital-only.** Uses what a real table cannot do: timers, history, server checks, notifications.
- **C. Middle.** A's rule with the one or two digital parts that remove the most arguments.

Each returns: name, one-sentence thesis in player language, who gains most, one metric with baseline and
target, the main trade-off, effort S/M/L.

### 5. Three reviewers

Three sub-agents in one message, each sees all three approaches:

- **Engineer.** Which contexts each approach touches and how many new slices that is (a slice as in "Slice anatomy" in
  ARCHITECTURE.md). Name cross-context calls that do not exist yet.
  No libraries or storage names.
- **Game designer.** Balance, exploits, kingmaking, effect on game length.
- **Player.** What it feels like on a phone, how much waiting, what is confusing the first time.

Build a 3×3 matrix (+ / 0 / -) with a short reason in each cell.

### 6. Edge cases

From the answers and reviews, list 5-8 situations the feature must handle. For each, say what the player sees
and which kind of refusal it is in this codebase: **not found** (the thing is gone), **conflict** (the
state moved on, e.g. a deed changed owner), **invalid** (the request makes no sense). These are the three
errors in `src/shared/errors.ts`, so the PRD can take them over as they are.

### 7. Devil's advocate

One sub-agent with a clean context: only the idea, the chosen limits and the three approaches, none of the
discussion. Prompt: "find 5-8 ways this breaks a real game night: abuse, stuck games, unfair outcomes, things
that only show up with 4+ players". The worst one goes to §10, the rest to §9.

### 8. Score

Propose, then ask the owner to confirm or adjust each number in one `AskUserQuestion`:

- **Reach**: players per month in playtests who would touch it, from §3.
- **Impact**: 0.5 / 1 / 2 / 3, from the game-length answer and the game designer's review.
- **Confidence**: 0.5 to 1.0, lower for every open question in §15.
- **Effort**: in days, not person-weeks. Count the slices from the engineer's review and price each one from
  `LOG.md` and `CAPSTONE_LOG.md` (a single-entity CRUD slice took minutes with an agent; cross-context work
  and rules logic take longer, so say how you scaled it).

Then feasibility, also confirmed by the owner: **contexts ready** (do the contexts it needs have code, see
`src/<ctx>/`), **rules clear** (is the table rule settled or still argued), **time** (fits the owner's next
two weekends or not).

### 9. Recommendation

Pick one approach. The reason must cite the score (§11), feasibility (§12), one matrix cell (§8) and one gap
from §6. Ask the owner to accept it, pick another, or leave it open.

### 10. Write

Copy `templates/game-brief.md` to `docs/features/<slug>/game-brief.md` and fill every section. Parked
approaches go to §14 with the trigger that would bring them back.

### 11. Self-check

- all sections filled, `<!-- TBD -->` only where the owner said "don't know"
- no storage, library or endpoint names in the body (grep -iE `sqlite|fastify|\bSQL\b|\b(GET|POST|PATCH|DELETE) /`)
- under 2000 words
- §13 cites §6, §8, §11, §12
- every `AskUserQuestion` above was really asked

Fix and re-check until it passes.

### 12. Hand off

Suggest the commit `01: idea for <slug> via game-brief` and the next step `/sdlc:write-prd <slug>`. Note that
write-prd looks for `idea-brief.md`; point it at `game-brief.md` or copy it there if this brief is the one you
keep.
