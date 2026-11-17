#!/usr/bin/env bash
# PreToolUse hook: runs scripts/pre-commit before any `git commit` the agent makes.
# Exit 2 blocks the call and hands the failing output back to Claude.
cmd=$(jq -r '.tool_input.command // ""')
grep -Eq '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit' <<<"$cmd" || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
if out=$(scripts/pre-commit 2>&1); then exit 0; fi
{ echo "pre-commit gate is red, commit blocked:"; tail -n 30 <<<"$out"; } >&2
exit 2
