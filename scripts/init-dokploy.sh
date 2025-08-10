#!/bin/bash

echo "🚀 Iniciando setup do Synexa-SIS no Dokploy..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detectar nome do container backend
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)
POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "postgres|database" | head -n1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}✗ Container backend não encontrado. Certifique-se que o deploy está rodando.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container backend encontrado: $BACKEND_CONTAINER${NC}"
echo -e "${GREEN}✓ Container postgres encontrado: $POSTGRES_CONTAINER${NC}"

# Função para aguardar serviço
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Aguardando $service iniciar...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $BACKEND_CONTAINER curl -f http://localhost:3000/health &>/dev/null; then
            echo -e "${GREEN}✓ $service está pronto!${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ Timeout aguardando $service${NC}"
    return 1
}

# Aguardar postgres
echo -e "${YELLOW}Aguardando PostgreSQL...${NC}"
sleep 10

# Executar migrations
echo -e "${YELLOW}Executando migrations...${NC}"
docker exec $BACKEND_CONTAINER npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations executadas com sucesso!${NC}"
else
    echo -e "${RED}✗ Erro ao executar migrations${NC}"
    exit 1
fi

# Seed inicial (opcional)
read -p "Deseja executar o seed inicial? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Executando seed...${NC}"
    docker exec $BACKEND_CONTAINER npx prisma db seed
    echo -e "${GREEN}✓ Seed executado!${NC}"
fi

# Criar usuário admin
echo -e "${YELLOW}Criando usuário administrador...${NC}"
read -p "Email do admin: " admin_email
read -s -p "Senha do admin: " admin_password
echo

docker exec $BACKEND_CONTAINER node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash('$admin_password', 10);
    const admin = await prisma.user.create({
        data: {
            email: '$admin_email',
            password: hashedPassword,
            name: 'Administrador',
            role: 'ADMIN',
            isActive: true
        }
    });
    console.log('Admin criado:', admin.email);
}

createAdmin().catch(console.error).finally(() => prisma.\$disconnect());
"

echo -e "${GREEN}✅ Setup completo!${NC}"
echo ""
echo -e "${GREEN}Acesse a aplicação:${NC}"
echo -e "${YELLOW}Frontend: https://${FRONTEND_DOMAIN:-escola.yourdomain.com}${NC}"
echo -e "${YELLOW}API Docs: https://${BACKEND_DOMAIN:-api.escola.yourdomain.com}/api${NC}"
echo ""
echo -e "${GREEN}Credenciais do Admin:${NC}"
echo -e "${YELLOW}Email: $admin_email${NC}"
echo -e "${YELLOW}Senha: (a que você definiu)${NC}"