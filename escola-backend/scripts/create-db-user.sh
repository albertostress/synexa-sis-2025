#!/bin/bash
# Script para criar usuário e banco no PostgreSQL do Dokploy

echo "=== Script de criação de usuário e banco de dados ==="
echo "Este script deve ser executado após o deploy no Dokploy"
echo ""
echo "Execute os seguintes comandos no terminal do Dokploy:"
echo ""
echo "1. Acesse o container do PostgreSQL:"
echo "   docker exec -it synexasis2025-backend-icjmbm-postgres-1 bash"
echo ""
echo "2. Entre no PostgreSQL como superusuário:"
echo "   psql -U postgres"
echo ""
echo "3. Execute estes comandos SQL:"
echo ""
cat << 'EOF'
-- Criar o banco de dados se não existir
CREATE DATABASE escola_db;

-- Conectar ao banco
\c escola_db;

-- Garantir que o usuário postgres tem todas as permissões
GRANT ALL PRIVILEGES ON DATABASE escola_db TO postgres;

-- Criar schema public se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Dar permissões no schema
GRANT ALL ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;

-- Verificar se funcionou
\l
\du

-- Sair
\q
EOF

echo ""
echo "4. Após executar os comandos SQL, faça redeploy do backend no Dokploy"