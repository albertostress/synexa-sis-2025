#!/bin/bash

echo "🔄 Atualização rápida do Docker..."

# Parar apenas o frontend
echo "⏹️  Parando frontend..."
docker-compose stop escola-frontend

# Remover container antigo
echo "🗑️  Removendo container antigo..."
docker rm escola-frontend

# Recriar e iniciar o frontend
echo "🏗️  Recriando frontend..."
docker-compose up -d --build escola-frontend

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# Verificar status
echo "✅ Status:"
docker ps | grep escola

echo ""
echo "📋 Logs do frontend:"
docker logs --tail=10 escola-frontend

echo ""
echo "✅ Frontend atualizado!"
echo "🌐 Acesse: http://localhost:3001"