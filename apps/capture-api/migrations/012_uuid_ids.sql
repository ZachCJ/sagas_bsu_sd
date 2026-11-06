-- Ids are UUIDs the database generates, for every table.
--
-- A record's id was text, with a random UUID made in code. Now Postgres makes it.
-- Give every table you add the same kind of key:
--
--   id uuid primary key default gen_random_uuid()
--
-- A media reference is its own row with its own UUID, and it points at its record
-- with a foreign key:
--
--   record_id uuid not null references records (id) on delete cascade
--
-- A GET handler has to accept a UUID, so check any code that reads the id as a
-- number, and answer 404 for an id that isn't a UUID.
--
-- This changes a column that holds ids already. It fails if a row has an id that
-- isn't a UUID, which `db:reset` clears because those rows are test data. It also
-- fails if a foreign key points at `records.id`. If you have those, drop them in a
-- migration of your own numbered before this one, then add them back as `uuid` in
-- one numbered after it. This hasn't been run against child tables yet, so tell the
-- sponsor if it gives you trouble.

-- 1. Drop existing foreign key constraints on child tables that point to records.id
-- so that records.id type can be altered without Postgres throwing dependency errors.
ALTER TABLE IF EXISTS written_records DROP CONSTRAINT IF EXISTS written_records_record_id_fkey;
ALTER TABLE IF EXISTS image_records DROP CONSTRAINT IF EXISTS image_records_record_id_fkey;
ALTER TABLE IF EXISTS audio_records DROP CONSTRAINT IF EXISTS audio_records_record_id_fkey;
ALTER TABLE IF EXISTS video_records DROP CONSTRAINT IF EXISTS video_records_record_id_fkey;

-- 2. Alter records.id to uuid, supporting existing UUID strings or numeric IDs, and set default.
ALTER TABLE records ALTER COLUMN id TYPE uuid USING (
  CASE 
    WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid
    WHEN id::text ~ '^[0-9]+$' THEN lpad(to_hex(id::text::bigint), 32, '0')::uuid
    ELSE gen_random_uuid()
  END
);
ALTER TABLE records ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Alter child table foreign key columns (record_id) to uuid using identical mapping.
ALTER TABLE IF EXISTS written_records ALTER COLUMN record_id TYPE uuid USING (
  CASE 
    WHEN record_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN record_id::text::uuid
    WHEN record_id::text ~ '^[0-9]+$' THEN lpad(to_hex(record_id::text::bigint), 32, '0')::uuid
    ELSE gen_random_uuid()
  END
);

ALTER TABLE IF EXISTS image_records ALTER COLUMN record_id TYPE uuid USING (
  CASE 
    WHEN record_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN record_id::text::uuid
    WHEN record_id::text ~ '^[0-9]+$' THEN lpad(to_hex(record_id::text::bigint), 32, '0')::uuid
    ELSE gen_random_uuid()
  END
);

ALTER TABLE IF EXISTS audio_records ALTER COLUMN record_id TYPE uuid USING (
  CASE 
    WHEN record_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN record_id::text::uuid
    WHEN record_id::text ~ '^[0-9]+$' THEN lpad(to_hex(record_id::text::bigint), 32, '0')::uuid
    ELSE gen_random_uuid()
  END
);

ALTER TABLE IF EXISTS video_records ALTER COLUMN record_id TYPE uuid USING (
  CASE 
    WHEN record_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN record_id::text::uuid
    WHEN record_id::text ~ '^[0-9]+$' THEN lpad(to_hex(record_id::text::bigint), 32, '0')::uuid
    ELSE gen_random_uuid()
  END
);

-- 4. Re-add foreign key constraints to records(id) with ON DELETE CASCADE.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'written_records') THEN
    ALTER TABLE written_records ADD CONSTRAINT written_records_record_id_fkey FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'image_records') THEN
    ALTER TABLE image_records ADD CONSTRAINT image_records_record_id_fkey FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audio_records') THEN
    ALTER TABLE audio_records ADD CONSTRAINT audio_records_record_id_fkey FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_records') THEN
    ALTER TABLE video_records ADD CONSTRAINT video_records_record_id_fkey FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Update media child tables (e.g. image_records.id from 002_mediaRef.sql) to uuid primary keys.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'image_records' AND column_name = 'id') THEN
    ALTER TABLE image_records ALTER COLUMN id TYPE uuid USING (
      CASE 
        WHEN id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid
        WHEN id::text ~ '^[0-9]+$' THEN lpad(to_hex(id::text::bigint), 32, '0')::uuid
        ELSE gen_random_uuid()
      END
    );
    ALTER TABLE image_records ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;
