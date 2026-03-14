-- Nuclear Cleanup: Drop EVERYTHING including orphaned indexes
-- THIS WILL DESTROY ALL DATA - use only as last resort

-- Drop all sequences
DO $$
DECLARE
  seq RECORD;
BEGIN
  FOR seq IN SELECT schemaname, sequencename FROM pg_sequences WHERE schemaname = 'public'
  LOOP
    EXECUTE 'DROP SEQUENCE IF EXISTS "' || seq.schemaname || '"."' || seq.sequencename || '" CASCADE';
  END LOOP;
END $$;

-- Drop all tables
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS "' || tbl.schemaname || '"."' || tbl.tablename || '" CASCADE';
  END LOOP;
END $$;

-- Drop all standalone indexes
DO $$
DECLARE
  idx RECORD;
BEGIN
  FOR idx IN SELECT schemaname, indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT LIKE 'pg_%'
  LOOP
    BEGIN
      EXECUTE 'DROP INDEX IF EXISTS "' || idx.schemaname || '"."' || idx.indexname || '" CASCADE';
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignore errors for already-dropped indexes
    END;
  END LOOP;
END $$;

-- Verify everything is gone
SELECT 'Tables remaining:' as check_type, COUNT(*)::TEXT as count FROM pg_tables WHERE schemaname = 'public';
SELECT 'Indexes remaining:' as check_type, COUNT(*)::TEXT as count FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT LIKE 'pg_%';
