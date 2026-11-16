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

# quoted text with spaces is a message or a pattern, not a path: git commit -m "never git add .env"
plain=$(sed -E "s/\"[^\"]*[[:space:]][^\"]*\"//g; s/'[^']*[[:space:]][^']*'//g" <<<"$cmd")
# git with its global options, then the subcommand: git -C dir add
git_pre='git([[:space:]]+-[cC][[:space:]]+[^[:space:]]+|[[:space:]]+--?[a-z-]+(=[^[:space:]]+)?)*[[:space:]]+'
repo_of() { sed -nE 's/^git[[:space:]]+-C[[:space:]]+([^[:space:]]+).*/\1/p' <<<"$1"; }

# each git add / git stage up to the next ; & or |
while read -r seg; do
  [ -z "$seg" ] && continue
  repo=$(repo_of "$seg"); repo=${repo:-.}
  args=$(sed -E "s/^${git_pre}(add|stage)//" <<<"$seg")
  # a secret named directly: git add .env, git add -f config/.env.local
  hit=$(tr -s " \t'\"" '\n' <<<"$args" | is_secret | head -1)
  [ -n "$hit" ] && block "$hit"
  # what git would really stage, ignored files too when forced: git add -f .
  read -ra words <<<"$args"
  if staged=$(git -C "$repo" add --dry-run "${words[@]//[\'\"]/}" 2>/dev/null); then
    hit=$(sed -E "s/^add '(.*)'$/\1/" <<<"$staged" | is_secret | head -1)
  elif grep -qE '(^|[[:space:]])(-[a-zA-Z]*f[a-zA-Z]*|--force)([[:space:]]|$)' <<<"$args"; then
    # a forced add the dry run can't read (cd elsewhere first): assume the worst
    hit=$(git -C "$repo" ls-files --others --ignored --exclude-standard 2>/dev/null | is_secret | head -1)
  fi
  [ -n "$hit" ] && block "$hit"
done <<<"$(grep -oE "\\b${git_pre}(add|stage)\\b[^;&|]*" <<<"$plain")"

# a secret staged earlier by hand, caught at commit time
while read -r seg; do
  [ -z "$seg" ] && continue
  repo=$(repo_of "$seg")
  hit=$(git -C "${repo:-.}" diff --cached --name-only 2>/dev/null | is_secret | head -1)
  [ -n "$hit" ] && block "$hit"
done <<<"$(grep -oE "\\b${git_pre}commit\\b[^;&|]*" <<<"$plain")"
exit 0
