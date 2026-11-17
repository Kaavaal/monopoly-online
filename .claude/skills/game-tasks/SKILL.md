---
name: game-tasks
description: >
  Task breakdown for a monopoly-online feature from its game track: game-prd.md, game-sad.md, the accepted
  game-adr/, game-data-model.md, game-contracts/openapi.yaml and CONTEXT.md. Same flow as the SDLC break-tasks
  skill (gate, slicing proposal, per-task gate, epic, tracker, tasks.json, self-check), in this repo's terms:
  one feature touches one context, so missing pieces of other contexts become prerequisites, not tasks; a
  route task is a vertical slice tested through HTTP; every route task names the sentinel errors of CONTEXT.md
  it raises. Writes docs/features/<slug>/game-tasks/. Use on "/game-tasks <slug>", "game tasks for <feature>".
argument-hint: <slug>
---

# game-tasks

Cuts a designed feature into tasks of at most one day, each one reviewable change, with the order they can run
in. The reader is whoever picks the next task tomorrow morning, a person or an agent session: they open one task
file and `CONTEXT.md` and nothing else, so the task file must say where to look, not repeat what is there.

The person answering is the game owner and the only engineer. Ask about the slicing through `AskUserQuestion`
(recommended option first); never decide it for them.

## Inputs

- `<slug>`. Gate: `game-prd.md`, `game-sad.md` and at least one `game-adr/*.md` with `status: Accepted`.
  Missing → stop and point to `/game-prd <slug>` or `/game-sad <slug>`.
- `game-prd.md` §5 (every AC id), §6 targets, §10.2 refusals.
- `game-sad.md` §5 building blocks, §6 flows, §8 crosscutting, §11 risks.
- `game-data-model.md` and `game-migrations/`: the tables and the staged pairs. Missing → no migration tasks,
  say so.
- `game-contracts/openapi.yaml`: one route task per `operationId` or a split of one. Missing → stop and point
  to `/game-api-contract <slug>`.
- `CONTEXT.md`: terms for titles, the sentinel errors for `codes`. A code in §10.2 that is not in CONTEXT.md is
  a finding: ask whether to add it there first.
- `ARCHITECTURE.md` § Slice anatomy, `src/app.ts` and every `src/<ctx>/module.ts`: what exists today.

The track of the plugin skills (`PRD.md`, `sad.md`, `data-model.md`, `contracts/`, `tasks/`) is not read.

## Where a task's files go

From `ARCHITECTURE.md`. A task stays inside the feature's own context; `files_hint` uses these paths only.

| Layer | Files | Note |
|---|---|---|
| `migration` | `docs/features/<slug>/game-migrations/NNNN_<ctx>_<name>.sql` + `.down.sql`, promoted to `migrations/` | one pair per task, in number order |
| `domain` | `src/<ctx>/domain/<entity>.ts` | types, validation, repository interface, ports of other contexts |
| `infra` | `src/<ctx>/infra/sqlite/<entity>Repo.ts` | prepared statements, one per read of game-data-model § Indexes |
| `ports` | `src/<ctx>/app/service.ts`, `src/<ctx>/infra/http/routes.ts`, `test/<ctx>/<entity>.test.ts` | a vertical slice: the repo tests only through HTTP, so a use case without its route has no testable DoD |
| `wiring` | `src/<ctx>/module.ts`, `src/app.ts`, `test/helpers/app.ts` | |
| `shared` | `src/shared/*` | only when an accepted game-adr names the change |
| `docs` | `docs/features/<slug>/*` | |

Something the feature needs from another context that `src/<other>/module.ts` does not export today is a
**prerequisite** `P<n>`: its own feature in its own context (CLAUDE.md, one feature touches one context). It
goes in the epic's prerequisites table and in `needs` of every task it blocks. It is never a task here.

## Protocol

1. **Gate.** Check the inputs above, print one line of found / missing.
2. **Read upstream directly**, no index. Grep `src/*/module.ts` for each api the design calls; whatever is not
   there becomes a prerequisite.
