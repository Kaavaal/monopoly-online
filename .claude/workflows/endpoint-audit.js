export const meta = {
  name: 'endpoint-audit',
  description: 'Read-only audit of every HTTP entry point for missing access checks and input validation; writes docs/audit/endpoint-audit.md',
  phases: [
    { title: 'Find', detail: 'one finder per route group, findings per element' },
    { title: 'Verify', detail: 'independent re-check of every finding against code and contract' },
    { title: 'Report', detail: 'write docs/audit/endpoint-audit.md' },
  ],
}

const CONTRACT = 'docs/features/trade-offers/contracts/openapi.yaml'
const LOBBY = 'src/lobby/infra/http/routes.ts'
const BOARD = 'src/board/infra/http/routes.ts'
const TRADE_DOCS = `${CONTRACT}, docs/features/trade-offers/PRD.md, docs/features/trade-offers/sad.md, docs/features/trade-offers/CONTEXT.md, docs/features/trade-offers/data-model.md`

const GROUPS = [
  { key: 'lobby', kind: 'live', sources: `${LOBBY}, src/lobby/app/, src/lobby/domain/, src/shared/http.ts, src/shared/errors.ts`,
    elements: ['POST /players', 'GET /players', 'GET /players/:id', 'PATCH /players/:id', 'DELETE /players/:id'] },
  { key: 'board', kind: 'live', sources: `${BOARD}, src/board/app/, src/board/domain/, src/board/module.ts, src/shared/http.ts, src/shared/errors.ts`,
    elements: ['POST /properties', 'GET /properties', 'GET /properties/:id', 'PATCH /properties/:id', 'DELETE /properties/:id'] },
  { key: 'health', kind: 'live', sources: 'src/app.ts, src/shared/http.ts',
    elements: ['GET /health'] },
  { key: 'trade-create', kind: 'planned', sources: TRADE_DOCS,
    elements: ['POST /trade-offers (createTradeOffer)'] },
  { key: 'trade-lists', kind: 'planned', sources: TRADE_DOCS,
    elements: ['GET /trade-offers/incoming (listIncomingTradeOffers)', 'GET /trade-offers/outgoing (listOutgoingTradeOffers)'] },
  { key: 'trade-decide', kind: 'planned', sources: TRADE_DOCS,
    elements: ['POST /trade-offers/{id}/accept (acceptTradeOffer)', 'POST /trade-offers/{id}/reject (rejectTradeOffer)'] },
]

const READ_ONLY = 'This is a read-only audit: do not create, edit or delete any file, and do not run anything that changes the repo or its git state.'

const MAX_AGENTS = 20
let spawned = 0

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['element', 'category', 'severity', 'title', 'claim', 'evidence'],
        properties: {
          element: { type: 'string', description: 'exactly one of the listed elements' },
          category: { type: 'string', enum: ['access', 'validation'] },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          title: { type: 'string' },
          claim: { type: 'string', description: 'one falsifiable statement of what is missing and what a caller can do because of it' },
          evidence: { type: 'string', description: 'file:line references that show it' },
        },
      },
    },
  },
}

const VERDICTS_SCHEMA = {
  type: 'object',
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'verdict', 'reason', 'evidence'],
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string', enum: ['confirmed', 'rejected'] },
          reason: { type: 'string', description: 'why, in one or two sentences' },
          evidence: { type: 'string', description: 'file:line references you read yourself' },
        },
      },
    },
  },
}

function findPrompt(g) {
  const subject = g.kind === 'live'
    ? 'These routes are live. Audit the code as it runs: the route schema, the handler, the service and the domain code it calls.'
    : `These operations are planned, not implemented. Audit the contract ${CONTRACT} as the thing that will be built, against the PRD acceptance criteria, sad.md and the data model: a gap is something the contract leaves unspecified or contradicts.`
  return `Audit these HTTP entry points of the monopoly-online backend for two kinds of gap only.

Elements:
${g.elements.map((e) => `- ${e}`).join('\n')}

${subject}
Start from: ${g.sources}. Follow imports as far as you need.

1. access: the caller is not authenticated, or is not checked against the thing they act on (who may change or delete this record, act for this player, see this data).
2. validation: an input (path param, query, header, body field, or a relation between fields or to another record) reaches the service unchecked, or is checked more loosely than the domain or the contract requires.

Report one finding per gap per element. Each claim must be a single statement another engineer can prove or disprove by reading the files, with file:line evidence. An element with no gap gets no finding; do not pad. Style, naming, performance and missing tests are out of scope.

${READ_ONLY}`
}

function verifyPrompt(g, batch) {
  return `Another engineer audited HTTP entry points of the monopoly-online backend and made the claims below. Check each one independently by reading the code and the contract yourself; you have their claim, not their reasoning.

${g.kind === 'live'
    ? 'The routes are live: the truth is what the code does (route schema, handler, service, domain).'
    : `The operations are planned: the truth is what ${CONTRACT} specifies, read with the PRD, sad.md and data-model.md in docs/features/trade-offers/.`}
Start from: ${g.sources}.

For each claim, return "confirmed" only if you found the gap yourself and can cite file:line for it. Return "rejected" if a check exists that the claim missed (a JSON schema, a domain rule, a contract clause, a Fastify default), if the claim is not about access or input validation, if it duplicates another claim in this list (name the id), or if you could not establish it from the files. Give the reason either way.

Claims:
${batch.map((f) => `- id ${f.id} | ${f.element} | ${f.category} | ${f.claim} | cited: ${f.evidence}`).join('\n')}

Return one verdict per id, every id exactly once.

${READ_ONLY}`
}

