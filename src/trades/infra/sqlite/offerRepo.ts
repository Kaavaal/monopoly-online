// OfferRepository on node:sqlite. Columns are snake_case; rows map to the camelCase domain type.
import { type Db, transaction } from '../../../shared/db.js';
import type { OfferRepository, OfferState, TradeOffer } from '../../domain/offer.js';

export function createOfferRepo(db: Db): OfferRepository {
  const insertOffer = db.prepare(
    'INSERT INTO trade_offers (id, proposer_id, recipient_id, proposer_money, recipient_money, state, note, expires_at, created_at) VALUES (:id, :proposerId, :recipientId, :proposerMoney, :recipientMoney, :state, :note, :expiresAt, :createdAt)',
  );
  const insertDeed = db.prepare(
    'INSERT INTO trade_offer_properties (offer_id, property_id, giver_id) VALUES (:offerId, :propertyId, :giverId)',
  );
  const byId = db.prepare('SELECT * FROM trade_offers WHERE id = ?');
  const openByProposer = db.prepare(
    "SELECT * FROM trade_offers WHERE proposer_id = :proposerId AND state = 'pending' AND expires_at > :now ORDER BY created_at, id",
  );
  const pendingForRecipient = db.prepare(
    "SELECT * FROM trade_offers WHERE recipient_id = :recipientId AND state = 'pending' AND expires_at > :now ORDER BY created_at, id",
  );
  const allByProposer = db.prepare('SELECT * FROM trade_offers WHERE proposer_id = ? ORDER BY created_at, id');
  const updateState = db.prepare('UPDATE trade_offers SET state = :state WHERE id = :id');
  const deedsOf = db.prepare('SELECT property_id, giver_id FROM trade_offer_properties WHERE offer_id = ? ORDER BY property_id');

  function toOffer(row: Record<string, unknown>): TradeOffer {
    const proposerId = String(row.proposer_id);
    const deeds = deedsOf.all(String(row.id));
    const givenBy = (giverId: string): string[] =>
      deeds.filter((d) => String(d.giver_id) === giverId).map((d) => String(d.property_id));
    return {
      id: String(row.id),
      proposerId,
      recipientId: String(row.recipient_id),
      proposerGives: { propertyIds: givenBy(proposerId), money: Number(row.proposer_money) },
      recipientGives: { propertyIds: givenBy(String(row.recipient_id)), money: Number(row.recipient_money) },
      state: String(row.state) as OfferState,
      note: row.note === null ? null : String(row.note),
      expiresAt: String(row.expires_at),
      createdAt: String(row.created_at),
    };
  }

  return {
    insert(offer) {
      transaction(db, () => {
        insertOffer.run({
          id: offer.id,
          proposerId: offer.proposerId,
          recipientId: offer.recipientId,
          proposerMoney: offer.proposerGives.money,
          recipientMoney: offer.recipientGives.money,
          state: offer.state,
          note: offer.note,
          expiresAt: offer.expiresAt,
          createdAt: offer.createdAt,
        });
        for (const propertyId of offer.proposerGives.propertyIds) {
          insertDeed.run({ offerId: offer.id, propertyId, giverId: offer.proposerId });
        }
        for (const propertyId of offer.recipientGives.propertyIds) {
          insertDeed.run({ offerId: offer.id, propertyId, giverId: offer.recipientId });
        }
      });
    },
    findById(id) {
      const row = byId.get(id);
      return row && toOffer(row);
    },
    findOpenByProposer(proposerId, now) {
      const row = openByProposer.get({ proposerId, now });
      return row && toOffer(row);
    },
    listPendingForRecipient(recipientId, now) {
      return pendingForRecipient.all({ recipientId, now }).map(toOffer);
    },
    listByProposer(proposerId) {
      return allByProposer.all(proposerId).map(toOffer);
    },
    setState(id, state) {
      updateState.run({ id, state });
    },
  };
}
