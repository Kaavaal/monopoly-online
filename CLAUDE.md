# CLAUDE.md

Online Monopoly backend: Fastify 5 + `node:sqlite`, hexagonal per bounded context (`lobby`, `board`, `bank`,
`turns`). Read [ARCHITECTURE.md](ARCHITECTURE.md) before adding or moving files: it holds the context map,
the dependency rule and the slice anatomy every feature follows.

## Conventions

- One feature touches one context. Another context is reached through its `<Ctx>Api` from `module.ts`,
  passed in by `src/app.ts`.
- Relative imports end in `.js` (`import { openDb } from '../shared/db.js'`); type-only imports use
  `import type`.
- Schema changes go in a new file `migrations/NNNN_<context>_<name>.sql`, next free number. Applied
  migrations are frozen; fix forward with a new one.
- Errors leave domain and app code as `notFound` / `conflict` / `invalid` from `src/shared/errors.ts`.
- Every route declares a JSON schema for params, body and response.
- Tests go through HTTP with `makeTestApp()` from `test/helpers/app.ts` (fresh in-memory db per call).
- pnpm only; add dependencies with `pnpm add -E` so versions stay exact.

## Git

GitHub Flow: `main` stays green, every change goes through a short branch and a pull request.

- Branch off `main` per change, named `<type>/<short-name>` (`feat/trade-offers`, `fix/rent-rounding`). A branch
  lives a day or two, not weeks.
- Commits: Conventional Commits with the context as scope, e.g. `feat(lobby): create player`. Types `feat`,
  `fix`, `refactor`, `test`, `docs`, `chore`; repo-wide changes go without a scope.
- One commit, one logical change. A mixed working tree gets split into several commits (`git add -p`), and a
  test goes in the commit of the code it covers.
- Read `git diff --staged` before each commit.
- Open a draft PR right after the first green commit, not at the end. Push and PR only after the person says
  so.
- Undo a commit with `git revert`. `git reset --hard` is denied in `.claude/settings.json`.
- Secrets live in `.env` (git-ignored); only `.env.example` with dummy values is tracked.
  `.claude/hooks/block-secrets.sh` blocks a `git add` or `git commit` that would take a `.env` file, `*.pem` or `*.key`.

## Done gate

`pnpm check` (typecheck, tests, arch rules) is green before every commit. A red `arch:check` means the code
is in the wrong layer or context: move the code, keep the rule.

## LOG.md

After every commit on a `feature-1/*` or `feature-2/*` branch, append one row to `LOG.md`:

| Column | Value |
| --- | --- |
| date | `date -u +%FT%TZ` |
| branch | current branch |
| sha | `git rev-parse --short HEAD` |
| description | the commit subject, shortened |
| metric | `N tests passing` from the last `pnpm test`, plus `M min` since the feature's first prompt when known |

Commit the rows as `chore(log): <what>`. That commit gets no row of its own.
