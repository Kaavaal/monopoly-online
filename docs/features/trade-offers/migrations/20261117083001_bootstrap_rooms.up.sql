-- lobby. Promote as migrations/NNNN_lobby_bootstrap_room.sql.
-- The one bootstrap room: every title deed that exists before rooms is moved into it.
-- Fixed created_at, like the id: a re-run writes the same row.
INSERT INTO rooms (id, created_at)
VALUES ('00000000-0000-7000-8000-000000000001', '2026-11-17T00:00:00.000Z')
ON CONFLICT DO NOTHING;
