-- Script de inicialização do PostgreSQL para Dokploy
-- Este script garante que o usuário e banco existem

-- Criar usuário se não existir
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_user
      WHERE usename = 'escola_user') THEN
      
      CREATE USER escola_user WITH PASSWORD 'escola_password_2025';
   END IF;
END
$do$;

-- Dar permissões ao usuário
ALTER USER escola_user CREATEDB;
ALTER USER escola_user WITH SUPERUSER;

-- Criar banco se não existir
SELECT 'CREATE DATABASE escola_db OWNER escola_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'escola_db')\gexec

-- Garantir permissões
GRANT ALL PRIVILEGES ON DATABASE escola_db TO escola_user;

-- Conectar ao banco escola_db
\c escola_db;

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Dar permissões no schema
GRANT ALL ON SCHEMA public TO escola_user;
GRANT CREATE ON SCHEMA public TO escola_user;