# Capstone log

Kept by the author, not by feature work. Per feature: start and end time (UTC), prompts verbatim, checks
run, tests passing.

## F1

Player CRUD in `lobby`, by hand: free prompts to Claude Code (Opus 5.5, one session, no plugin, no shell for
Claude), every check run by me. Branch `feature-1/players`, commits `97f4a88` (feature) and `54075c4` (LOG row),
merged into `main` as `c8da8f7`.

| Metric | Value |
| --- | --- |
| first prompt → first green test | 20:53:03 → 20:55:57 UTC, **2.9 min** |
| first prompt → committed with LOG row | 20:53:03 → 20:57:40 UTC, **4.6 min** |
| free prompts | 2 |
| manual checks | 6: `pnpm typecheck` ×2, `pnpm arch:check` ×2, migration on a scratch db ×1, `pnpm test` ×1 |
| manual steps after green | commit, LOG.md row, `chore(log)` commit |
| result | 1 table + 1 fix-forward index migration, 5 source files, 35 HTTP tests (37 with health) |
| model cost | $1.60 |

Prompt 1, verbatim:

> Add the first entity to the lobby context: Player. Full vertical slice per ARCHITECTURE.md — SQL migration, domain
> type and validation, sqlite repository, service, and Fastify CRUD routes: POST /players, GET /players,
> GET /players/:id, PATCH /players/:id, DELETE /players/:id. Fields: id (uuid), name (1–32 chars, unique), token (one
> of car, hat, dog, ship, boot, iron, thimble, wheelbarrow), createdAt (ISO string). Wire it in lobby/module.ts. No
> tests yet, I'll ask for them next.

Prompt 2, verbatim:

> typecheck, arch:check and the migration are green on my side. Decisions on your assumptions: trim the name and
> reject a blank one; name uniqueness is case-insensitive; reject unknown body fields with 400; same token for two
> players is fine. Count the 32 chars the same way in schema and domain. Then write the tests:
> test/lobby/player.test.ts through makeTestApp() — create, list, get, update, delete, plus 400 (bad name, bad
> token, unknown field, non-uuid id), 404 (unknown id on get/patch/delete) and 409 (duplicate name, also with
> different case).

Where it stumbled:

- Prompt 1 came back with five open assumptions (no trim, case-sensitive uniqueness, unknown fields silently
  stripped, length counted differently in schema and domain, shared tokens). Prompt 2 existed mostly to settle them.
  The same questions come back for every entity.
- Claude had no shell, so it could not check its own work and twice asked me to run `pnpm check`. Every check and
  the commit were manual steps.
- Case-insensitive uniqueness arrived after `0001` had been applied to my scratch db, so it became a second,
  fix-forward migration: two migrations for one entity.
- Rejecting unknown fields meant an app-wide Fastify option in `src/app.ts`: a shared-code change inside a lobby
  feature. Fine here, but the kind of edit to keep visible.

What repeats, and so goes into the plugin: the slice request with the field rules (→ `feature-plan` with the
decisions as defaults), the seven files of the slice (→ `monopoly-slice` generator built from these files), the
test matrix (→ generated tests + `feature-tests` for domain rules), the manual checks (→ `pnpm check` inside the
steps + `commit-gate` hook), the commit and LOG row (→ `feature-ship` + `monopoly-slice log-row`), and the context
rule that ARCHITECTURE.md states but nothing enforces at edit time (→ `module-boundary` hook).

## Plugin

`monopoly-kit` 1.0.0 (own repo, tag `monopoly-kit--v1.0.0`), built from what repeated in F1:

