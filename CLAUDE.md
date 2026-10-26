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
- Commits: Conventional Commits with the context as scope, e.g. `feat(lobby): create player`.
- pnpm only; add dependencies with `pnpm add -E` so versions stay exact.

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
