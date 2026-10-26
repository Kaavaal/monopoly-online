# monopoly-online

Backend for an online Monopoly game. Node 24, TypeScript, Fastify 5 and SQLite through the built-in
`node:sqlite`, so it runs with no database server or Docker.

The code is split into four bounded contexts (`lobby`, `board`, `bank`, `turns`), each laid out as a small
hexagon. Right now they are empty skeletons; features fill them in one at a time. See
[ARCHITECTURE.md](ARCHITECTURE.md) for the rules.

## Run

```bash
pnpm install
pnpm migrate      # creates monopoly.db and applies migrations/
pnpm dev          # http://localhost:8080/health
```

`DB_PATH` and `PORT` override the defaults (`monopoly.db`, `8080`). `pnpm dev` and `pnpm start` apply pending
migrations on boot as well.

## Scripts

| Script            | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `pnpm dev`        | Start with reload on change (`tsx watch`)                 |
| `pnpm start`      | Start once                                                |
| `pnpm migrate`    | Apply pending migrations to `DB_PATH`                     |
| `pnpm typecheck`  | `tsc --noEmit`                                            |
| `pnpm test`       | Vitest, each test on a fresh in-memory database           |
| `pnpm arch:check` | dependency-cruiser: layering and context boundaries       |
| `pnpm check`      | All three checks above; the gate before every commit      |
| `pnpm release:notes` | Draft the next `docs/CHANGELOG.md` section (see below) |

## Release notes

`scripts/release-notes.mjs` drafts the next section of [docs/CHANGELOG.md](docs/CHANGELOG.md) with a
Claude Agent SDK run (`claude-haiku-5-5`) and leaves it as an uncommitted change for you to review.

```bash
pnpm release:notes                   # range: latest v* tag..HEAD; version: see below
pnpm release:notes --version 0.2.0   # or name the version
git diff docs/CHANGELOG.md           # review, then commit and tag by hand
```

The next version: a breaking commit (`type!:`) bumps the major (the minor before 1.0), any `feat` the minor,
anything else the patch. Locally it uses your `claude` login (claude.ai OAuth); no key is needed. It refuses to
run (exit 1) when the changelog already has that version's section or has uncommitted changes, and exits 2 when
the agent's notes do not match git or its edit: the new section must sit right below `## Unreleased`, match the
JSON line for line, and leave the rest of the file as it was (blank lines aside). Tool calls and the run's cost
go to stderr, the agent's JSON to stdout.

In CI, the manual `release-notes` workflow (`.github/workflows/release-notes.yml`, optional `version` input)
runs the same command and uploads the result as `release.patch`; apply it with `git apply release.patch`. With
no commits since the last tag the run stays green with a notice and uploads nothing. It never commits, tags,
pushes or opens a PR. The `ci` workflow runs `pnpm check` on pull requests and on pushes to `main`.

What keeps it honest:

- **Schema validation:** the SDK enforces the JSON schema on the answer, and the script re-validates it and
  prints `[verify] schema OK`.
- **Manual apply:** the agent may edit only `docs/CHANGELOG.md`, so `git diff > release.patch` applies with
  `git apply` on another checkout of the same commit; nothing is committed, tagged or pushed.
- **Turns capped:** `MAX_TURNS = 8` (plus a $0.25 budget and a 180 s timeout), printed in the run header.
- **Secrets via env:** CI passes `ANTHROPIC_API_KEY` from `secrets.ANTHROPIC_API_KEY`; the repo holds no key.

## License

MIT, see [LICENSE](LICENSE).
