#!/bin/bash

# Script de verificação de saúde do Synexa-SIS
# Executa testes para garantir que tudo está funcionando

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Verificando saúde do Synexa-SIS..."
echo "======================================"

# Variáveis
FRONTEND_URL=${FRONTEND_DOMAIN:-"escola.seudominio.com"}
BACKEND_URL=${BACKEND_DOMAIN:-"api.escola.seudominio.com"}
ERRORS=0

# Função para testar endpoint
test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✅ $name: OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FALHOU${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# 1. Verificar containers
echo -e "\n${YELLOW}1. Verificando containers...${NC}"
containers=("postgres" "redis" "escola-backend" "escola-frontend" "playwright-service")

for container in "${containers[@]}"; do
    if docker ps | grep -q "$container"; then
        echo -e "${GREEN}✅ $container: Rodando${NC}"
    else
        echo -e "${RED}❌ $container: Parado${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 2. Verificar conectividade
echo -e "\n${YELLOW}2. Verificando conectividade...${NC}"

# Backend health
test_endpoint "http://localhost:3000/health" "Backend (local)"
test_endpoint "https://$BACKEND_URL/health" "Backend (público)"

# Frontend
test_endpoint "http://localhost:3001" "Frontend (local)"
test_endpoint "https://$FRONTEND_URL" "Frontend (público)"

# API Docs
test_endpoint "https://$BACKEND_URL/api" "API Documentation"

# 3. Verificar banco de dados
echo -e "\n${YELLOW}3. Verificando banco de dados...${NC}"

POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
if [ ! -z "$POSTGRES_CONTAINER" ]; then
    if docker exec $POSTGRES_CONTAINER psql -U ${DB_USER:-user} -d ${DB_NAME:-escola_db} -c "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL: Conectado${NC}"
        
        # Contar registros
        USER_COUNT=$(docker exec $POSTGRES_CONTAINER psql -U ${DB_USER:-user} -d ${DB_NAME:-escola_db} -t -c "SELECT COUNT(*) FROM users" 2>/dev/null | tr -d ' ')
        STUDENT_COUNT=$(docker exec $POSTGRES_CONTAINER psql -U ${DB_USER:-user} -d ${DB_NAME:-escola_db} -t -c "SELECT COUNT(*) FROM students" 2>/dev/null | tr -d ' ')
        CLASS_COUNT=$(docker exec $POSTGRES_CONTAINER psql -U ${DB_USER:-user} -d ${DB_NAME:-escola_db} -t -c "SELECT COUNT(*) FROM school_classes" 2>/dev/null | tr -d ' ')
        
        echo -e "${GREEN}  → Usuários: $USER_COUNT${NC}"
        echo -e "${GREEN}  → Alunos: $STUDENT_COUNT${NC}"
        echo -e "${GREEN}  → Turmas: $CLASS_COUNT${NC}"
    else
        echo -e "${RED}❌ PostgreSQL: Erro de conexão${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ PostgreSQL: Container não encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar Redis
echo -e "\n${YELLOW}4. Verificando cache Redis...${NC}"

REDIS_CONTAINER=$(docker ps --format "table {{.Names}}" | grep redis | head -n1)
if [ ! -z "$REDIS_CONTAINER" ]; then
    if docker exec $REDIS_CONTAINER redis-cli ping &>/dev/null; then
        echo -e "${GREEN}✅ Redis: Respondendo${NC}"
    else
        echo -e "${RED}❌ Redis: Não responde${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Redis: Container não encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verificar SSL/HTTPS
echo -e "\n${YELLOW}5. Verificando certificados SSL...${NC}"

check_ssl() {
    local domain=$1
    if echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✅ SSL $domain: Válido${NC}"
    else
        echo -e "${YELLOW}⚠️  SSL $domain: Verificar certificado${NC}"
    fi
}

check_ssl "$FRONTEND_URL"
check_ssl "$BACKEND_URL"

# 6. Verificar espaço em disco
echo -e "\n${YELLOW}6. Verificando espaço em disco...${NC}"

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${GREEN}✅ Espaço em disco: ${DISK_USAGE}% usado${NC}"
elif [ $DISK_USAGE -lt 90 ]; then
    echo -e "${YELLOW}⚠️  Espaço em disco: ${DISK_USAGE}% usado (atenção)${NC}"
else
    echo -e "${RED}❌ Espaço em disco: ${DISK_USAGE}% usado (crítico)${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 7. Verificar memória
echo -e "\n${YELLOW}7. Verificando memória...${NC}"

MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ $MEM_USAGE -lt 80 ]; then
    echo -e "${GREEN}✅ Memória: ${MEM_USAGE}% usado${NC}"
elif [ $MEM_USAGE -lt 90 ]; then
    echo -e "${YELLOW}⚠️  Memória: ${MEM_USAGE}% usado (atenção)${NC}"
else
    echo -e "${RED}❌ Memória: ${MEM_USAGE}% usado (crítico)${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 8. Verificar logs de erro recentes
echo -e "\n${YELLOW}8. Verificando logs de erro (últimos 5 min)...${NC}"

BACKEND_ERRORS=$(docker logs synexa-sis_escola-backend_1 --since 5m 2>&1 | grep -c "ERROR\|Error\|error" || true)
if [ $BACKEND_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Backend: Sem erros recentes${NC}"
else
    echo -e "${YELLOW}⚠️  Backend: $BACKEND_ERRORS erros nos últimos 5 min${NC}"
fi

# Resultado final
echo -e "\n======================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA SAUDÁVEL - Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${RED}❌ PROBLEMAS DETECTADOS - $ERRORS testes falharam${NC}"
    echo -e "${YELLOW}Execute 'docker-compose -f docker-compose.dokploy.yml logs' para mais detalhes${NC}"
    exit 1
fi