#!/bin/bash
# Script para forçar criação de usuário no Dokploy

echo "=== FORÇAR CRIAÇÃO DE USUÁRIO NO POSTGRESQL ==="
echo ""
echo "Este script tenta todas as formas possíveis de criar o usuário"
echo ""

# Nome do container (ajuste se necessário)
CONTAINER="synexasis2025-backend-icjmbm-postgres-1"

echo "1. Tentando com postgres..."
docker exec -it $CONTAINER psql -U postgres -c "CREATE USER escola_user WITH PASSWORD 'escola_password_2025' SUPERUSER CREATEDB;" 2>/dev/null

echo "2. Tentando criar banco..."
docker exec -it $CONTAINER psql -U postgres -c "CREATE DATABASE escola_db OWNER escola_user;" 2>/dev/null

echo "3. Tentando com escola_user..."
docker exec -it $CONTAINER psql -U escola_user -d escola_db -c "SELECT 1;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Usuário escola_user existe e funciona!"
else
    echo "❌ Ainda com problemas. Tentando método alternativo..."
    
    # Método alternativo - criar via SQL direto
    docker exec -it $CONTAINER sh -c "echo \"CREATE USER escola_user WITH PASSWORD 'escola_password_2025' SUPERUSER;\" | psql -U postgres" 2>/dev/null
    docker exec -it $CONTAINER sh -c "echo \"CREATE DATABASE escola_db OWNER escola_user;\" | psql -U postgres" 2>/dev/null
fi

echo ""
echo "4. Verificando resultado..."
docker exec -it $CONTAINER psql -U postgres -c "\du"
docker exec -it $CONTAINER psql -U postgres -c "\l"

echo ""
echo "✅ Script concluído. Faça redeploy do backend no Dokploy!"