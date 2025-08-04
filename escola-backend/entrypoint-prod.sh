#!/bin/sh
set -e

echo "🚀 Iniciando Escola Backend..."
echo "📊 Modo: $NODE_ENV"

# Aguardar banco de dados
echo "⏳ Aguardando banco de dados..."
until nc -z escola-db 5432; do
  echo "Banco não disponível ainda, aguardando..."
  sleep 2
done

echo "✅ Banco de dados conectado!"

# Executar migrations
echo "🔄 Executando migrations..."
npx prisma migrate deploy

# Verificar se Prisma Client foi gerado
echo "🔧 Verificando Prisma Client..."
npx prisma generate

echo "🎯 Iniciando aplicação..."
exec node dist/src/main