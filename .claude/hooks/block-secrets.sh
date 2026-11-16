#!/bin/bash
# PreToolUse(Bash): keep .env files and keys out of commits. Exit 2 blocks the call.
input=$(cat)
cmd=$(jq -r '.tool_input.command // ""' <<<"$input")
cd "$(jq -r '.cwd // "."' <<<"$input")" 2>/dev/null || exit 0

secret='(^|/)(\.env(\.[^/[:space:]]+)?|[^/[:space:]]+\.(pem|key))$'
is_secret() { grep -E "$secret" | grep -vE '(^|/)\.env\.example$'; }
block() {
  echo "Blocked: $1 would go into a commit. Secrets stay out of git, only .env.example is tracked." >&2
  exit 2
}

# git add parts of the command, up to the next ; & or |
adds=$(grep -oE '\bgit\b[^;&|]*\badd\b[^;&|]*' <<<"$cmd")
if [ -n "$adds" ]; then
  # a secret named directly: git add .env, git add -f config/.env.local
  hit=$(tr -s " \t'\"" '\n' <<<"$adds" | is_secret | head -1)
  [ -n "$hit" ] && block "$hit"
  # what git would really stage, ignored files included when forced: git add -f .
  while read -r seg; do
    read -ra words <<<"${seg#*add}"
    if staged=$(git add --dry-run "${words[@]//[\'\"]/}" 2>/dev/null); then
      hit=$(sed -E "s/^add '(.*)'$/\\1/" <<<"$staged" | is_secret | head -1)
    elif grep -qE '(\s-[a-zA-Z]*f\b|--force)' <<<"$seg"; then
      # a forced add the dry run can't read (cd elsewhere, git -C): assume the worst
      hit=$(git ls-files --others --ignored --exclude-standard 2>/dev/null | is_secret | head -1)
    fi
    [ -n "$hit" ] && block "$hit"
  done <<<"$adds"
fi

# a secret staged earlier by hand, caught at commit time
if grep -qE '\bgit\b[^;&|]*\bcommit\b' <<<"$cmd"; then
  hit=$(git diff --cached --name-only 2>/dev/null | is_secret | head -1)
  [ -n "$hit" ] && block "$hit"
fi
exit 0
