# 🚀 Deploy do Synexa-SIS no Dokploy

## 📋 Visão Geral

Este guia explica como fazer o deploy do Sistema de Informação do Estudante (Synexa-SIS) no Dokploy usando Docker Compose.

## 🏗️ Arquitetura de Produção

- **Frontend**: React + Vite com Nginx (Porta 80)
- **Backend**: NestJS + TypeScript (Porta 3000)
- **Database**: PostgreSQL 15 (Porta 5432)
- **Proxy**: Nginx com SSL/TLS via Let's Encrypt

## 📦 Arquivos Criados para Produção

### Docker Compose
- `docker-compose.prod.yml` - Configuração para produção
- `docker-compose.yml` - Configuração de desenvolvimento (existente)

### Dockerfiles Otimizados
- `escola-backend/Dockerfile.prod` - Multi-stage build para backend
- `escola-frontend/Dockerfile.prod` - Build otimizado com Nginx
- `escola-frontend/nginx.conf` - Configuração do Nginx

### Configurações
- `.env.example` - Template das variáveis de ambiente
- `dokploy.json` - Configuração específica do Dokploy
- `.dockerignore` - Arquivos a ignorar no build

## 🔧 Pré-requisitos

1. **Servidor com Dokploy instalado**
2. **Docker e Docker Compose**
3. **Domínio configurado** (ex: synexa-sis.sua-empresa.com)
4. **Certificado SSL** (Let's Encrypt automático via Dokploy)

## 📝 Passo a Passo do Deploy

### 1. Preparação do Ambiente

```bash
# 1. Fazer clone do repositório no servidor
git clone <seu-repositorio> synexa-sis
cd synexa-sis

# 2. Criar arquivo .env baseado no .env.example
cp .env.example .env
```

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SUA_SENHA_SEGURA_AQUI
POSTGRES_DB=escola

# Backend
JWT_SECRET=sua-chave-jwt-super-secreta-minimo-32-caracteres
DATABASE_URL=postgres://postgres:SUA_SENHA_SEGURA_AQUI@escola-db:5432/escola
NODE_ENV=production

# Frontend
VITE_API_BASE_URL=https://synexa-sis.sua-empresa.com
API_URL=https://synexa-sis.sua-empresa.com
```

### 3. Deploy no Dokploy

#### Opção A: Via Interface Web do Dokploy

1. **Acesse o painel do Dokploy**
2. **Criar novo projeto**:
   - Nome: `synexa-sis-2025`
   - Tipo: `Docker Compose`
   - Repository: URL do seu repositório

3. **Configurar Compose**:
   - Arquivo: `docker-compose.prod.yml`
   - Branch: `main`

4. **Configurar Domínio**:
   - Domínio: `synexa-sis.sua-empresa.com`
   - SSL: Ativado (Let's Encrypt)
   - Porta: `80`

5. **Configurar Variáveis de Ambiente**:
   - Adicionar todas as variáveis do `.env`

#### Opção B: Via CLI do Dokploy

```bash
# 1. Login no Dokploy
dokploy auth login

# 2. Deploy do projeto
dokploy compose up -f docker-compose.prod.yml

# 3. Configurar domínio
dokploy domain add synexa-sis.sua-empresa.com --ssl
```

### 4. Verificação do Deploy

```bash
# 1. Verificar status dos containers
docker ps

# 2. Verificar logs
docker-compose -f docker-compose.prod.yml logs -f

# 3. Testar endpoints
curl https://synexa-sis.sua-empresa.com/health
curl https://synexa-sis.sua-empresa.com/api
```

## 🗄️ Configuração do Banco de Dados

### Primeira Execução (Migrations)

```bash
# 1. Entrar no container do backend
docker exec -it synexa-backend bash

# 2. Executar migrations
npx prisma migrate deploy

# 3. Gerar cliente Prisma
npx prisma generate

# 4. (Opcional) Seed inicial
npx prisma db seed
```

### Backup do Banco

```bash
# Backup automático via Dokploy (configurado no dokploy.json)
# Manual:
docker exec synexa-db pg_dump -U postgres escola > backup_$(date +%Y%m%d).sql
```

## 🔒 Segurança

### Configurações Aplicadas

1. **Nginx Security Headers**:
   - X-Frame-Options: SAMEORIGIN
   - X-XSS-Protection: 1; mode=block
   - X-Content-Type-Options: nosniff
   - Content-Security-Policy

2. **Docker Security**:
   - Usuários não-root nos containers
   - Health checks configurados
   - Restart policies aplicadas

3. **Environment Variables**:
   - Senhas e secrets via variáveis de ambiente
   - JWT secrets aleatórios e seguros

## 📊 Monitoramento

### Health Checks Configurados

- **Frontend**: `http://localhost:80/health`
- **Backend**: `http://localhost:3000/health`
- **Database**: PostgreSQL health check interno

### Logs

```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Serviço específico
docker-compose -f docker-compose.prod.yml logs -f escola-backend
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Container do backend não inicia
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs escola-backend

# Verificar variáveis de ambiente
docker exec synexa-backend env | grep DATABASE_URL
```

#### 2. Erro de conexão com banco
```bash
# Verificar se o banco está rodando
docker exec synexa-db pg_isready -U postgres

# Testar conexão manual
docker exec -it synexa-db psql -U postgres -d escola
```

#### 3. Frontend não carrega
```bash
# Verificar se o Nginx está rodando
docker exec synexa-frontend nginx -t

# Verificar configuração de API
curl http://localhost:80/api/health
```

### Comandos Úteis

```bash
# Rebuild sem cache
docker-compose -f docker-compose.prod.yml build --no-cache

# Recrear containers
docker-compose -f docker-compose.prod.yml up --force-recreate

# Limpeza do sistema
docker system prune -a

# Ver uso de recursos
docker stats
```

## 🚀 Scaling (Opções Futuras)

### Configuração para Alta Disponibilidade

1. **Load Balancer**: Nginx upstream
2. **Database Cluster**: PostgreSQL replication
3. **Redis Cache**: Para sessões e cache
4. **CDN**: Para assets estáticos

### Exemplo de Scaling no Dokploy

```json
{
  "scaling": {
    "min": 2,
    "max": 5,
    "target_cpu": 70,
    "target_memory": 80
  }
}
```

## 📞 Suporte

- **Logs**: Sempre verificar logs em caso de problemas
- **Health Checks**: Usar endpoints `/health` para diagnóstico
- **Backup**: Backup automático configurado às 2h da manhã
- **SSL**: Renovação automática via Let's Encrypt

## 🔄 Atualizações

Para atualizar o sistema:

```bash
# 1. Pull das mudanças
git pull origin main

# 2. Rebuild e redeploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d

# 3. Executar migrations se necessário
docker exec synexa-backend npx prisma migrate deploy
```

---

**✅ Sistema pronto para produção com:**
- SSL/TLS automático
- Health checks
- Backup automatizado
- Logs centralizados
- Scaling configurado
- Segurança hardened