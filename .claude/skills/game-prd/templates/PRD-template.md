---
status: Draft
owner: "<game owner>"
updated_at: "<YYYY-MM-DD>"
feature_size: "<from .size, or empty>"
stage: "02"
brief: "<game-brief.md | idea-brief.md>"
reference: "<src/ctx>"
---

# PRD: <feature name>

> Inputs: [brief](./<brief file>) · [CONTEXT](./CONTEXT.md) · reference context `<src/ctx>`

## 1. Context

<!-- Three short paragraphs: the problem at the table and who has it (brief §2, §3); why now (brief §4);
the chosen approach in one or two sentences (brief recommendation). Then a list of prerequisites that are
separate features, and which contexts own the data this feature reads or changes (players and rooms in lobby,
deeds in board, money in bank, rolls and moves in turns). No storage or library names. -->

Decisions kept against the critic:

<!-- One line per finding the owner kept, with their reason. Delete the heading if none. -->

## 2. Goals

<!-- 2-3 outcomes a player would notice. No numbers; numbers are in §7. -->

## 3. Non-goals

<!-- One line each, with the reason. From the brief's out-of-scope list, plus every cut made by an Edit in
the walk ("cut in the walk: <what>, because <owner's reason>"). -->

## 4. User stories

<!-- Roles only from the glossary. Title is the action in 3-6 words. -->

### US-01: <action>

**As a** <glossary role>
**I want** <action>
**So that** <what the player gains at the table>

## 5. Acceptance criteria

<!-- Given / When / Then in player language. Tag each with its story and one type:
happy, error, authorization, invariant, cross-context, timing. All six types present, or a written N/A for
timing. Edge cases added in the walk get a b suffix (AC-04b).
No HTTP verbs, paths, status numbers, error codes or payloads here: those go to §10.2. -->

### AC-01 (US-01) — happy

**Given** <who, in which state, holding what>
**When** <what the player does>
**Then** <what the player sees and what changed hands, or that nothing did>

## 6. Non-functional requirements

<!-- Start from the skill's default table and change only what the owner changed. Every target is a number
or a yes/no guarantee with a test that checks it. -->

| Aspect | Target | Measurement |
|---|---|---|
| p95 of one write action | ≤ 5 ms | timed calls in the feature's test file, 300 calls |
| p95 of one list action, 300 rows | ≤ 10 ms | same |
| money in a room | unchanged by any exchange | sum of balances before and after, in every exchange test |
| title deed owners | exactly one per deed after every action | in every exchange test |
| two players acting on the same thing at once | exactly one wins, 100 of 100 runs | repeated test |

## 7. Metrics

<!-- 3-4 metrics, each with baseline, target and window. At least one says whether games end better
(the brief's outcome metric); at least one watches the main risk of the chosen approach. Name the trigger
that would bring a parked approach back. -->

## 8. Fair play and privacy

<!-- What a player can learn about others through this feature, and what is hidden. Abuse at the table:
collusion, kingmaking, a losing player dragging the game on, flooding another player, acting in someone
else's name. For each: allowed, limited, or refused, and the signal to watch. One line on personal data. -->

## 9. States

<!-- Only when the feature has a lifecycle; else replace the table with one N/A line and the reason.
State names are glossary terms.
Every row is reached by at least one AC. -->

| From | Event | To | AC |
|---|---|---|---|
| — | <role> does <action> | <state> | AC-01 |

Final states: <list>. Nothing leaves a final state.

## 10. Who may do what, and refusals

### 10.1 Permissions

<!-- One row per action from §4, one column per glossary role plus "other player in the room" and "player
outside the room". Cell: yes / refused (says why) / hidden (as if it does not exist). -->

| Action | <role 1> | <role 2> | other player in the room | player outside the room |
|---|---|---|---|---|
| <action> | yes | refused | hidden | hidden |

### 10.2 Refusals

<!-- One row per refusing AC. Kind is invalid, not_found or conflict (src/shared/errors.ts). Code is
<ctx>.<error_name>, snake_case, ctx = the context that owns the rule. Message is what the player reads. -->

| AC | Kind | Code | Message to the player |
|---|---|---|---|
| AC-02 | invalid | <ctx>.<error_name> | <plain words> |

## 11. Open questions

<!-- - [ ] <question>? Default now: <x>. — owner: <name>, due: <date or stage> -->
