#!/bin/bash

# Script para criar 3 usuários de teste: Admin, Secretaria e Professor

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🔑 CRIAR USUÁRIOS DE TESTE           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Detectar container backend
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Container backend não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Container encontrado: $BACKEND_CONTAINER${NC}"
echo ""

# Instalar bcryptjs se necessário
echo -e "${YELLOW}📦 Preparando ambiente...${NC}"
docker exec $BACKEND_CONTAINER npm install bcryptjs 2>/dev/null

# Criar os 3 usuários
echo -e "${YELLOW}👥 Criando usuários de teste...${NC}"
echo ""

docker exec $BACKEND_CONTAINER node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUsers() {
  const users = [
    {
      email: 'admin@escola.com',
      password: 'admin123',
      name: 'Administrador',
      role: 'ADMIN'
    },
    {
      email: 'secretaria@escola.com',
      password: 'secretaria123',
      name: 'Secretária',
      role: 'SECRETARIA'
    },
    {
      email: 'professor@escola.com',
      password: 'professor123',
      name: 'Professor',
      role: 'PROFESSOR'
    }
  ];

  for (const userData of users) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: hashedPassword,
          name: userData.name,
          role: userData.role
        },
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role
        }
      });
      
      console.log('✅ Usuário criado/atualizado:', user.email, '(' + user.role + ')');
      
      // Se for professor, criar registro na tabela teachers
      if (userData.role === 'PROFESSOR') {
        const existingTeacher = await prisma.teacher.findUnique({
          where: { userId: user.id }
        });
        
        if (!existingTeacher) {
          await prisma.teacher.create({
            data: {
              userId: user.id,
              bio: 'Professor de teste',
              qualification: 'Licenciatura',
              specialization: 'Educação',
              experience: 5
            }
          });
          console.log('   → Registro de professor criado');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar', userData.email + ':', error.message);
    }
  }
  
  await prisma.\$disconnect();
}

createTestUsers();
" 2>&1

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✅ USUÁRIOS CRIADOS COM SUCESSO!    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📝 Credenciais dos Usuários:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}1. ADMINISTRADOR${NC}"
echo -e "   Email: ${YELLOW}admin@escola.com${NC}"
echo -e "   Senha: ${YELLOW}admin123${NC}"
echo -e "   Acesso: Total ao sistema"
echo ""
echo -e "${GREEN}2. SECRETARIA${NC}"
echo -e "   Email: ${YELLOW}secretaria@escola.com${NC}"
echo -e "   Senha: ${YELLOW}secretaria123${NC}"
echo -e "   Acesso: Matrículas, Alunos, Documentos"
echo ""
echo -e "${GREEN}3. PROFESSOR${NC}"
echo -e "   Email: ${YELLOW}professor@escola.com${NC}"
echo -e "   Senha: ${YELLOW}professor123${NC}"
echo -e "   Acesso: Notas, Presenças, Alunos"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Acesse o sistema em:${NC}"
echo -e "   Local: ${GREEN}http://localhost:3001${NC}"
echo -e "   Produção: ${GREEN}https://escola.seudominio.com${NC}"
echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Mude estas senhas em produção!${NC}"