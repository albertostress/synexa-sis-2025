# 🚀 Deployment do Synexa-SIS com Dokploy

Este guia detalha como fazer o deployment do Sistema de Informação do Estudante (Synexa-SIS) usando Dokploy.

## 📋 Pré-requisitos

- Servidor VPS com Ubuntu 20.04+ ou Debian 11+
- Mínimo 2GB RAM (recomendado 4GB+)
- 20GB de espaço em disco
- Domínio configurado (ex: escola.suaempresa.com)
- Portas 80, 443 e 3000 abertas

## 🔧 Instalação do Dokploy

### 1. Instalar Dokploy no servidor

```bash
# SSH no seu servidor
ssh root@seu-servidor-ip

# Instalar Dokploy
curl -sSL https://dokploy.com/install.sh | sh

# Aguarde a instalação completar
# Após instalação, acesse: http://seu-servidor-ip:3000
```

### 2. Configuração Inicial do Dokploy

1. Acesse `http://seu-servidor-ip:3000`
2. Crie sua conta de administrador
3. Configure as credenciais

## 📦 Preparação do Projeto

### 1. Fork ou Clone do Repositório

```bash
# No seu GitHub, faça fork do projeto
# Ou clone diretamente
git clone https://github.com/seu-usuario/Synexa-SIS-2025.git
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.dokploy.example` para `.env` e configure:

```bash
# Database
DB_USER=synexa_user
DB_PASSWORD=senha_super_segura_aqui
DB_NAME=synexa_escola_db

# JWT
JWT_SECRET=chave_jwt_minimo_32_caracteres_aqui

# Domínios
FRONTEND_DOMAIN=escola.seudominio.com
BACKEND_DOMAIN=api.escola.seudominio.com

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=senha_de_app_google
SMTP_FROM=noreply@seudominio.com
```

## 🌐 Deploy no Dokploy

### 1. Criar Novo Projeto

1. No painel Dokploy, clique em **"New Project"**
2. Nome: `synexa-sis`
3. Clique em **"Create"**

### 2. Configurar Docker Compose

1. Dentro do projeto, clique em **"New Service"** → **"Docker Compose"**
2. Nome: `synexa-sis-stack`
3. Configuração Git:
   - Repository: `https://github.com/seu-usuario/Synexa-SIS-2025`
   - Branch: `main`
   - Build Path: `/`
   - Compose Path: `docker-compose.dokploy.yml`

### 3. Adicionar Variáveis de Ambiente

1. Na aba **"Environment"**
2. Adicione todas as variáveis do `.env`
3. **Importante**: Use valores seguros para produção!

### 4. Configurar Domínios

#### Para o Frontend:
1. Vá para aba **"Domains"**
2. Clique em **"Add Domain"**
3. Configure:
   - Host: `escola.seudominio.com`
   - Service Name: `escola-frontend`
   - Port: `3001`
   - HTTPS: `ON`
   - Certificate: `Let's Encrypt`

#### Para o Backend:
1. Clique em **"Add Domain"**
2. Configure:
   - Host: `api.escola.seudominio.com`
   - Service Name: `escola-backend`
   - Port: `3000`
   - HTTPS: `ON`
   - Certificate: `Let's Encrypt`

### 5. Deploy

1. Clique em **"Deploy"**
2. Acompanhe os logs
3. Aguarde todos os serviços iniciarem

## 🔒 Configuração DNS

Configure seus domínios no seu provedor DNS:

```
Tipo: A
Nome: escola
Valor: IP-DO-SEU-SERVIDOR

Tipo: A
Nome: api.escola
Valor: IP-DO-SEU-SERVIDOR
```

## 🎯 Pós-Deploy

### 1. Inicializar Banco de Dados

```bash
# Acesse o container do backend via Dokploy
# Na aba "Terminal" do serviço escola-backend

# Executar migrations
npx prisma migrate deploy

# Seed inicial (opcional)
npx prisma db seed
```

### 2. Criar Usuário Admin

```bash
# No terminal do container backend
npm run create-admin -- --email admin@escola.com --password SenhaSegura123!
```

### 3. Verificar Aplicação

1. Acesse: `https://escola.seudominio.com`
2. Login com as credenciais do admin
3. Verifique todas as funcionalidades

## 🔧 Configurações Avançadas

### Backup Automático

No Dokploy, configure Jobs agendados:

1. Vá para **"Jobs"** no projeto
2. Adicione novo job:
   - Nome: `backup-database`
   - Schedule: `0 2 * * *` (diariamente às 2h)
   - Command:
   ```bash
   docker exec postgres pg_dump -U synexa_user synexa_escola_db > /backups/backup_$(date +%Y%m%d).sql
   ```

### Monitoramento

1. Ative monitoring no Dokploy
2. Configure alertas para:
   - CPU > 80%
   - Memória > 90%
   - Disco > 85%

### Escalabilidade

Para escalar horizontalmente:

1. Na aba **"Cluster Settings"**
2. Aumente **"Replicas"** conforme necessário
3. Configure Load Balancer se necessário

## 📊 Métricas e Logs

### Visualizar Logs

1. Em cada serviço, aba **"Logs"**
2. Use filtros para debug
3. Configure log rotation se necessário

### Métricas

1. Aba **"Metrics"** no projeto
2. Monitore:
   - Uso de CPU
   - Memória
   - Rede
   - Disco

## 🚨 Troubleshooting

### Problema: Bad Gateway

```bash
# Verificar se os serviços estão rodando
docker ps

# Reiniciar serviços
docker service update --force escola-backend
```

### Problema: Banco não conecta

```bash
# Verificar conexão
docker exec escola-backend npx prisma db push

# Verificar logs do postgres
docker logs postgres
```

### Problema: SSL não funciona

1. Verifique DNS está propagado
2. Force renovação do certificado no Dokploy
3. Verifique portas 80/443 estão abertas

## 🔄 Atualizações

### Deploy de Atualizações

1. Faça push para o repositório
2. No Dokploy, clique em **"Redeploy"**
3. Ou configure webhook para auto-deploy

### Configurar Auto-Deploy

1. Vá para aba **"Deployments"**
2. Copie Webhook URL
3. No GitHub:
   - Settings → Webhooks
   - Add webhook
   - Paste URL
   - Events: Push

## 🔐 Segurança

### Recomendações

1. **Senhas Fortes**: Use senhas com 20+ caracteres
2. **2FA**: Ative no Dokploy
3. **Firewall**: Configure UFW ou iptables
4. **Updates**: Mantenha sistema atualizado
5. **Backups**: Configure backups diários
6. **SSL**: Sempre use HTTPS

### Hardening

```bash
# Firewall básico
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw enable

# Fail2ban
apt install fail2ban
systemctl enable fail2ban
```

## 📚 Recursos Adicionais

- [Documentação Dokploy](https://docs.dokploy.com)
- [Synexa-SIS Wiki](https://github.com/seu-usuario/Synexa-SIS-2025/wiki)
- [Suporte Dokploy Discord](https://discord.gg/dokploy)

## 💡 Dicas

1. **Performance**: Use Redis para cache de sessões
2. **CDN**: Configure Cloudflare para assets estáticos
3. **Monitoring**: Integre com Grafana/Prometheus
4. **Logs**: Configure centralização com Loki
5. **Backup**: Use S3 para backups offsite

## 🆘 Suporte

- Issues: [GitHub Issues](https://github.com/seu-usuario/Synexa-SIS-2025/issues)
- Email: suporte@seudominio.com
- Discord: [Comunidade Dokploy](https://discord.gg/dokploy)

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0