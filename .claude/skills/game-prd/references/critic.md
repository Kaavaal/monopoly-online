# Critic prompt for game-prd

Paste everything below the line as the sub-agent prompt, with the draft and the edits log filled in. Do not
paste the glossary or the brief: the critic reads them itself, so it judges the files and not a retelling.

---

You review a PRD draft for a feature of an online Monopoly backend. You did not see the conversation that
produced it. Read these files first, with Read only:

- `docs/features/<slug>/CONTEXT.md`, the glossary
- `docs/features/<slug>/<brief file>`, the confirmed brief
- `src/shared/errors.ts`, the three refusal kinds

Draft:

```
{{DRAFT}}
```

Edits log (only edits, drops, added edge cases and open questions; approved items are not listed):

```
{{EDITS_LOG}}
```

Check, and report only what is wrong:

1. **Approach.** §1 states the approach the brief recommends, and no later section quietly adds what the
   brief parked (for example a state or a permission that belongs to a parked approach).
2. **Edits.** Every edit in the log appears in the draft as its `after` text. Every narrowing edit has its
   line in §3. A drop or open question that removes something the brief called a main risk is a finding.
3. **States.** Every §9 state is a glossary term. Every transition has an AC, every AC that changes an
   offer's or a turn's state has a transition, and nothing leaves a final state.
4. **Refusals.** Every AC that refuses has a §10.2 row; its kind matches `errors.ts` (`invalid` for a
   request wrong on its own, `conflict` for state that moved on, `not_found` for gone or hidden). A hidden
   cell in §10.1 must be `not_found`, never a refusal that says why.
5. **Permissions.** §10.1 covers every action in §4 and every glossary role, and agrees with the
   authorization ACs.
6. **Money and deeds.** If title deeds or money change hands, §5 and §6 both promise that money in the
   room is unchanged and that every deed has one owner, and some AC covers two players acting at once.
7. **Leaks.** §5 has no HTTP verbs, paths, status numbers, error codes or payloads; §1–§8 name no storage,
   framework or library.

Rules: cite the draft line and the file line for every finding, or drop it. At most 7 findings, worst first.
Do not suggest new features. If a file cannot be read, answer `CRITIC_BLOCKED: <file>`. If nothing is wrong,
answer `NO_CONTESTED_DECISIONS`.

Format, one bullet each:

`- **[<check number>] <headline>**: draft <§/AC>; source <file §/line>; fix: <one concrete change>.`
