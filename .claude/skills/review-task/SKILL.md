---
name: review-task
description: Review a finished trade-offers task with the diff-reviewer subagent in a clean context, before merge.
argument-hint: <task-id> <base-ref>
disable-model-invocation: true
---

Arguments: `$ARGUMENTS` is the task id and the base ref, for example `T3 docs/trade-offers-spec`.

1. Run `scripts/review-input.sh <task-id> <base-ref>`. It writes the reviewer's input (the task's criteria
   from `docs/features/trade-offers/` and `git diff <base-ref>...HEAD`) and prints its path.
2. Start the `diff-reviewer` subagent with exactly this prompt and nothing more:
   `Review the change described in <path>.`
   Do not add a summary of the work, your own opinion or anything from this conversation.
3. Print the reviewer's answer as it came back. Do not soften or reinterpret the verdict.
