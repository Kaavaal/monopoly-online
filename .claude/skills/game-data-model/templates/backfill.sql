-- <context>. Backfill, step 2 of 3. Promote as migrations/NNNN_<context>_<table>_<column>_backfill.sql, no code.
-- Fills every row the expand step left empty. See backfill-<column>.md.
UPDATE <table>
SET <column> = <value or expression, e.g. the bootstrap id or the old column>
WHERE <column> IS NULL;
