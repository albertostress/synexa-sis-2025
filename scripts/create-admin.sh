#!/bin/bash

# Script para criar usuário admin no Synexa-SIS

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔑 Criação de Usuário Administrador${NC}"
echo "======================================"

# Detectar container backend
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Container backend não encontrado${NC}"
    echo -e "${YELLOW}Certifique-se que o sistema está rodando${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container encontrado: $BACKEND_CONTAINER${NC}"
echo ""

# Solicitar credenciais
read -p "Email do admin [admin@escola.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@escola.com}

read -s -p "Senha do admin (mín. 6 caracteres): " ADMIN_PASSWORD
echo ""

if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
    echo -e "${RED}❌ Senha muito curta! Use pelo menos 6 caracteres.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Criando usuário admin...${NC}"

# Criar o usuário admin
docker exec $BACKEND_CONTAINER node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Primeiro, verificar se o usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: { email: '$ADMIN_EMAIL' }
        });

        if (existingUser) {
            console.log('⚠️  Usuário já existe. Atualizando senha...');
            // Atualizar senha do usuário existente
            const hashedPassword = await bcrypt.hash('$ADMIN_PASSWORD', 10);
            const updatedUser = await prisma.user.update({
                where: { email: '$ADMIN_EMAIL' },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    isActive: true
                }
            });
            console.log('✅ Senha atualizada para:', updatedUser.email);
        } else {
            // Criar novo usuário
            const hashedPassword = await bcrypt.hash('$ADMIN_PASSWORD', 10);
            const admin = await prisma.user.create({
                data: {
                    email: '$ADMIN_EMAIL',
                    password: hashedPassword,
                    name: 'Administrador',
                    role: 'ADMIN',
                    isActive: true
                }
            });
            console.log('✅ Admin criado com sucesso:', admin.email);
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.\$disconnect();
    }
}

createAdmin();
" 2>&1

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ PROCESSO CONCLUÍDO!           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Credenciais do Admin:${NC}"
echo -e "Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "Senha: ${GREEN}(a que você definiu)${NC}"
echo ""
echo -e "${YELLOW}Teste o login em:${NC}"
echo -e "${GREEN}http://localhost:3001${NC} (local)"
echo -e "${GREEN}https://escola.seudominio.com${NC} (produção)"
echo ""

# Verificar se o backend está respondendo
echo -e "${YELLOW}Verificando API...${NC}"
if curl -s -f -o /dev/null "http://localhost:3000/health"; then
    echo -e "${GREEN}✅ API está funcionando${NC}"
else
    echo -e "${RED}⚠️  API não está respondendo. Verifique os logs:${NC}"
    echo -e "${YELLOW}docker logs $BACKEND_CONTAINER${NC}"
fi