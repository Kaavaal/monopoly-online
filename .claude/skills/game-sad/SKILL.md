---
name: game-sad
description: >
  Architecture document for a monopoly-online feature: Arc42 in 12 sections with C4 context and container
  views, plus ADRs for the decisions that are painful to reverse. Same flow as the SDLC architecture-design
  skill (read inputs, bootstrap, draft, walk each section, gate decisions into ADRs, commit per section,
  clean-context critic), tuned to this backend: contexts and the context map instead of generic modules, a
  fourth ADR criterion for the database, §6 flows drawn from the PRD state table with refusal codes on every
  branch. Writes docs/features/<slug>/game-sad.md and docs/features/<slug>/game-adr/. Use on
  "/game-sad <slug>", "game SAD for <feature>".
argument-hint: <slug>
---

# game-sad

Turns an approved PRD into `docs/features/<slug>/game-sad.md` and the ADRs under
`docs/features/<slug>/game-adr/`. The reader is whoever writes the contract, the data model and the tasks
next: they should find which context owns what, which api calls cross a boundary, what one request does
inside the process, and why each hard choice went the way it did.

The person answering is the game owner and the only engineer. Ask them about every real decision; never
answer a question for them.

## Before you start

1. Read `CLAUDE.md`, `ARCHITECTURE.md`, `package.json`, `.nvmrc`, `src/app.ts`, `src/shared/errors.ts`,
   `src/shared/db.ts` and the file names in `migrations/`. `ARCHITECTURE.md` is the map of this repo: no
   explorer sub-agent and no `docs/architecture-map.md`. Read the code of a context only when a decision
   depends on it.
2. Required, stop with a message if missing:
   - `docs/features/<slug>/CONTEXT.md`, the glossary. Its roles are the only actors on the diagrams.
   - a PRD with `status: Approved`: `game-prd.md` or `PRD.md`. If both are approved, ask the owner which one
     is the source, since the plugin's later stages read `PRD.md`. The PRD's §9 states and §10.2 refusals
     feed §6 and §8; a PRD without them gets states and refusals from its AC, with the kinds of
     `src/shared/errors.ts` and no invented codes.
3. Read `docs/features/<slug>/.size` if present (S when absent); never ask for the size.
4. If `game-sad.md` exists, continue from the first section that still holds template text.

## Asking

Every question goes through `AskUserQuestion`, in the language the person writes in, up to 4 per call. Each
option says what lands in the document and what it costs later, recommended option first. No depth dial:
every real decision is asked, and convention defaults from `CLAUDE.md` are bundled into one question per
section. No surface question: the surface is `backend-service`, unless the PRD names a client, then ask.

## Flow

### 1. Bootstrap

Copy `templates/sad-template.md` to `docs/features/<slug>/game-sad.md`, fill the frontmatter, commit
`docs(<slug>): bootstrap game-sad from <PRD file>`.

### 2. Draft

Draft §1–§12 in memory with the decisions each section holds. Sources per section are in the template
comments. Take versions from `package.json` and `.nvmrc` exactly as written there. Do not write the file yet.

### 3. Walk the sections

For each section in order: show the whole section, then one question per decision with these options:

- **Approve**: kept as is.
- **Edit**: the owner gives new wording; redraft and ask once more, the second answer is final.
- **Open question**: the decision goes to §11 with owner and due; no owner or due means Drop.
- **Drop**: removed, with a line in the edits log.

Run the gate below on every approved decision. Then write the section and its ADRs and commit them together:
`docs(<slug>): game-sad §N <a few words>`, one short line. Do not go back to a written section; the critic catches
drift.

For §3 and §5 write the Mermaid block first, check it (`references/c4-mermaid-syntax.md`), then describe it
in words and ask about the words, never about raw Mermaid source.

A section with nothing real to say gets `<!-- N/A: <reason> -->` and one line of text. Ask about an N/A like
any other decision: it is the owner's choice, not a skip.

