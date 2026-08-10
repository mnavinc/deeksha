-- Run as the database/schema owner (normally postgres or the migration role).
-- deeksha_app is the runtime API role used by DATABASE_URL; it is not a migration/admin role.
GRANT CONNECT ON DATABASE deeksha TO deeksha_app;
GRANT USAGE ON SCHEMA public TO deeksha_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO deeksha_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO deeksha_app;
GRANT EXECUTE ON FUNCTION search_public_profiles(text,integer) TO deeksha_app;
GRANT EXECUTE ON FUNCTION has_permission(uuid,text,text,uuid) TO deeksha_app;

-- Keeps new application tables and sequences usable when future migrations are
-- applied by the same schema owner that runs this statement.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO deeksha_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO deeksha_app;
