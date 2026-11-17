# Drift check, verdict, ban list

Step 8 of the skill. The report shape is `../templates/api-sync-report.md`.

## Five points

Each point is ✓, ✓ (deferred: one line) or ✗ (one line). 1–3 are core, 4–5 supporting.

1. **Operation ↔ table** (core). Every operation reads or writes a table of game-data-model.md, named in the
   report. Scenario B: every operation maps to a PRD user story.
2. **Code ↔ PRD refusal table and `src/shared/errors.ts`** (core). Every `code` in an example is a row of the
   PRD refusal table (`game-prd.md` §10.2 or wherever the PRD keeps it), with the same kind and status. The
   kind must exist in `src/shared/errors.ts`. A dotted code needs the factories to take a code argument
   (game-adr/0004): while they don't, the point is `✓ (deferred: errors.ts gains the code argument with this
   feature)`, not ✗.
3. **Schema ↔ constraint** (core). Every `format`, `maxLength`, `minimum`, `enum` and nullability has the
   source the SKILL.md table names. Two sources disagree → take the stricter, flag both.
4. **Coverage** (supporting). Every table is surfaced by an operation or marked internal with a reason; every
   PRD acceptance criterion maps to a response or an example; every operation maps to a story.
5. **Sequence ↔ responses** (supporting). Every `alt` branch of game-sad.md §6 has a response and a named
   example. A refusal the contract needs that no flow draws is a sequence gap: offer `/game-sad <slug>` first.

## Verdict

| Verdict | When |
|---|---|
| `PASS` | scenario A, all five ✓, `unresolved_origins` empty, deferrals `none`, typecheck green |
| `PASS (with deferrals)` | 1–3 ✓, something parked with a next step: scenario B, a deferred point, an open question, a sequence gap |
| `FAIL` | a core point at ✗, three or more open findings, a field with no origin, or a red typecheck |

## Ban list

Run from the repo root. The four greps must print nothing; the codegen check must exit 0.

```bash
Y=docs/features/<slug>/game-contracts/openapi.yaml
grep -nE 'nullable: true|additionalProperties: true|/api/v[0-9]|[?&]v=' "$Y"
grep -nE '^\s+[a-z]+_[a-z_]+:' "$Y"                                         # snake_case keys
awk '/^paths:/{p=1} /^components:/{p=0} p && /schema:[[:space:]]*$/{print FILENAME":"NR": inline schema"}' "$Y"
grep -niE '@[a-z0-9-]+\.(com|net|org|io|ua)\b|\+[0-9]{2,3} ?[0-9]{2,3} ?[0-9]{3}' "$Y"   # real-looking contacts
pnpm exec openapi-typescript "$Y" -o test/contracts/<slug>.game-api.ts \
  --root-types --root-types-no-schema-prefix --immutable --check               # types are up to date
```

`--check` exits 1 with "Generated types are not up-to-date!" when the committed types lag behind the YAML.