const perGroup = await pipeline(
  GROUPS,
  (g) => {
    spawned++
    return agent(findPrompt(g), { label: `find:${g.key}`, phase: 'Find', schema: FINDINGS_SCHEMA })
  },
  async (found, g) => {
    if (!found) return { group: g, failed: true, rows: [] }
    const findings = found.findings.map((f, i) => ({ ...f, id: `${g.key}-${i + 1}` }))
    if (!findings.length) return { group: g, rows: [] }
    // At most two verifiers per group keeps the whole run under 20 agents.
    const size = Math.ceil(findings.length / 2)
    const batches = findings.length > 3 ? [findings.slice(0, size), findings.slice(size)] : [findings]
    const results = await parallel(batches.map((batch, i) => () => {
      spawned++
      return agent(verifyPrompt(g, batch), { label: `verify:${g.key}:${i + 1}`, phase: 'Verify', schema: VERDICTS_SCHEMA })
    }))
    const verdicts = new Map(results.filter(Boolean).flatMap((r) => r.verdicts).map((v) => [v.id, v]))
    return { group: g, rows: findings.map((f) => ({ ...f, check: verdicts.get(f.id) || null })) }
  },
)

const groups = GROUPS.map((g, i) => perGroup[i] || { group: g, failed: true, rows: [] })
const rows = groups.flatMap((r) => r.rows)

let retryRound = 0
while (retryRound < 1 && rows.some((r) => !r.check)) {
  retryRound++
  const pending = groups.filter((r) => r.rows.some((x) => !x.check))
  const room = Math.max(0, MAX_AGENTS - 1 - spawned) // one slot stays for the report writer
  const now = pending.slice(0, room)
  if (now.length < pending.length) {
    log(`retry skipped for ${pending.slice(room).map((r) => r.group.key).join(', ')}: agent limit of ${MAX_AGENTS}`)
  }
  const results = await parallel(now.map((r) => () => {
    spawned++
    return agent(verifyPrompt(r.group, r.rows.filter((x) => !x.check)),
      { label: `reverify:${r.group.key}`, phase: 'Verify', schema: VERDICTS_SCHEMA })
  }))
  results.forEach((res, i) => {
    if (!res) return
    const byId = new Map(res.verdicts.map((v) => [v.id, v]))
    now[i].rows.forEach((x) => { if (!x.check) x.check = byId.get(x.id) || null })
  })
}

const confirmed = rows.filter((r) => r.check && r.check.verdict === 'confirmed')
const rejected = rows.filter((r) => r.check && r.check.verdict === 'rejected')
const unverified = rows.filter((r) => !r.check)
const failedGroups = groups.filter((r) => r.failed)
log(`${rows.length} findings: ${confirmed.length} confirmed, ${rejected.length} rejected, ${unverified.length} unverified`)

const rank = { high: 0, medium: 1, low: 2 }
const item = (r) => `### ${r.id}: ${r.title}

- category: ${r.category}
- severity: ${r.severity}
- claim: ${r.claim}
- finder evidence: ${r.evidence}
- verifier: ${r.check.reason}
- verifier evidence: ${r.check.evidence}
`
const section = (g) => g.elements.map((el) => {
  const own = confirmed.filter((r) => r.element === el).sort((a, b) => rank[a.severity] - rank[b.severity])
  return `## ${el}\n\n${own.length ? own.map(item).join('\n') : 'No confirmed findings.\n'}`
}).join('\n')

const strays = confirmed.filter((r) => !GROUPS.some((g) => g.elements.includes(r.element)))

const report = `# Endpoint audit: access checks and input validation

- date: ${(args && args.date) || 'not given'}
- commit: ${(args && args.sha) || 'not given'}
- scope: 11 live routes (lobby, board, /health) and the 5 planned trade-offer operations of \`${CONTRACT}\`
- method: one finder per route group, then an independent verifier re-checked every finding against the code and the contract
- result: ${rows.length} findings raised, ${confirmed.length} confirmed, ${rejected.length} rejected, ${unverified.length} not verified

Planned operations are audited as a contract: a finding there is a gap in the specification, not in running code.

# Confirmed findings

${GROUPS.map(section).join('\n')}
${strays.length ? `## Other\n\n${strays.map((r) => `Element as reported: ${r.element}\n\n${item(r)}`).join('\n')}` : ''}
# Rejected findings

${rejected.length ? rejected.map((r) => `- ${r.id}, ${r.element}: ${r.title}\n  - claim: ${r.claim}\n  - rejected because: ${r.check.reason}`).join('\n') : 'None.'}

# Not verified

${unverified.length ? unverified.map((r) => `- ${r.id}, ${r.element}: ${r.claim} (the verifier returned no verdict)`).join('\n') : 'None.'}
${failedGroups.length ? `\n# Not audited\n\n${failedGroups.map((r) => `- ${r.group.elements.join(', ')}: the finder did not finish`).join('\n')}\n` : ''}`

phase('Report')
await agent(`Create the file docs/audit/endpoint-audit.md (create the directory if it is missing) with exactly the content between the markers below, byte for byte, without the marker lines. Do not rephrase, reorder or add anything, and touch no other file.

<<<REPORT
${report}
REPORT>>>`, { label: 'write-report', phase: 'Report', effort: 'low' })

return { file: 'docs/audit/endpoint-audit.md', agents: spawned + 1, raised: rows.length, confirmed: confirmed.length, rejected: rejected.length, unverified: unverified.length, notAudited: failedGroups.map((r) => r.group.key) }