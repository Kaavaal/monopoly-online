---
status: Living
updated_at: "2026-11-16"
---

# Domain Context — trade-offers

<!--
CONTEXT.md is the domain glossary — not a PRD and not a scratch pad. NO implementation
detail here (no datastore/broker/framework names, no API contracts) — only domain words
and the boundaries between them. Implementation choices live in the SAD and ADRs;
behaviour lives in PRD.md.

Multi-context repos: each bounded context has its own CONTEXT.md at its root path
(registered in CONTEXT-MAP.md). System-wide terms that span all contexts live in the
repo-root CONTEXT.md. Never duplicate a term across files — pick one owner.

Terms get fixed inline, the moment they surface in an interview / PRD / review — never
batched «I'll consolidate later». Empty H2 → prune before commit; keep only the sections
that carry real content. ## Glossary is mandatory; the other two are optional.
-->

## Glossary

<!-- One line per term: name · one-sentence canonical definition · one-sentence boundary
     (what it is NOT / the concept it gets confused with). Alphabetical once there are a few. -->
- expired offer — a trade offer the recipient did not answer within its lifetime; it can no longer be accepted or rejected, and no title deeds or money change hands. NOT rejected offer (a rejected offer was explicitly refused by the recipient; an expired offer ended with no decision from them).
- proposer — the player who creates a trade offer and names what they give and what they ask for in return. NOT owner (an owner holds a title deed in board; a proposer may own none of the deeds in the offer, e.g. when offering only money).
- recipient — the one player a trade offer is addressed to and the only player who can accept or reject it. NOT the payee of a transfer (a payee receives money in bank without being asked; a recipient only gets a proposal and receives nothing unless they accept it).
- trade offer — a proposal from one player to another player in the same room to give their own title deeds and/or money in exchange for the other's title deeds and/or money; the recipient accepts or rejects it as a whole, and it expires if left unanswered. NOT transfer (a transfer is a one-way movement of money between accounts in bank; a trade offer is a two-sided proposal that needs the recipient's consent).