3. **Slicing proposal.** Before writing any task file, tell the owner in a few lines what you see (operations,
   flows, AC count, tables, prerequisites) and the proposed tasks grouped in waves: a wave is every task whose
   `deps` are all in earlier waves. Then `AskUserQuestion`: Accept / Edit waves / Reject. Edit → ask what moves,
   propose again. Reject → ask why and stop.
4. **Per task.** Copy `templates/task.md` to `game-tasks/<task-slug>.md` and fill it. Size: S = 2 h,
   M = half a day, L = a day; more, or a slice over ~500 lines, is two tasks. Right after writing the file, run
   the gate for that task:

   ```bash
   pnpm exec tsx .claude/skills/game-tasks/scripts/check.ts docs/features/<slug> --task <id>
   ```

   A red gate means the file is not done: fix the section it names and run it again. The eight gates:
   1. frontmatter complete (`id title layer context deps needs acs codes files_hint estimate status`), with a
      non-empty `files_hint` and an `estimate` of S, M or L;
   2. every `deps` id exists, and the graph of all files written so far stays acyclic;
   3. at least one AC from game-prd §5 (a `docs` task may have none);
   4. every relative link in the file resolves, and the file links game-sad.md and game-contracts/openapi.yaml
      (`ports`) or game-data-model.md (`migration`, `infra`);
   5. every `codes` entry is in CONTEXT.md § Sentinel errors;
   6. at least 3 checklist steps, one commit each, no template placeholder left;
   7. a Definition of Done with no template placeholder left, ending on `pnpm check`;
   8. no copy of an upstream artifact (no fenced YAML/JSON/SQL, no Given/When/Then lines), and at most 5000
      tokens (estimated as characters / 4).
5. **Epic and tracker.** `templates/_epic.md` → `game-tasks/_epic.md` with the mermaid graph: solid arrows for
   `deps`, dotted from each `P<n>`, one subgraph per wave. `templates/tracker.md` → `game-tasks/tracker.md`; a
   task with an unmet `needs` starts `blocked`.
6. **`tasks.json`.** Same model as the markdown, written from it: the fields of the plugin's `implement-tasks`
   contract (`id title layer deps acs dod files_hint`) plus `context`, `needs`, `codes`, and a top-level
   `prerequisites` list. `layer: ports` stays the plugin's name for the slice. `dod` is the list of the task's
   DoD lines, not the plugin's one sentence, so the JSON says exactly what the markdown says.
7. **Self-check.** The same script without `--task` checks every task, the solid mermaid edges against `deps`
   and the dotted ones against `needs` (the structural check of the graph; no `mmdc` here), at least one wave
   with two tasks, every AC of game-prd §5 in some `acs` and every CONTEXT.md code in some `codes`. It must
   exit 0; paste its output into the hand-off.
8. **Commit and hand off.** Propose `docs(<slug>): game task breakdown`. Hand off: the number of tasks and
   waves, the prerequisites and what they block, the first wave that can start now, and anything the owner
   should decide before the first task (open questions of game-prd §11 that a task depends on). Next step: the
   first task of wave 1 in a fresh session, which reads that task file and CONTEXT.md.

Left out on purpose against the plugin skill: no `owner` field (one owner, the game owner), no tracker export
(`tracker.md` is the tracker), no hand-off to `plan-tests` or `implement-tasks` (they read the plugin's
`tasks/`, not `game-tasks/`).

## Never

- a task that edits another context's folder, or "build the feature" as one task;
- a pasted AC, schema or SQL in a task: link the heading instead, so the task reads the current version;
- a DoD a reviewer cannot check ("works", "clean code"); each line names a test, a command or a file;
- `tasks.json` edited by hand apart from the markdown.

## Done

- `game-tasks/_epic.md`, `tracker.md`, `tasks.json` and one file per task, every task through the eight gates.
- The self-check exits 0: no cycle, every AC and every sentinel code covered, markdown and JSON agree.
- Every prerequisite is named with its context and the tasks it blocks.
