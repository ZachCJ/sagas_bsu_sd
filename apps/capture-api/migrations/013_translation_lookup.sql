-- Lookups for the list of records waiting for a translation
-- (GET /records/pending-translation).
--
-- The list asks two things of the records table: "has anything translated this
-- record?", which reads `parent->>'recordId'`, and "which records are in this
-- language, newest first?". One index for each. `if not exists` makes this safe
-- to run against a table you've already changed.

create index if not exists records_parent_record_id_idx
  on records ((parent->>'recordId'));

create index if not exists records_language_created_at_idx
  on records (language, created_at desc);
