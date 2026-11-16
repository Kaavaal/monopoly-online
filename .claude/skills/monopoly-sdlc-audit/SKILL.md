---
name: monopoly-sdlc-audit
description: Read-only audit of one feature's SDLC artifacts in monopoly-online. Scans docs/features/<slug>/, says which of the 9 module-6 artifacts are present, missing or stale against the feature's code, and gives 3-5 recommendations. Use for "/monopoly-sdlc-audit <slug>", "audit the docs of <feature>", "what artifacts does <feature> lack".
argument-hint: <slug> [context]
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git status:*), Bash(git ls-files:*), Bash(ls:*), Bash(test:*)
---

# monopoly-sdlc-audit

Inspects, never writes. The output is a status table and a short list of what to fix first.

## Input

- `<slug>`: feature folder name under `docs/features/` (`trade-offers`, `players`).
- `[context]`: `lobby`, `board`, `bank` or `turns`. If not given, take it from `sad.md` §5, else from the
  scope of the feature's commits (`feat(lobby): ...`). Still unknown: ask once.

## The 9 artifacts

| # | Artifact | Expected path | Stale when older than |
|---|---|---|---|
| 1 | idea-brief | `docs/features/<slug>/idea-brief.md` | never stale by code; check `status: Confirmed` |
| 2 | PRD | `docs/features/<slug>/PRD.md` | `test/<ctx>/` files of the feature (AC turn into tests) |
| 3 | sad | `docs/features/<slug>/sad.md` | `src/<ctx>/module.ts` |
| 4 | adr/ | `docs/features/<slug>/adr/NNNN-*.md` | never stale; an ADR is superseded, not updated |
| 5 | data-model | `docs/features/<slug>/data-model.md` | `migrations/NNNN_<ctx>_*.sql` of the feature |
| 6 | openapi.yaml | `docs/features/<slug>/contracts/openapi.yaml` | `src/<ctx>/infra/http/routes.ts` |
| 7 | api-sync-report | `docs/features/<slug>/contracts/api-sync-report.md` | `openapi.yaml` or `data-model.md` |
| 8 | tasks/ | `docs/features/<slug>/tasks/` (`tracker.md`, `tasks.json`) | last commit on the feature's code |
| 9 | CONTEXT | `docs/features/<slug>/CONTEXT.md` | `src/<ctx>/domain/` |

## Status rules

- present: the file exists and has content beyond the template (no unfilled `<...>` placeholders).
- missing: no file, or only the template skeleton.
- stale: the artifact's last commit is older than the last commit on the code it is checked against.
  Use `git log -1 --format=%cs -- <path>`, never file mtime (a checkout resets it).
- draft: the file exists but is not committed (`git status --short`). Not compared.
- n/a: nothing to compare with yet, e.g. no code for the feature.

## Protocol

1. Find the feature's code: files in commits whose scope is the context and whose subject names the
   feature (`git log --format='%h %cs %s' -- src/<ctx> migrations test/<ctx>`). List them.
2. Check each of the 9 paths and fill the table below.
3. Write 3-5 recommendations, worst gap first. A gap that let a decision live only in chat or code ranks
   above a missing formality.

## Output

```
Feature <slug> · context <ctx> · code last changed <date> (<sha>)

| # | Artifact | Status | Last commit | Checked against | Note |

Recommendations
1. ...
```

Keep notes to one line. Don't fill or create artifacts here: point to the `sdlc` skill that does it.
