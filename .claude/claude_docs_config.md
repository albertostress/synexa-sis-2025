# Configuração do Projeto Synexa-SIS-2025

## Comandos Principais

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build do projeto
npm run build

# Testes
npm test

# Lint
npm run lint

# Typecheck
npm run typecheck

# Instalar dependências
npm install

# Atualizar dependências
npm update

# Verificar dependências vulneráveis
npm audit

# Corrigir dependências vulneráveis
npm audit fix
```

### Git & Controle de Versão
```bash
# Status do repositório
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "mensagem"

# Push
git push

# Pull
git pull

# Ver histórico
git log --oneline

# Criar branch
git checkout -b nome-da-branch

# Trocar branch
git checkout nome-da-branch

# Merge
git merge nome-da-branch

# Stash
git stash
git stash pop
```

### Produção & Deploy
```bash
# Build para produção
npm run build:prod

# Preview da build
npm run preview

# Análise de bundle
npm run analyze

# Limpar cache
npm run clean

# Start produção
npm start
```

### Docker (se aplicável)
```bash
# Build da imagem
docker build -t synexa-sis .

# Executar container
docker run -p 3000:3000 synexa-sis

# Docker compose
docker-compose up -d
docker-compose down

# Ver logs
docker logs container-name
```

### Escola Backend (NestJS + PostgreSQL)
```bash
# Navegar para pasta do backend
cd escola-backend

# Instalar dependências
npm install

# Subir ambiente com Docker
docker-compose up --build

# Subir apenas banco de dados
docker-compose up escola-db -d

# Executar migrations
npx prisma migrate dev --name init

# Gerar Prisma client
npx prisma generate

# Abrir Prisma Studio
npx prisma studio

# Resetar banco de dados
npx prisma migrate reset

# Deploy migrations para produção
npx prisma migrate deploy
```

### Banco de Dados
```bash
# Migrations
npm run db:migrate
npx prisma migrate dev

# Seed
npm run db:seed

# Reset
npm run db:reset
npx prisma migrate reset

# Backup
npm run db:backup

# Restore
npm run db:restore

# Prisma Studio (GUI)
npx prisma studio
```

### Utilitários
```bash
# Formatar código
npm run format

# Verificar formatação
npm run format:check

# Gerar documentação
npm run docs

# Executar em modo watch
npm run dev:watch

# Executar testes em watch
npm run test:watch

# Coverage de testes
npm run test:coverage
```

### Estrutura do Projeto
```
Synexa-SIS-2025/
├── .claude/                    # Configurações Claude
│   └── claude_docs_config.md
└── escola-backend/            # Backend NestJS
    ├── src/
    │   ├── main.ts           # Entry point
    │   ├── app.module.ts     # Módulo principal
    │   ├── app.controller.ts # Controller principal
    │   ├── app.service.ts    # Service principal
    │   └── prisma/           # Módulo Prisma
    │       ├── prisma.module.ts
    │       └── prisma.service.ts
    ├── prisma/
    │   └── schema.prisma     # Schema do banco
    ├── Dockerfile            # Container do backend
    ├── docker-compose.yml    # Orquestração dos containers
    ├── package.json          # Dependências Node.js
    ├── tsconfig.json         # Configuração TypeScript
    └── .env                  # Variáveis de ambiente
```

## Regras de Desenvolvimento

1. **Convenções de Código**
   - Use TypeScript para tipagem
   - Siga as convenções ESLint configuradas
   - Mantenha componentes pequenos e reutilizáveis

2. **Padrões de Commit**
   - Use mensagens descritivas em português
   - Formato: `tipo: descrição`
   - Tipos: feat, fix, docs, style, refactor, test

3. **Estrutura de Componentes**
   - Componentes em PascalCase
   - Arquivos de componentes em kebab-case
   - Props tipadas com interfaces

## Context7 - Busca de Documentação

Este arquivo serve como contexto para o Claude buscar informações específicas sobre:
- Arquitetura do projeto
- Convenções de código
- Comandos disponíveis
- Estrutura de pastas
- Regras de desenvolvimento

Para buscar documentação específica, consulte os arquivos na pasta `docs/` ou use os comandos listados acima.