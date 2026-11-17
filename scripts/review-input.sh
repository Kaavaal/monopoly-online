#!/usr/bin/env bash
# Builds the reviewer's whole input: the task's criteria and the diff. Nothing else.
# Usage: scripts/review-input.sh <task-id> <base-ref>   Prints the path of the file it wrote.
set -euo pipefail
cd "$(dirname "$0")/.."
id=$1 base=$2
feature=docs/features/trade-offers
task=$(grep -l "^id: $id\$" $feature/tasks/*.md)
out=${TMPDIR:-/tmp}/review-$id.md
{
  echo "# Acceptance criteria"
  echo
  sed '1,/^---$/{/^---$/!d;}; /^---$/d' "$task"
  for ac in $(sed -n 's/^acs: \[\(.*\)\]$/\1/p' "$task" | tr -d '",'); do
    echo
    awk -v h="### $ac " 'index($0, h) == 1 {on = 1; print; next} on && /^#/ {exit} on' $feature/PRD.md
  done
  echo
  echo "# Diff ($base...HEAD)"
  echo
  echo '```diff'
  git diff "$base"...HEAD -- . ':(exclude)LOG.md'
  echo '```'
} >"$out"
echo "$out"
