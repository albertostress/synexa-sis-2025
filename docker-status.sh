#!/bin/bash

echo "📊 Status dos Containers Docker - Synexa-SIS"
echo "============================================="
echo ""

# Verificar se os containers estão rodando
echo "🔍 Containers em execução:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(escola|NAMES)"

echo ""
echo "📈 Status dos Serviços:"

# Verificar backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend (3000): Funcionando"
else
    echo "❌ Backend (3000): Não acessível"
fi

# Verificar frontend
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend (3001): Funcionando"
else
    echo "❌ Frontend (3001): Não acessível"
fi

# Verificar banco
if docker exec escola-db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL (5432): Funcionando"
else
    echo "❌ PostgreSQL (5432): Não acessível"
fi

echo ""
echo "🌐 URLs:"
echo "Frontend: http://localhost:3001"
echo "Backend: http://localhost:3000"
echo "Swagger: http://localhost:3000/api"
echo "Classes: http://localhost:3001/classes"

echo ""
echo "🔧 Comandos úteis:"
echo "Ver logs frontend: docker logs -f escola-frontend"
echo "Ver logs backend: docker logs -f escola-backend"
echo "Restart frontend: docker restart escola-frontend"