#!/bin/bash

# Script de deploy rápido para Dokploy
# Automatiza todo o processo de deploy

set -e  # Para em caso de erro

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 SYNEXA-SIS QUICK DEPLOY 🚀      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.dokploy.yml" ]; then
    echo -e "${RED}❌ Erro: docker-compose.dokploy.yml não encontrado${NC}"
    echo -e "${YELLOW}Certifique-se de estar no diretório do projeto${NC}"
    exit 1
fi

# Solicitar informações
echo -e "${YELLOW}📝 Configuração do Deploy${NC}"
echo "=========================="
echo ""

# Domínios
read -p "Digite o domínio do frontend (ex: escola.seusite.com): " FRONTEND_DOMAIN
read -p "Digite o domínio da API (ex: api.escola.seusite.com): " BACKEND_DOMAIN

# Banco de dados
echo ""
echo -e "${YELLOW}🔐 Configuração do Banco de Dados${NC}"
DB_USER="escola_user"
read -p "Usuário do banco [$DB_USER]: " input
DB_USER=${input:-$DB_USER}

while true; do
    read -s -p "Senha do banco (mín. 8 caracteres): " DB_PASSWORD
    echo ""
    if [ ${#DB_PASSWORD} -ge 8 ]; then
        break
    else
        echo -e "${RED}Senha muito curta! Use pelo menos 8 caracteres.${NC}"
    fi
done

DB_NAME="escola_db"
read -p "Nome do banco [$DB_NAME]: " input
DB_NAME=${input:-$DB_NAME}

# JWT Secret
echo ""
echo -e "${YELLOW}🔑 Gerando JWT Secret...${NC}"
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
echo -e "${GREEN}✅ JWT Secret gerado${NC}"

# Email (opcional)
echo ""
echo -e "${YELLOW}📧 Configuração de Email (opcional - pressione Enter para pular)${NC}"
read -p "SMTP Host [smtp.gmail.com]: " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}

read -p "SMTP Port [587]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}

read -p "Email de envio: " SMTP_USER
read -s -p "Senha do email: " SMTP_PASS
echo ""

read -p "Email remetente [noreply@$FRONTEND_DOMAIN]: " SMTP_FROM
SMTP_FROM=${SMTP_FROM:-noreply@$FRONTEND_DOMAIN}

# Criar arquivo .env.dokploy
echo ""
echo -e "${YELLOW}📄 Criando arquivo de configuração...${NC}"

cat > .env.dokploy << EOF
# Gerado automaticamente em $(date)
FRONTEND_DOMAIN=$FRONTEND_DOMAIN
BACKEND_DOMAIN=$BACKEND_DOMAIN
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
JWT_SECRET=$JWT_SECRET
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_FROM=$SMTP_FROM
EOF

echo -e "${GREEN}✅ Arquivo .env.dokploy criado${NC}"

# Verificar Docker
echo ""
echo -e "${YELLOW}🐳 Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker encontrado${NC}"

# Build e Deploy
echo ""
echo -e "${YELLOW}🏗️  Iniciando build e deploy...${NC}"
echo -e "${BLUE}Isso pode levar 5-10 minutos...${NC}"

# Pull das imagens base
echo -e "${YELLOW}Baixando imagens base...${NC}"
docker pull node:18-alpine
docker pull nginx:alpine
docker pull postgres:16-alpine
docker pull redis:7-alpine

# Build dos serviços
echo -e "${YELLOW}Construindo serviços...${NC}"
docker-compose -f docker-compose.dokploy.yml build --no-cache

# Iniciar serviços
echo -e "${YELLOW}Iniciando serviços...${NC}"
docker-compose -f docker-compose.dokploy.yml up -d

# Aguardar serviços ficarem prontos
echo -e "${YELLOW}⏳ Aguardando serviços iniciarem...${NC}"
sleep 30

# Verificar se containers estão rodando
echo ""
echo -e "${YELLOW}🔍 Verificando containers...${NC}"

services=("postgres" "redis" "escola-backend" "escola-frontend" "playwright-service")
all_running=true

for service in "${services[@]}"; do
    if docker ps | grep -q "$service"; then
        echo -e "${GREEN}✅ $service: Rodando${NC}"
    else
        echo -e "${RED}❌ $service: Não está rodando${NC}"
        all_running=false
    fi
done

if [ "$all_running" = false ]; then
    echo -e "${RED}❌ Alguns serviços não iniciaram corretamente${NC}"
    echo -e "${YELLOW}Verifique os logs com: docker-compose -f docker-compose.dokploy.yml logs${NC}"
    exit 1
fi

# Executar migrations
echo ""
echo -e "${YELLOW}🗄️  Executando migrations do banco...${NC}"

BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep escola-backend | head -n1)

if docker exec $BACKEND_CONTAINER npx prisma migrate deploy; then
    echo -e "${GREEN}✅ Migrations executadas com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao executar migrations${NC}"
    exit 1
fi

# Criar usuário admin
echo ""
echo -e "${YELLOW}👤 Criação do Usuário Administrador${NC}"
echo "====================================="

read -p "Email do administrador: " ADMIN_EMAIL
while true; do
    read -s -p "Senha do administrador (mín. 6 caracteres): " ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -ge 6 ]; then
        break
    else
        echo -e "${RED}Senha muito curta! Use pelo menos 6 caracteres.${NC}"
    fi
done

# Criar admin via script Node.js
docker exec $BACKEND_CONTAINER node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
    try {
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
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('⚠️  Email já existe no sistema');
        } else {
            console.error('❌ Erro:', error.message);
        }
    } finally {
        await prisma.\$disconnect();
    }
}

createAdmin();
" 2>/dev/null

# Verificar saúde do sistema
echo ""
echo -e "${YELLOW}🏥 Verificando saúde do sistema...${NC}"

# Backend health check
if curl -s -f -o /dev/null "http://localhost:3000/health"; then
    echo -e "${GREEN}✅ Backend: Saudável${NC}"
else
    echo -e "${YELLOW}⚠️  Backend: Ainda iniciando...${NC}"
fi

# Frontend check
if curl -s -f -o /dev/null "http://localhost:3001"; then
    echo -e "${GREEN}✅ Frontend: Saudável${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: Ainda iniciando...${NC}"
fi

# Resultado final
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✅ DEPLOY CONCLUÍDO! ✅         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📌 Informações de Acesso:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Frontend: ${GREEN}https://$FRONTEND_DOMAIN${NC}"
echo -e "API Docs: ${GREEN}https://$BACKEND_DOMAIN/api${NC}"
echo ""
echo -e "${BLUE}🔐 Credenciais do Admin:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "Senha: ${GREEN}(a que você definiu)${NC}"
echo ""
echo -e "${BLUE}📝 Próximos Passos:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "1. Configure o DNS para apontar para este servidor"
echo -e "2. Aguarde 5 minutos para SSL ser configurado"
echo -e "3. Acesse ${GREEN}https://$FRONTEND_DOMAIN${NC}"
echo ""
echo -e "${BLUE}🛠️  Comandos Úteis:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Ver logs:     ${YELLOW}docker-compose -f docker-compose.dokploy.yml logs -f${NC}"
echo -e "Reiniciar:    ${YELLOW}docker-compose -f docker-compose.dokploy.yml restart${NC}"
echo -e "Parar tudo:   ${YELLOW}docker-compose -f docker-compose.dokploy.yml down${NC}"
echo -e "Verificar:    ${YELLOW}./scripts/health-check.sh${NC}"
echo ""
echo -e "${GREEN}🎉 Obrigado por usar Synexa-SIS!${NC}"