# Escola Backend

Backend da aplicação de gestão escolar construído com NestJS, TypeScript, PostgreSQL e Prisma ORM.

## 🚀 Tecnologias

- **NestJS** - Framework Node.js
- **TypeScript** - Tipagem estática
- **PostgreSQL 15** - Banco de dados
- **Prisma ORM** - Object-Relational Mapping
- **Docker & Docker Compose** - Containerização
- **Swagger** - Documentação da API

## 📦 Instalação

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (opcional, para desenvolvimento local)

### Executar com Docker

```bash
# Subir toda a aplicação (backend + banco)
docker-compose up --build

# Executar migrations
docker-compose exec escola-backend npx prisma migrate dev --name init

# Gerar Prisma client
docker-compose exec escola-backend npx prisma generate
```

### Executar localmente (desenvolvimento)

```bash
# Instalar dependências
npm install

# Subir apenas o banco de dados
docker-compose up escola-db -d

# Executar migrations
npx prisma migrate dev --name init

# Gerar Prisma client
npx prisma generate

# Iniciar servidor de desenvolvimento
npm run start:dev
```

## 🌐 Endpoints

- **API**: http://localhost:3000
- **Documentação Swagger**: http://localhost:3000/api
- **Health Check**: http://localhost:3000

## 🗄️ Banco de Dados

### Configuração
- **Host**: localhost:5432
- **Database**: escola
- **User**: postgres
- **Password**: postgres

### Prisma Studio
```bash
npx prisma studio
```

### Comandos úteis
```bash
# Reset do banco
npx prisma migrate reset

# Deploy para produção
npx prisma migrate deploy

# Seed (quando implementado)
npm run db:seed
```

## 📁 Estrutura

```
src/
├── main.ts              # Entry point da aplicação
├── app.module.ts        # Módulo principal
├── app.controller.ts    # Controller de health check
├── app.service.ts       # Service principal
└── prisma/             # Módulo Prisma
    ├── prisma.module.ts
    └── prisma.service.ts
```

## 🧪 Scripts Disponíveis

```bash
npm run start:dev        # Desenvolvimento com hot reload
npm run build           # Build para produção
npm run start:prod      # Executar versão de produção
npm run test            # Executar testes
npm run test:watch      # Testes em modo watch
npm run lint            # Linting do código
npm run format          # Formatação do código
```

## 🐳 Docker

### Serviços

- **escola-backend**: Aplicação NestJS na porta 3000
- **escola-db**: PostgreSQL 15 na porta 5432

### Volumes
- **pgdata**: Persistência dos dados do PostgreSQL

## 🔧 Configuração

### Variáveis de Ambiente

```env
DATABASE_URL="postgres://postgres:postgres@escola-db:5432/escola"
```

### TypeScript

Configuração rigorosa com:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- Sem uso de `any`

## 📝 Modelos

### Student
```prisma
model Student {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  birthDate DateTime
  createdAt DateTime @default(now())
}
```

## 🔄 Próximos Passos

1. Implementar módulos para Students, Teachers, Classes
2. Adicionar autenticação e autorização
3. Implementar validações de dados
4. Adicionar testes unitários e e2e
5. Configurar CI/CD