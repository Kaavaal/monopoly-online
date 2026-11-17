# Tracker — trade-offers

> One row per task. Take the first `todo` row whose `Deps` are all `done` and whose `Needs` have shipped.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Wave | Estimate | Deps | Needs | Status |
|---|---|---|---|---|---|---|
| T1 | [Let the refusal factories carry a dotted code](./carry-dotted-refusal-code.md) | 1 | S | — | — | todo |
| T2 | [Add the transaction helper an exchange runs in](./add-transaction-helper.md) | 1 | S | — | — | todo |
| T3 | [Wire an empty trades context last in the composition root](./wire-trades-context.md) | 1 | S | — | — | todo |
| T4 | [Promote the trade_offers migration](./promote-trade-offers-migration.md) | 1 | S | — | P1, P3 | blocked |
| T5 | [Promote the trade_offer_properties migration](./promote-trade-offer-properties-migration.md) | 2 | S | T4 | P1, P3 | blocked |
| T6 | [Model the trade offer, its states and what makes it a trade](./model-trade-offer.md) | 2 | M | T1 | — | todo |
| T7 | [Store and read trade offers](./store-trade-offers.md) | 3 | M | T5, T6 | — | todo |
| T8 | [Propose a trade offer: a pending offer, and requests that are not a trade](./propose-offer-request-checks.md) | 4 | L | T3, T7 | P1, P2, P3, P4 | blocked |
| T9 | [Propose a trade offer: not yours to give, and one pending offer per proposer](./propose-offer-state-checks.md) | 5 | M | T8 | P2, P3 | blocked |
| T10 | [List my trade offers as a recipient and as a proposer](./list-my-trade-offers.md) | 5 | M | T8 | P4 | blocked |
| T11 | [Reject a trade offer, and refuse an answer that cannot be given](./reject-trade-offer.md) | 5 | M | T8 | P4 | blocked |
| T12 | [Accept a trade offer: the exchange, in full or not at all](./accept-trade-offer.md) | 6 | L | T2, T11 | P1, P2, P3, P4 | blocked |
| T13 | [Prove one winner of two acceptances, and the speed targets](./prove-one-winner-and-speed.md) | 7 | M | T10, T12 | P2, P3 | blocked |
| T14 | [Reconcile the contract and the docs with the built routes](./reconcile-contract-and-docs.md) | 7 | S | T9, T10, T12 | — | todo |

**Total:** 14 tasks in 7 waves, ~6.5 days (S = 2 h, M = half a day, L = a day), prerequisites not counted.
