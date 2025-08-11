#!/bin/bash

# Script de emergência para corrigir build do backend

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Corrigindo Build do Backend${NC}"
echo "================================"

# Detectar container
BACKEND_CONTAINER=$(docker ps -a --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Container backend não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container encontrado: $BACKEND_CONTAINER${NC}"

# Opção 1: Tentar compilar dentro do container existente
echo -e "${YELLOW}Tentando compilar dentro do container...${NC}"

docker exec $BACKEND_CONTAINER sh -c "
  echo 'Verificando arquivos...'
  ls -la
  
  echo 'Instalando dependências...'
  npm install
  
  echo 'Gerando Prisma Client...'
  npx prisma generate
  
  echo 'Compilando aplicação...'
  npm run build || npx nest build
  
  echo 'Verificando dist...'
  ls -la dist/
  
  echo 'Reiniciando aplicação...'
  pkill node || true
  node dist/main &
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build corrigido com sucesso!${NC}"
else
    echo -e "${YELLOW}⚠️  Tentando método alternativo...${NC}"
    
    # Opção 2: Usar npm start ao invés de node dist/main
    docker exec $BACKEND_CONTAINER sh -c "
      npm start || npm run start:prod || npx nest start
    "
fi

# Verificar se está funcionando
sleep 5
echo -e "${YELLOW}Verificando saúde da API...${NC}"

if curl -s -f -o /dev/null "http://localhost:3000/health"; then
    echo -e "${GREEN}✅ Backend está funcionando!${NC}"
else
    echo -e "${RED}❌ Backend ainda não responde${NC}"
    echo -e "${YELLOW}Verifique os logs:${NC}"
    echo "docker logs $BACKEND_CONTAINER --tail 50"
fi