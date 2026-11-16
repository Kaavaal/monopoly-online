---
name: monopoly-sdlc-audit
description: Read-only audit of one feature's SDLC artifacts in monopoly-online. Scans docs/features/<slug>/, says which of the 9 module-6 artifacts are present, missing or stale against the feature's code, and gives 3-5 recommendations. Use for "/monopoly-sdlc-audit <slug>", "audit the docs of <feature>", "what artifacts does <feature> lack".
argument-hint: <slug> [context,...]
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(git ls-files:*), Bash(git ls-tree:*), Bash(git worktree list:*), Bash(ls:*), Bash(test:*)
---

# monopoly-sdlc-audit

Inspects, never writes. The output is a status table and a short list of what to fix first.

## Input

- `<slug>`: feature folder name under `docs/features/` (`trade-offers`, `players`).
- `[context,...]`: one or more of `lobby`, `board`, `bank`, `turns`, or a new one. If not given, take them
  from `sad.md` §5 or `tasks/tasks.json` (`files_hint`), else from the scopes of the feature's commits.
  Still unknown: ask once.

### Where to read the folder

1. The working tree, if `docs/features/<slug>/` is there.
2. Else another worktree: `git worktree list`, then look for the folder under each path. Read files there
   directly, so uncommitted drafts count too; `git -C <path> status --short` marks them.
3. Else a branch: `git log --all -1 --format='%h %D' -- docs/features/<slug>`, then
   `git ls-tree -r --name-only <ref> docs/features/<slug>` and `git show <ref>:<path>`.

Say in the header which worktree or ref you read. When the folder is on another branch, the code checks
below run against that ref too.

## The 9 artifacts

| # | Artifact | Expected path | Checked against (code) | Filled by |
|---|---|---|---|---|
| 1 | idea-brief | `idea-brief.md` | none; check `status: Confirmed` | `/sdlc:interview` |
| 2 | PRD | `PRD.md` | the feature's `test/<ctx>/` files (AC turn into tests) | `/sdlc:write-prd` |
| 3 | sad | `sad.md` | `src/<ctx>/module.ts` (the `<Ctx>Api`) | `/sdlc:architecture-design` |
| 4 | adr/ | `adr/NNNN-*.md` | none; an ADR is superseded, not updated | `/sdlc:decide-adr` |
| 5 | data-model | `data-model.md` | `migrations/NNNN_<ctx>_*.sql` and staged `docs/features/<slug>/migrations/` | `/sdlc:generate-data-model` |
| 6 | openapi.yaml | `contracts/openapi.yaml` | `src/<ctx>/infra/http/routes.ts` | `/sdlc:api-forge` |
| 7 | api-sync-report | `contracts/api-sync-report.md` | `openapi.yaml` and `data-model.md` | `/sdlc:api-forge` |
| 8 | tasks/ | `tasks/` (`tracker.md`, `tasks.json`) | the feature's own commits | `/sdlc:break-tasks` |
| 9 | CONTEXT | `CONTEXT.md` | `src/<ctx>/domain/` | `/sdlc:fix-term` |

Paths are relative to `docs/features/<slug>/`.

## Status rules

- present: the file exists and has content beyond the template (no unfilled `<...>` placeholders).
- missing: no file, or only the template skeleton.
- stale: a commit touched the checked code after the artifact's last commit. Take the artifact's last
  commit `D` (`git log -1 --format=%h <ref> -- <artifact>`), then `git log --format='%h %s' D..<ref> --
  <code paths>`; any line means stale, and the note names that commit. Compare commits, not dates or
  mtimes: a doc and its code are often committed on the same day, and a checkout resets mtimes.
- draft: present but not committed. Not checked for staleness.

Present, missing and draft are always decided, at any stage. Staleness needs code: while the feature has
no code yet (spec stage), "Checked against" is "no code yet" and nothing is stale.

A missing artifact often lives somewhere else. Name the stand-in in the note, the status stays missing:
a flat plan `docs/features/<ctx>-<entity>.md` (Decisions and slice JSON stand in for PRD and data-model),
migrations, route JSON schemas, tests, the commit body, prompts in `CAPSTONE_LOG.md`, rows in `LOG.md`.

## Protocol

1. Find the feature's commits: `git log -i --format='%h %ad %s' --date=short <ref>` with `--grep` for each
   slug word, singular too (`players` → `player`, `trade-offers` → `trade`, `offer`), plus the commits
   behind any files in `tasks/tasks.json`. Read the subjects and drop false matches. List the files.
   A later commit by another feature on the same path still counts for staleness; say whose it is.
2. Run `git show --stat` on those commits and list every file outside the feature's contexts,
   `migrations` and `test/` (`src/app.ts`, `src/shared/`, another context). Each is a decision that
   reaches past the feature; without an ADR it is a gap.
3. Check each of the 9 paths and fill the table below.
4. Write 3-5 recommendations, worst gap first, each with the command that fills it. A decision that lives
   only in chat or code, a change to shared code, or a `<Ctx>Api` another context already calls ranks
   above a missing formality. At spec stage, aim at the next gate (idea-brief Confirmed before PRD,
   PRD before sad).

## Output

```
Feature <slug> · contexts <ctx,...> · read from <worktree or ref> · code last changed <date> (<sha> | no code yet)
Outside the contexts: <files, or none>

| # | Artifact | Status | Last commit | Checked against | Note |

Recommendations
1. ...
```

Keep notes to one line. Don't fill or create artifacts here.
