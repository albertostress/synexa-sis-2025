-- Database initialization script
-- This ensures the database and user are properly created

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_user
      WHERE usename = 'escola_user') THEN
      CREATE USER escola_user WITH PASSWORD 'uma_senha_forte';
   END IF;
END
$do$;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE escola_db TO escola_user;
GRANT ALL ON SCHEMA public TO escola_user;

-- Ensure the user owns the schema
ALTER SCHEMA public OWNER TO escola_user;

-- Grant create privilege
GRANT CREATE ON SCHEMA public TO escola_user;