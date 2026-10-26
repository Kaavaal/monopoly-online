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

## License

MIT, see [LICENSE](LICENSE).
