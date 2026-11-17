# Tracker — trade-offers

> Status of every task in the epic. `implement-tasks` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.
> P1–P4 are the external prerequisites of [_epic.md](./_epic.md); a task that lists one is `blocked` until it ships.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | [Promote the staged `trade_offers` migration](./promote-trade-offers-migration.md) | migration | Kaavaal | S | — | done |
| T2 | [Promote the staged `trade_offer_properties` migration](./promote-trade-offer-properties-migration.md) | migration | Kaavaal | S | T1 | done |
| T3 | [Add the transaction helper to `src/shared/db.ts`](./add-transaction-helper.md) | infra | Kaavaal | S | — | done |
| T4 | [Hand a clock to `buildApp` and `makeTestApp`](./pass-clock-to-build-app.md) | wiring | Kaavaal | S | — | todo |
| T5 | [Model the trade offer in `src/trades/domain/offer.ts`](./model-trade-offer-domain.md) | domain | Kaavaal | M | — | todo |
| T6 | [Add the offer repository on `node:sqlite`](./add-offer-repo.md) | infra | Kaavaal | M | T2, T5 | todo |
| T7 | [Wire the `trades` module and resolve the acting player](./wire-trades-module.md) | wiring | Kaavaal | M | T4, T6, P2 | blocked |
| T8 | [Propose a trade offer: happy path and request-only refusals](./propose-offer-request-checks.md) | ports | Kaavaal | M | T7, P1, P2, P3, P4 | blocked |
| T9 | [Propose a trade offer: refusals that depend on state](./propose-offer-state-checks.md) | ports | Kaavaal | M | T8, P1, P3, P4 | blocked |
| T10 | [List incoming and outgoing trade offers](./list-incoming-and-outgoing-offers.md) | ports | Kaavaal | M | T9, P1, P2, P3, P4 | blocked |
| T11 | [Reject a trade offer](./reject-offer.md) | ports | Kaavaal | M | T9, P1, P2, P3, P4 | blocked |
| T12 | [Accept a trade offer: the exchange in one transaction](./accept-offer-exchange.md) | ports | Kaavaal | L | T3, T11, P1, P2, P3, P4 | blocked |
| T13 | [Test the quality goals: atomicity, concurrency, expiry edge, latency](./test-quality-goals.md) | tests | Kaavaal | M | T10, T12, P1, P2, P3, P4 | blocked |
| T14 | [Reconcile the contract report and the docs with the built feature](./reconcile-contract-and-docs.md) | docs | Kaavaal | M | T13 | todo |

**Total:** 14 tasks, ~6.5 person-days (S = 2 h, M = half a day, L = a day), prerequisites not counted.
