-- <context>. Contract, step 3 of 3. Promote as migrations/NNNN_<context>_<table>_<column>_not_null.sql
-- with the commit that <what the code now always writes>.
-- SQLite cannot change a column, so the table is rebuilt. Columns, constraints and indexes are copied from
-- `schema.ts --sql`; only <column> changes. The runner already wraps this file in a transaction.
-- If a table of the same context references <table>, add `PRAGMA defer_foreign_keys = ON;` first.
CREATE TABLE <table>_new (
  -- every live column, verbatim, CHECKs included
  <column> TEXT NOT NULL
);
INSERT INTO <table>_new (<columns>, <column>)
SELECT <columns>, <column>
FROM <table>;
DROP TABLE <table>;
ALTER TABLE <table>_new RENAME TO <table>;
-- every live index of <table>, verbatim
CREATE UNIQUE INDEX IF NOT EXISTS <index> ON <table> (<columns>);
