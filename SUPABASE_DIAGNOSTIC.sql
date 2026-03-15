-- Diagnostic: Check what actually exists in the database
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';

-- List all indexes
SELECT schemaname, indexname FROM pg_indexes WHERE schemaname = 'public';
