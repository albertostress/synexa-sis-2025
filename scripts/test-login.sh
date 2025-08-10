#!/bin/bash

# Script para testar login no Synexa-SIS

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Teste de Login - Synexa-SIS${NC}"
echo "======================================"

# Solicitar credenciais
read -p "Email: " EMAIL
read -s -p "Senha: " PASSWORD
echo ""
echo ""

# URL da API (ajustar conforme necessário)
API_URL="http://localhost:3000"
read -p "URL da API [$API_URL]: " input
API_URL=${input:-$API_URL}

echo -e "${YELLOW}Testando login em: $API_URL/auth/login${NC}"
echo ""

# Fazer requisição de login
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -w "\n{\"http_code\":%{http_code}}")

# Extrair código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1 | grep -o '"http_code":[0-9]*' | cut -d: -f2)
BODY=$(echo "$RESPONSE" | head -n -1)

# Analisar resposta
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Login bem-sucedido!${NC}"
    echo ""
    echo -e "${YELLOW}Token recebido:${NC}"
    echo "$BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
    echo ""
    echo -e "${YELLOW}Informações do usuário:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ Login falhou: Credenciais inválidas${NC}"
    echo ""
    echo -e "${YELLOW}Resposta do servidor:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo -e "${YELLOW}Possíveis causas:${NC}"
    echo "1. Email ou senha incorretos"
    echo "2. Usuário não existe"
    echo "3. Usuário está inativo"
    echo ""
    echo -e "${YELLOW}Tente criar/resetar o admin com:${NC}"
    echo -e "${GREEN}./scripts/create-admin.sh${NC}"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}❌ Endpoint não encontrado${NC}"
    echo "Verifique se a API está rodando corretamente"
elif [ -z "$HTTP_CODE" ]; then
    echo -e "${RED}❌ Não foi possível conectar à API${NC}"
    echo "Verifique se o backend está rodando:"
    echo -e "${YELLOW}docker ps | grep backend${NC}"
else
    echo -e "${RED}❌ Erro inesperado: HTTP $HTTP_CODE${NC}"
    echo "$BODY"
fi

echo ""
echo -e "${BLUE}Diagnóstico adicional:${NC}"
echo "======================================"

# Verificar se o backend está rodando
echo -e "${YELLOW}1. Verificando containers...${NC}"
if docker ps | grep -q "escola-backend"; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
    BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)
else
    echo -e "${RED}❌ Backend não está rodando${NC}"
fi

# Verificar saúde da API
echo ""
echo -e "${YELLOW}2. Verificando saúde da API...${NC}"
if curl -s -f -o /dev/null "$API_URL/health"; then
    echo -e "${GREEN}✅ API está saudável${NC}"
else
    echo -e "${RED}❌ API não está respondendo${NC}"
fi

# Verificar banco de dados
echo ""
echo -e "${YELLOW}3. Verificando usuários no banco...${NC}"
if [ ! -z "$BACKEND_CONTAINER" ]; then
    docker exec $BACKEND_CONTAINER node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkUsers() {
        const users = await prisma.user.findMany({
            select: { email: true, role: true, isActive: true }
        });
        console.log('Usuários encontrados:', users.length);
        users.forEach(u => {
            console.log(\`  - \${u.email} (\${u.role}) - Ativo: \${u.isActive}\`);
        });
        await prisma.\$disconnect();
    }
    
    checkUsers().catch(console.error);
    " 2>/dev/null
fi

echo ""
echo -e "${BLUE}======================================"
echo -e "Para criar um admin, execute:"
echo -e "${GREEN}./scripts/create-admin.sh${NC}"
echo -e "${BLUE}======================================${NC}"