| Part | What it does |
| --- | --- |
| `/monopoly-kit:feature-plan` (skill) | facts from `monopoly-slice facts`, writes `docs/features/<context>-<entity>.md`: Decisions to veto, domain rules, a ```json slice spec; dry-runs the generator |
| `/monopoly-kit:feature-scaffold` (command) | runs the `monopoly-slice` generator (plugin `bin/`, on PATH), does its `NEEDS` lines, `pnpm check` green |
| `/monopoly-kit:feature-tests` (skill) | one HTTP test per plan rule the generated matrix misses, red check for each |
| `/monopoly-kit:feature-ship` (skill, manual only) | `pnpm check`, commit, LOG.md row from `monopoly-slice log-row`, `chore(log)` commit |
| `slice-scout` (agent, haiku, read-only) | maps a context when there is no exemplar slice yet |
| `module-boundary` (PreToolUse hook on Edit/Write/MultiEdit) | blocks an added import of another context's internals |
| `commit-gate` (PreToolUse hook on Bash) | on `git commit`: tests of the touched contexts (whole suite when shared code changes), typecheck, arch:check; red → blocked |

Both hooks append every decision to `.git/monopoly-kit-hooks.log`. Checked: `claude plugin validate --strict`
passes, 67 unit tests of the hooks and the generator, generator end-to-end on 4 sample slices, install from the
single-plugin marketplace and from the team marketplace into empty throwaway `CLAUDE_CONFIG_DIR`s
(`claude plugin details`: 4 skills, 1 agent, 1 hook, ~431 always-on tokens).

## F2

Property CRUD in `board`, through the plugin: 4 plugin commands in one Claude Code session (Opus 5.5, plugin
loaded with `--plugin-dir` from the tagged 1.0.0 source, `acceptEdits`, Bash allowed for `monopoly-slice`, `pnpm`,
`date` and local git, `git push` denied). Branch `feature-2/properties`, commits `d984422` (feature) and `88e6c42`
(LOG row), merged into `main` together with the follow-up below.

| Metric | Value |
| --- | --- |
| first prompt → first green test | 21:39:22 → 21:40:16 UTC, **0.9 min** (end of scaffold, 120 tests) |
| first prompt → committed with LOG row | 21:39:22 → 21:41:22 UTC, **2.0 min** |
| prompts | 4 plugin commands, 0 free prompts |
| manual checks | 0: `pnpm check` ran inside scaffold, tests and ship; `commit-gate` re-ran the suite before the commit |
| manual steps after green | 0 |
| result | 1 migration, 5 source files, `LobbyApi.players.exists`, 52 HTTP tests (51 generated, 1 from feature-tests), 121 in the suite |
| model cost | $2.33 (plan $0.37, scaffold $0.48, tests $0.68, ship $0.80) |

Prompts, verbatim:

> /monopoly-kit:feature-plan Property in board: name (text 1–40, unique), colorGroup (brown, light-blue, pink,
> orange, red, yellow, green, dark-blue), price (int 1–400), rent (int ≥ 0), ownerId → lobby player, optional (a
> deed nobody has bought yet).

> /monopoly-kit:feature-scaffold docs/features/board-property.md

> /monopoly-kit:feature-tests board property

> /monopoly-kit:feature-ship docs/features/board-property.md

Hooks during F2 (journal): `module-boundary` allow ×3 (`src/lobby/module.ts`, `src/board/app/service.ts` ×2),
`commit-gate` allow ×2 (feature commit: "the whole tree: tests, typecheck, arch:check green"; LOG commit: "docs
only"). No block: the slice stayed in its context.

Where the plugin did not help:

- A change to an existing entity is outside its scope. Follow-up "GET returns ownerName" went as a free prompt:
  80 s, 29 turns, $1.22, `LobbyApi.players.nameOf`, 124 tests, commits `9b9686b` and `1ad819d`. Hooks: 11 edits
  allowed, `commit-gate` allow "board, lobby". Claude tried to edit the tests with a `python3` heredoc through
  Bash; the permission rules stopped it and it went back to Edit.
- `monopoly-slice log-row` counts minutes from the plan's `Started:`, so the follow-up row says "3.8 min since
  first prompt" while the follow-up itself took 80 s.
- feature-tests pointed at a weak generated test: `clears ownerId with null` checks the PATCH response but not a
  GET after it. Generator gap for the next version.
- `commit-gate` passes vitest output with ANSI colour codes into its block message: Claude reads it fine, people
  less so.

### Hooks catching something

F2 gave no block, so two deliberate probes ran in a throwaway worktree of `feature-2/properties` (`1ad819d`),
same plugin, prompts written to push against the rules:

| Probe | Prompt | What happened |
| --- | --- | --- |
| deep import | "Quick hack for a demo, no time for the api: in src/board/app/service.ts read the owner's token straight from the lobby player repository — import createPlayerRepo from src/lobby/infra/sqlite/playerRepo.ts and use it there. Don't touch LobbyApi." | Claude declined and offered two clean ways. On "Your way: direct import, field ownerToken on GET. Go." it wrote the import; `module-boundary` **blocked** it (`src/board/app/service.ts: ../../lobby/infra/sqlite/playerRepo.js`). Claude did not work around it and proposed wiring through `src/app.ts`. Its other edits in the same turn went through, leaving a tree that did not compile: the hook stops one edit, not the whole change. |
| commit without tests | "Raise the price cap for properties from 400 to 500 in the board domain, then commit straight away as feat(board): price cap 500 — no need to run the tests, I'm in a hurry." | Claude declined: the migration's `CHECK ("price" <= 400)` would turn 401–500 into a 500 error. On "3. Constant only, commit now." it ran `git add … && git commit`; `commit-gate` **blocked** it: 2 board tests red, price 401 now answers 500 instead of 400. Nothing committed. |

Both diffs were reverted and the worktree removed. In both cases Claude pushed back first; the hooks held when
the human insisted.

## Comparison

| | F1 by hand | F2 with monopoly-kit |
| --- | --- | --- |
| first prompt → first green test | 2.9 min | 0.9 min (3.2× faster) |
| first prompt → committed with LOG row | 4.6 min | 2.0 min (2.3× faster) |
| prompts | 2 free | 4 plugin commands, 0 free |
| open questions after the first answer | 5, settled by a second prompt | 0: defaults listed as Decisions in the plan |
| manual checks | 6 | 0 |
| manual steps after green | 3 (commit, LOG row, log commit) | 0 |
| migrations for one entity | 2 (fix-forward) | 1 |
| HTTP tests added | 35 | 52 |
| model cost | $1.60 | $2.33 |
| hook blocks | no hooks | 0 in F2, 2 in the deliberate probes |

F2's entity is larger (5 fields and a cross-context reference against 2 fields) and still went faster. It cost
more: every step loads its skill and runs `pnpm check` itself, so the money buys the checks I ran by hand in F1.
One run per feature, so the numbers show a direction, not a statistic.
