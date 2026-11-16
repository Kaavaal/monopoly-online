---
status: Draft | Confirmed | Comparison
owner: "<game owner>"
updated_at: "<YYYY-MM-DD>"
stage: "01"
score:
  rice: <number>
  state: proposed | confirmed
feasibility: proposed | confirmed
---

# Game brief: <feature>

## 1. Raw idea
<the owner's 1-3 sentences, verbatim>

## 2. At the table
- **Real table:** <what players do today, official rule or house rule>
- **Online now:** <what breaks or is missing in the game today>

## 3. Players
<who touches it: hosts, every player, the player on turn, the losing player; how many per month in playtests>

## 4. Why now
<what in the game makes it due: a feature it unblocks, a complaint from playtests>

## 5. Out of scope
- <thing> · <why not in the first version>

## 6. Other games
| # | Game · link | How they do it | What is missing |
|---|---|---|---|
| 1 | <name> · <url> | <mechanic> | <gap> |

Searched "<query>" on <date>.

## 7. Approaches

### A. <name> (table-faithful)
- **Thesis:** <one sentence, player language>
- **Gains most:** <who from §3>
- **Metric:** <baseline → target>
- **Trade-off:** <one line>
- **Effort:** S / M / L

### B. <name> (digital-only)
<same fields>

### C. <name> (middle)
<same fields>

## 8. Reviews

### Engineer
- <contexts touched and new slices per approach, missing cross-context calls>

### Game designer
- <balance, exploits, kingmaking, game length>

### Player
- <phone, waiting, first-time confusion>

| | Engineer | Game designer | Player |
|---|:---:|:---:|:---:|
| A | <+/0/-> <reason> | | |
| B | | | |
| C | | | |

## 9. Edge cases
| Situation | What the player sees | Refusal |
|---|---|---|
| <deed in the offer changed owner> | <message> | conflict |

## 10. Risks
- **Worst:** <from the devil's advocate>
- <others>

## 11. Score
- **Reach:** <n> · <from §3>
- **Impact:** <0.5/1/2/3> · <from §2 and the game designer>
- **Confidence:** <0.5-1.0> · <open questions in §15>
- **Effort:** <days> · <slices from §8 priced by LOG.md>
- **RICE:** <R × I × C / E> · <proposed / confirmed>

## 12. Feasibility
- [ ] **Contexts ready:** <which contexts have code, which are skeletons>
- [ ] **Rules clear:** <settled or still argued>
- [ ] **Time:** <fits the next two weekends or not>

## 13. Recommendation
**Approach <X>.** <3-5 sentences citing §6, §8, §11, §12>

## 14. Parked
| Approach | Why parked | Brings it back |
|---|---|---|
| <B> | <reason> | <trigger> |

## 15. Open questions
- [ ] <question> · <who answers, by when>

## 16. Contexts touched
| Context | What it gives this feature | Exists today? |
|---|---|---|
| lobby | <players, rooms> | <yes / partly / no> |
| board | <deeds and owners> | |
| bank | <accounts, money moves> | |
| turns | <whose turn, rolls> | |
