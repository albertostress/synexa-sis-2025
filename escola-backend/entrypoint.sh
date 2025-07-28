#!/bin/sh
set -e

echo "🚀 Iniciando backend NestJS em modo desenvolvimento..."

# Verificar se o Prisma client foi gerado
if [ ! -d "node_modules/.prisma/client" ]; then
  echo "🔧 Gerando cliente Prisma..."
  npx prisma generate
else
  echo "✅ Cliente Prisma já existe"
fi

# Verificar se existem migrations pendentes (apenas aviso)
echo "📋 Verificando status das migrations..."
npx prisma migrate status || echo "⚠️ Aviso: Pode haver migrations pendentes"

echo "🔥 Iniciando servidor com hot reload..."
echo "📁 Monitorando alterações em: /app/src"

# Executar comando passado como argumento
exec "$@"