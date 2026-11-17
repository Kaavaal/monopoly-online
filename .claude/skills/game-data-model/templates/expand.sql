-- <context>. Expand, step 1 of 3. Promote as migrations/NNNN_<context>_<table>_<column>.sql with the commit in
-- which every insert and update of <table> writes <column> (for a rename: writes both columns).
-- Nullable: SQLite cannot add NOT NULL to an existing table without a default; NOT NULL comes in step 3.
-- An id from another context: plain TEXT, no REFERENCES.
ALTER TABLE <table> ADD COLUMN <column> TEXT;
