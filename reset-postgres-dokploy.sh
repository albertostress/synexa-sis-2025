#!/bin/bash
# Script de RESET TOTAL do PostgreSQL no Dokploy
# USE APENAS SE NADA MAIS FUNCIONAR!

echo "==================================="
echo "RESET TOTAL DO POSTGRESQL - DOKPLOY"
echo "ATENÇÃO: ISSO VAI APAGAR TODOS OS DADOS!"
echo "==================================="
echo ""

# Parar todos os containers
echo "1. Parando containers..."
docker stop synexasis2025-backend-icjmbm-postgres-1
docker stop synexasis2025-backend-icjmbm-escola-backend-1

# Remover container PostgreSQL
echo "2. Removendo container PostgreSQL..."
docker rm synexasis2025-backend-icjmbm-postgres-1

# Limpar volume de dados
echo "3. Limpando dados antigos..."
docker volume rm synexasis2025-backend-icjmbm_postgres-data 2>/dev/null
rm -rf /etc/dokploy/compose/synexasis2025-backend-icjmbm/files/postgres-data/* 2>/dev/null

# Recriar com configuração simples
echo "4. Recriando PostgreSQL com usuário postgres..."
docker run -d \
  --name synexasis2025-backend-icjmbm-postgres-1 \
  --network dokploy-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=escola_db \
  -v /etc/dokploy/compose/synexasis2025-backend-icjmbm/files/postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine

echo "5. Aguardando PostgreSQL inicializar..."
sleep 10

# Verificar
echo "6. Verificando criação..."
docker exec synexasis2025-backend-icjmbm-postgres-1 psql -U postgres -c "\l"

echo ""
echo "✅ Reset completo! Use estas credenciais no backend:"
echo "DATABASE_URL=postgresql://postgres:postgres@postgres:5432/escola_db"
echo ""
echo "Agora faça redeploy do backend no Dokploy!"