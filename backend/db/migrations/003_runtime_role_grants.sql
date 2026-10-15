-- Migration 003: Runtime Role Grants & Default Privileges
-- Grants permissions to deeksha_app runtime role if present (e.g. in Docker Compose / self-hosted environments).
-- In managed cloud databases (AWS RDS, Supabase, Render), migrations run under the connection role.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'deeksha_app') THEN
    BEGIN
      GRANT CONNECT ON DATABASE deeksha TO deeksha_app;
    EXCEPTION WHEN invalid_catalog_name OR undefined_object THEN
      NULL;
    END;

    GRANT USAGE ON SCHEMA public TO deeksha_app;
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO deeksha_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO deeksha_app;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_public_profiles') THEN
      GRANT EXECUTE ON FUNCTION search_public_profiles(text,integer) TO deeksha_app;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_permission') THEN
      GRANT EXECUTE ON FUNCTION has_permission(uuid,text,text,uuid) TO deeksha_app;
    END IF;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO deeksha_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO deeksha_app;
  END IF;
END $$;
