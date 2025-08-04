#!/bin/bash

echo "🔄 Atualizando containers Docker com as últimas mudanças..."

# Parar containers existentes
echo "⏹️  Parando containers..."
docker-compose down

# Limpar volumes de node_modules antigos (opcional - descomente se necessário)
# docker volume prune -f

# Rebuild dos containers com as novas mudanças
echo "🏗️  Reconstruindo containers..."
docker-compose build --no-cache

# Iniciar os serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar os serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos containers
echo "✅ Status dos containers:"
docker-compose ps

# Mostrar logs do frontend para verificar se está rodando
echo ""
echo "📋 Logs do frontend (últimas 20 linhas):"
docker-compose logs --tail=20 escola-frontend

echo ""
echo "✅ Atualização concluída!"
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend: http://localhost:3000"
echo "📚 Swagger: http://localhost:3000/api"