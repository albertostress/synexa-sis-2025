#!/bin/bash

# Script de emergência para corrigir URL da API no frontend

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Corrigindo URL da API no Frontend${NC}"
echo "======================================"

# Perguntar a URL da API
echo -e "${YELLOW}Qual é a URL da sua API?${NC}"
echo "Exemplos:"
echo "  - https://api.kiandaedge.online"
echo "  - https://api.escola.com"
echo ""
read -p "URL da API: " API_URL

if [ -z "$API_URL" ]; then
    echo -e "${RED}❌ URL não pode estar vazia${NC}"
    exit 1
fi

# Verificar se a API está respondendo
echo -e "${YELLOW}Verificando se a API está acessível...${NC}"
if curl -s -f -o /dev/null "$API_URL/health"; then
    echo -e "${GREEN}✅ API está respondendo${NC}"
else
    echo -e "${RED}⚠️  API não está respondendo em $API_URL/health${NC}"
    read -p "Deseja continuar mesmo assim? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Método 1: Recriar o frontend com a URL correta
echo -e "${YELLOW}Método 1: Rebuild com variável correta${NC}"
echo "========================================="

# Criar arquivo .env.production
echo "VITE_API_URL=$API_URL" > escola-frontend/.env.production
echo -e "${GREEN}✅ Criado .env.production com VITE_API_URL=$API_URL${NC}"

# Rebuild do container
echo -e "${YELLOW}Rebuilding frontend...${NC}"
docker-compose -f docker-compose.dokploy.yml build --no-cache escola-frontend
docker-compose -f docker-compose.dokploy.yml up -d escola-frontend

echo ""
echo -e "${GREEN}✅ Frontend reconstruído com API URL: $API_URL${NC}"
echo ""
echo -e "${BLUE}Como verificar se funcionou:${NC}"
echo "1. Abra o browser em modo incógnito"
echo "2. Acesse seu site"
echo "3. Abra DevTools (F12) → Network"
echo "4. Tente fazer login"
echo "5. A requisição deve ir para: $API_URL/auth/login"
echo ""
echo -e "${YELLOW}Se ainda não funcionar, tente:${NC}"
echo "1. Limpar cache do browser (CTRL+SHIFT+R)"
echo "2. Usar modo incógnito"
echo "3. Aguardar 5 minutos para propagação"