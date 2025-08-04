#!/bin/bash
# Script para builds Docker otimizados

echo "🚀 Build Docker Otimizado - Synexa SIS"
echo "======================================"

# Ativar BuildKit para builds mais rápidos
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Função para medir tempo
time_start=$(date +%s)

# Build com cache
echo "📦 Building com cache otimizado..."

if [ "$1" = "frontend" ]; then
    echo "🎨 Building apenas Frontend..."
    docker-compose build escola-frontend
elif [ "$1" = "backend" ]; then
    echo "🔧 Building apenas Backend..."
    docker-compose build escola-backend
else
    echo "🏗️ Building Frontend e Backend..."
    docker-compose build --parallel
fi

# Calcular tempo total
time_end=$(date +%s)
time_diff=$((time_end - time_start))
echo ""
echo "✅ Build completo em ${time_diff} segundos!"

# Opcional: limpar imagens antigas
if [ "$2" = "--clean" ]; then
    echo "🧹 Limpando imagens antigas..."
    docker image prune -f
fi