-- lobby. Promote as migrations/NNNN_lobby_bootstrap_room.sql.
-- The one bootstrap room: every title deed that exists before rooms is moved into it.
INSERT INTO rooms (id, created_at)
VALUES ('00000000-0000-7000-8000-000000000001', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT DO NOTHING;
