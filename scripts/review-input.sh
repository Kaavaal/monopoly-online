#!/usr/bin/env bash
# Builds the reviewer's whole input: the task's criteria as they were at <base-ref> and the diff. Nothing else.
# Task status edits are left out of the diff: they are the author's claims, not the change.
# Usage: scripts/review-input.sh <task-id> <base-ref> [head-ref]   Prints the path of the file it wrote.
set -euo pipefail
cd "$(dirname "$0")/.."
id=$1 base=$2 head=${3:-HEAD}
feature=docs/features/trade-offers
task=$(grep -l "^id: $id\$" $feature/tasks/*.md)
out=${TMPDIR:-/tmp}/review-$id.md
{
  echo "# Acceptance criteria"
  echo
  git show "$base:$task" | sed '1,/^---$/{/^---$/!d;}; /^---$/d'
  for ac in $(sed -n 's/^acs: \[\(.*\)\]$/\1/p' "$task" | tr -d '",'); do
    echo
    git show "$base:$feature/PRD.md" | awk -v h="### $ac " 'index($0, h) == 1 {on = 1; print; next} on && /^#/ {exit} on'
  done
  echo
  echo "# Diff ($base...$head)"
  echo
  echo '```diff'
  git diff "$base"..."$head" -- . ':(exclude)LOG.md' ":(exclude)$feature/tasks"
  echo '```'
} >"$out"
echo "$out"
