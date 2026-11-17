---
name: tdd
description: Runs one task of a feature through RED, GREEN and REFACTOR with three separate agents (tdd-test-writer, tdd-implementer, tdd-refactorer) and shell checks between the phases. Use on "/tdd <task-id>" (e.g. "/tdd T3"), optionally with --review-tests to stop for a human look at the tests before the implementer starts.
allowed-tools: Bash, Read, Agent
---

# /tdd <task-id> [--review-tests]

You only conduct. Each phase is one Agent call, so each agent works in its own context; you write no tests and
no code yourself, and you do not fix a phase that failed. When a check fails, stop and print the message
given for it, nothing else.

## Before the first phase

1. `git status --porcelain` is empty. Otherwise stop: `Working tree not clean.`
2. Find the task file: `grep -l "^id: <task-id>$" docs/features/*/tasks/*.md`. Exactly one file, else stop:
   `Task <task-id> not found.` Call it TASK.
3. `git rev-parse HEAD` is BASE. `date +%s` is START.

## RED

Agent `tdd-test-writer`, prompt: `Task file: <TASK>. Write the failing tests for it and commit them.`
Take RED from its line `RED phase commit: <sha>`.

Check 1, in Bash:
- `git log -1 --format=%s` starts with `test(`. Else stop: `RED check failed: last commit is "<subject>", not test(.`
- `git diff --name-only <BASE> HEAD -- test` is not empty. Else stop: `RED check failed: no test files in the commit.`
- `pnpm test; echo "EXIT:$?"` ends with an exit code other than 0. Else stop:
  `RED check failed: tests pass before any implementation, so they check nothing new.`
- `git status --porcelain` is empty. Else stop: `RED check failed: uncommitted changes left.`

With `--review-tests`: print `git show --stat <RED>` and the list of test names
(`grep -nE "^\s*(it|test)\(" <new test files>`), then ask the user to answer `continue` or `abort` and wait.
On `abort` stop and tell them `git reset --hard <BASE>` undoes the run. On `continue` go on.

## GREEN

Agent `tdd-implementer`, prompt: `Task file: <TASK>. RED commit: <RED>. Make the tests pass without touching test/ and commit.`
Take GREEN from `GREEN phase commit: <sha>`.

Check 2:
- `git log -1 --format=%s` starts with `feat(`. Else stop: `GREEN check failed: last commit is "<subject>", not feat(.`
- `pnpm check; echo "EXIT:$?"` exits 0. Else stop: `GREEN check failed: pnpm check is red after the implementer.`
- `git diff --name-only <RED> HEAD -- test` is empty and `git status --porcelain` is empty. Else stop:
  `GREEN check failed: test/ changed after RED: <files>.`

## REFACTOR

Agent `tdd-refactorer`, prompt: `Task file: <TASK>. GREEN commit: <GREEN>. Clean up without changing behaviour or test/.`
It ends with `REFACTOR phase commit: <sha>` or `REFACTOR phase: no changes`.

Check 3:
- If it committed: `git log -1 --format=%s` starts with `refactor(`. If not: HEAD is still <GREEN>. Else stop:
  `REFACTOR check failed: unexpected commit "<subject>".`
- `pnpm check; echo "EXIT:$?"` exits 0. Else stop: `REFACTOR check failed: pnpm check is red.`
- `git diff --name-only <RED> HEAD -- test` is empty and `git status --porcelain` is empty. Else stop:
  `REFACTOR check failed: test/ changed after RED: <files>.`

## Report

```
/tdd <task-id> done in <now - START> s
RED      <sha> <subject>
GREEN    <sha> <subject>
REFACTOR <sha> <subject>   (or: no changes)
checks: 3 passed, test/ unchanged since RED
```
