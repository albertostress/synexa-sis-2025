# Synexa-SIS 2025 - Sistema de Informação do Estudante

Sistema completo de gestão escolar desenvolvido com tecnologias modernas.

## 🚀 Tecnologias

- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma ORM
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Infraestrutura**: Docker, Docker Compose
- **Documentação**: Swagger/OpenAPI

## 📁 Estrutura do Projeto

```
Synexa-SIS-2025/
├── escola-backend/        # Aplicação backend (NestJS)
├── escola-frontend/       # Aplicação frontend (React)
├── playwright-service/    # Serviço de geração de PDFs
├── docs/                 # Documentação do projeto
├── tests/               # Testes e arquivos de teste
├── docker/              # Configurações Docker alternativas
├── tools/               # Scripts e ferramentas
├── configs/             # Arquivos de configuração
├── logs/                # Logs da aplicação
├── scripts/             # Scripts de automação
├── e2e/                 # Testes end-to-end
└── docker-compose.yml   # Configuração principal Docker

```

## 🏃‍♂️ Início Rápido

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 18+ (para desenvolvimento local)

### Executar o Sistema

```bash
# Clonar o repositório
git clone https://github.com/synexa/synexa-sis-2025.git
cd synexa-sis-2025

# Subir os containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### Acessar o Sistema

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Documentação API**: http://localhost:3000/api

### Credenciais Padrão

```
Email: admin@escola.com
Senha: admin123
```

## 📋 Funcionalidades

- **Gestão de Alunos**: Cadastro completo, matrículas, histórico
- **Gestão Acadêmica**: Turmas, disciplinas, notas, boletins
- **Gestão de Professores**: Cadastro, horários, disciplinas
- **Sistema Financeiro**: Faturas, pagamentos, relatórios
- **Documentos**: Geração de certificados, declarações, históricos
- **Portal dos Pais**: Acesso a notas, pagamentos, comunicados
- **Análises e Relatórios**: Dashboards com indicadores

## 🛠️ Desenvolvimento

### Backend
```bash
cd escola-backend
npm install
npm run start:dev
```

### Frontend
```bash
cd escola-frontend
npm install
npm run dev
```

## 🔧 Comandos Úteis

```bash
# Rebuild dos containers
docker-compose build

# Executar migrations
docker-compose exec escola-backend npx prisma migrate dev

# Acessar Prisma Studio
docker-compose exec escola-backend npx prisma studio

# Limpar e reiniciar
docker-compose down -v
docker-compose up -d
```

## 📚 Documentação

- [Documentação Completa](./docs/CLAUDE.md)
- [Guia de Deploy](./docs/DEPLOY.md)
- [Permissões e Roles](./docs/test-secretaria-permissions.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido por Synexa** | 2025