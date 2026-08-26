-- Create test user and database for Dashy test isolation.
-- Runs automatically on first PostgreSQL container start.
-- Idempotent: safe to re-run without errors.
-- See: https://hub.docker.com/_/postgres (Initialization scripts)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dashy_test') THEN
        CREATE USER dashy_test WITH PASSWORD 'test_password';
    END IF;
END
$$;

SELECT 'CREATE DATABASE dashy_test OWNER dashy_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dashy_test')\gexec

GRANT ALL ON SCHEMA public TO dashy_test;
