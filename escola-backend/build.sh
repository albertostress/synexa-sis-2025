#!/bin/sh
# Script de build robusto para o backend

echo "=== Iniciando processo de build ==="

# Limpar build anterior
echo "Limpando build anterior..."
rm -rf dist

# Verificar se tsconfig existe
if [ ! -f tsconfig.json ]; then
  echo "ERRO: tsconfig.json não encontrado!"
  exit 1
fi

# Tentar build com nest
echo "Tentando build com Nest CLI..."
npx nest build

# Verificar se funcionou
if [ -f dist/main.js ]; then
  echo "✅ Build com Nest CLI bem-sucedido!"
  exit 0
fi

# Se falhou, tentar com tsc direto
echo "Nest CLI falhou, tentando com tsc..."
npx tsc

# Verificar novamente
if [ -f dist/main.js ]; then
  echo "✅ Build com tsc bem-sucedido!"
  exit 0
fi

# Se ainda falhou, compilar arquivo por arquivo
echo "Build completo falhou, tentando compilação manual..."
mkdir -p dist
npx tsc --skipLibCheck --module commonjs --target ES2021 --outDir dist src/main.ts

if [ -f dist/main.js ]; then
  echo "✅ Build manual bem-sucedido!"
  exit 0
fi

echo "❌ ERRO: Não foi possível compilar o projeto!"
exit 1