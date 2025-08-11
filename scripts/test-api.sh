#!/bin/bash

# Script para testar conexão com a API

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Testando Conexão com a API${NC}"
echo "================================"

# URLs para testar
URLS=(
    "http://localhost:3000"
    "http://localhost:3001"
    "https://api.escola.yourdomain.com"
)

# Adicionar URL customizada se fornecida
if [ ! -z "$1" ]; then
    URLS+=("$1")
fi

for URL in "${URLS[@]}"; do
    echo -e "\n${YELLOW}Testando: $URL${NC}"
    
    # Test health endpoint
    echo -n "  Health check: "
    if curl -s -f -o /dev/null "$URL/health" 2>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        
        # Test auth/login with OPTIONS (CORS preflight)
        echo -n "  CORS preflight: "
        CORS_RESPONSE=$(curl -s -X OPTIONS "$URL/auth/login" \
            -H "Origin: http://localhost:3001" \
            -H "Access-Control-Request-Method: POST" \
            -H "Access-Control-Request-Headers: Content-Type" \
            -I 2>/dev/null | head -n 1)
        
        if echo "$CORS_RESPONSE" | grep -q "200\|204"; then
            echo -e "${GREEN}✅ OK${NC}"
        else
            echo -e "${RED}❌ Failed${NC}"
            echo "    Response: $CORS_RESPONSE"
        fi
        
        # Test auth/login POST
        echo -n "  POST /auth/login: "
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "$URL/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@test.com","password":"test"}' 2>/dev/null)
        
        if [ "$HTTP_CODE" = "401" ]; then
            echo -e "${GREEN}✅ OK (401 expected for invalid credentials)${NC}"
        elif [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ OK (Login successful)${NC}"
        elif [ "$HTTP_CODE" = "405" ]; then
            echo -e "${RED}❌ Method Not Allowed${NC}"
        elif [ "$HTTP_CODE" = "404" ]; then
            echo -e "${RED}❌ Endpoint not found${NC}"
        else
            echo -e "${YELLOW}⚠️  HTTP $HTTP_CODE${NC}"
        fi
        
        # Test Swagger docs
        echo -n "  API Docs: "
        if curl -s -f -o /dev/null "$URL/api" 2>/dev/null; then
            echo -e "${GREEN}✅ Available at $URL/api${NC}"
        else
            echo -e "${YELLOW}⚠️  Not available${NC}"
        fi
        
    else
        echo -e "${RED}❌ API not responding${NC}"
    fi
done

echo -e "\n${BLUE}Docker Containers Status:${NC}"
echo "================================"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|backend|frontend|postgres|redis" || echo "No containers found"

echo -e "\n${BLUE}Checking Frontend Environment:${NC}"
echo "================================"
if [ -f "/mnt/d/Projecto/Synexa-SIS-2025/escola-frontend/.env" ]; then
    echo "Frontend .env:"
    grep -E "VITE_API" /mnt/d/Projecto/Synexa-SIS-2025/escola-frontend/.env || echo "No VITE_API variables found"
else
    echo "No .env file found"
fi

echo -e "\n${YELLOW}💡 Se você está vendo erro 405:${NC}"
echo "1. Verifique se a API está rodando no endereço correto"
echo "2. Verifique se VITE_API_URL está configurado corretamente"
echo "3. No Dokploy, use: https://api.seudominio.com"
echo "4. Localmente, use: http://localhost:3000"