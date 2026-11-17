<!-- Copied to docs/features/<slug>/game-contracts/events.md only when a game-sad.md §6 flow has an
     asynchronous participant. The app has no broker today: an event is an in-process call after the
     transaction commits, unless the SAD says otherwise. Delete the file when every flow is synchronous. -->

# Events — <feature>

## `<context>.<fact_in_past_tense>.v1`

- **Origin:** game-sad.md §6 `<flow>`, message `<message text>`.
- **Producer:** `<context>` service, after the transaction that makes the fact true commits.
- **Consumers:** `<context>` through its `<Ctx>Api`.
- **Delivery:** <in-process, at most once | what the SAD says>.
- **On consumer failure:** <logged and dropped | retried N times | what the SAD says>.

```json
{
  "eventId": "<uuid>",
  "type": "<context>.<fact_in_past_tense>",
  "version": 1,
  "occurredAt": "<ISO 8601 UTC>",
  "data": {
    "<field>": "<type, origin: game-data-model.md column>"
  }
}
```

A new optional field keeps the version; a removed or renamed field is `v2`. Consumers ignore unknown fields.