Keep an edits log (decision, action, before, after, reason) and an ADR log (number, title, section, gate
score). The critic reads both.

### 4. The ADR gate

Score each approved decision on four questions:

1. **Rework**: changing it in three months takes 3 days or more.
2. **Contexts**: it changes what two or more contexts see: an `<Ctx>Api`, the context map, the creation
   order in `src/app.ts`, or a file in `src/shared/`.
3. **Alternative**: a real second option exists that `CLAUDE.md` and `ARCHITECTURE.md` do not already rule
   out.
4. **Database**: it adds a migration, or a table or column another context reads. Migrations here are
   frozen, so undoing one is a new migration, never an edit.

Two or more → ADR. One → inline, unless it is the database criterion; then ask whether to lock it as an ADR.
Zero → inline. Two overrides: a change to `ARCHITECTURE.md` (new context, new arrow on the map, a change to
the dependency rule) is always an ADR; anything `CLAUDE.md` already fixes is never one, it becomes a row in §8.
Expect 2–4 ADRs for S and 4–8 for M; well outside that range, say so in the handoff.

ADR files: `game-adr/NNNN-<ctx>-<decision>.md`, where `<ctx>` is the context that owns the decision
(`shared` for `src/shared/`), the same way migrations are named `NNNN_<ctx>_<name>.sql`. The title states the
decision, not the topic: `0002-shared-run-exchange-in-one-transaction.md`, not `0002-atomicity.md`. Fill
`templates/adr-template.md`; the gate score goes in the ADR itself, and Status is `Accepted` because the owner
decided it in this walk.

### 5. Checks

After §12, fix by drafting and asking again:

- every section is filled or carries `<!-- N/A: reason -->`
- §3 has a `C4Context` block, §5 a `C4Container` block, §6 at least one `sequenceDiagram`, all checked
- every §6 participant is a container from §5; no HTTP verbs, paths or status numbers in §6 messages
- every `alt` branch in §6 that refuses names a code from the PRD's §10.2 (its kind, when the PRD has no
  §10.2), and every code there appears on a branch or in §8
- the context map delta in §5 keeps the graph acyclic in the creation order of `src/app.ts`
- §9 lists every file in `game-adr/` and nothing else; every ADR links PRD, SAD section, neighbour ADR and
  migration (or says none)
- §10 numbers match PRD §6 character for character
- §11 rows that are open questions carry owner and due

### 6. Critic

One sub-agent with a clean context: `sdlc:critic` if the plugin is loaded, else `general-purpose`. Prompt
from `references/critic.md` with the document, the edits log and the ADR log pasted in. Ask the owner about
each finding: take the fix, give other wording, or keep the text with a reason. A kept text adds a line under
§1 "Decisions kept against the critic". Commit the fixes as `docs(<slug>): game-sad critic fixes`.

### 7. Handoff

Say what was decided, which ADRs exist, what was not done and why. Suggest the commit
`03: SAD + ADR for <slug> via game-sad` if the owner wants one marker commit, and the next step
`/sdlc:complete-sequence-diagrams <slug>`, noting that it reads `sad.md`, not `game-sad.md`.

## Containers this repo already has

Use these names in §5 and §6 so every feature draws the same picture:

| Container | Technology | Notes |
|---|---|---|
| `monopoly-online backend` (boundary) | Node.js process, Fastify | one process started by `src/index.ts`; `src/app.ts` is the composition root |
| `lobby context` | TypeScript | players, rooms |
| `board context` | TypeScript | tiles, title deeds and their owners |
| `bank context` | TypeScript | player accounts, transfers |
| `turns context` | TypeScript | dice rolls, moves |
| `SQLite file` | `node:sqlite`, synchronous | outside the boundary; each context owns its tables |

A new context is one more container inside the boundary. Draw only the contexts the feature calls. No
external systems exist yet; a feature that adds one needs an ADR.
