# 📘 Manual Completo de Deploy do Synexa-SIS no Dokploy

Este manual guia você passo a passo desde a configuração inicial até acessar o sistema no navegador.

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ (mínimo 2GB RAM, 20GB disco)
- Domínio próprio (ex: seudominio.com)
- Acesso SSH ao servidor
- Dokploy já instalado no VPS

---

## 🚀 PARTE 1: Preparação do Servidor

### Passo 1.1: Acessar o VPS via SSH

```bash
ssh root@seu-ip-do-vps
```

### Passo 1.2: Verificar Dokploy

```bash
# Verificar se Dokploy está rodando
docker ps | grep dokploy

# Se não estiver instalado, instale com:
curl -sSL https://dokploy.com/install.sh | sh
```

---

## 🌐 PARTE 2: Configuração de DNS

### Passo 2.1: Configurar DNS no seu provedor de domínio

Acesse o painel do seu provedor de domínio (Namecheap, Cloudflare, etc.) e adicione:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | escola | SEU_IP_VPS | 300 |
| A | api.escola | SEU_IP_VPS | 300 |

**Exemplo real:**
- Se seu domínio é `minhaescola.com` e IP do VPS é `45.79.123.456`:
  - `escola.minhaescola.com` → `45.79.123.456`
  - `api.escola.minhaescola.com` → `45.79.123.456`

### Passo 2.2: Verificar propagação DNS

```bash
# No seu computador local, teste:
ping escola.seudominio.com
ping api.escola.seudominio.com

# Devem retornar o IP do seu VPS
```

---

## 🎯 PARTE 3: Deploy no Dokploy

### Passo 3.1: Acessar Painel Dokploy

1. Abra o navegador
2. Acesse: `http://SEU_IP_VPS:3000`
3. Faça login com suas credenciais Dokploy

### Passo 3.2: Criar Novo Projeto

1. **Clique em "Create Project"**
   
2. **Preencha os campos:**
   - **Project Name:** `synexa-sis`
   - **Project Type:** `Docker Compose`
   
3. **Clique em "Create"**

### Passo 3.3: Configurar Repositório

1. **Na aba "Source":**
   - **Provider:** GitHub
   - **Repository:** `https://github.com/albertostress/synexa-sis-2025`
   - **Branch:** `main`
   - **Build Path:** `/`
   - **Docker Compose Path:** `docker-compose.dokploy.yml`

2. **Clique em "Save"**

### Passo 3.4: Configurar Variáveis de Ambiente

1. **Clique na aba "Environment"**

2. **Adicione as seguintes variáveis** (uma por uma):

```env
# IMPORTANTE: Substitua os valores de exemplo pelos seus reais!

FRONTEND_DOMAIN=escola.seudominio.com
BACKEND_DOMAIN=api.escola.seudominio.com
DB_USER=escola_user
DB_PASSWORD=SuaSenhaSegura123!@#
DB_NAME=escola_db
JWT_SECRET=gere32caracteresaleatoriosaqui12345678901234567890
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=suasenhadoapp
SMTP_FROM=noreply@seudominio.com
```

**⚠️ IMPORTANTE:**
- `FRONTEND_DOMAIN`: Seu subdomínio para o frontend (sem https://)
- `BACKEND_DOMAIN`: Seu subdomínio para a API (sem https://)
- `DB_PASSWORD`: Use uma senha forte (mín. 16 caracteres)
- `JWT_SECRET`: Gere uma string aleatória de 32+ caracteres

**Para gerar JWT_SECRET seguro:**
```bash
# No terminal Linux/Mac:
openssl rand -base64 32

# Ou use um gerador online:
# https://www.uuidgenerator.net/
```

3. **Clique em "Save Environment"**

### Passo 3.5: Fazer o Deploy

1. **Clique no botão "Deploy"** (ícone de foguete 🚀)

2. **Acompanhe o log de deploy:**
   - Clique na aba "Deployments"
   - Clique no deployment em andamento
   - Observe os logs em tempo real

3. **Aguarde conclusão** (5-10 minutos):
   - ✅ Building escola-backend
   - ✅ Building escola-frontend
   - ✅ Starting postgres
   - ✅ Starting redis
   - ✅ Starting escola-backend
   - ✅ Starting escola-frontend
   - ✅ Starting playwright-service

---

## 🔧 PARTE 4: Configuração Inicial do Sistema

### Passo 4.1: Acessar o servidor via SSH

```bash
ssh root@seu-ip-do-vps
```

### Passo 4.2: Navegar para o projeto

```bash
# Encontrar o diretório do projeto
cd /var/lib/dokploy/projects
ls -la

# Entrar no diretório do projeto
cd synexa-sis
```

### Passo 4.3: Executar script de inicialização

```bash
# Dar permissão de execução
chmod +x scripts/init-dokploy.sh

# Executar o script
./scripts/init-dokploy.sh
```

### Passo 4.4: Seguir as instruções do script

O script irá:

1. **Verificar serviços** ✓
   ```
   ✓ Container backend encontrado: synexa-sis_escola-backend_1
   ✓ Container postgres encontrado: synexa-sis_postgres_1
   ```

2. **Executar migrations** ✓
   ```
   Executando migrations...
   ✓ Migrations executadas com sucesso!
   ```

3. **Perguntar sobre seed inicial:**
   ```
   Deseja executar o seed inicial? (y/n): n
   ```
   - Digite `n` (não) para produção
   - Digite `y` apenas para testes

4. **Criar usuário administrador:**
   ```
   Criando usuário administrador...
   Email do admin: admin@minhaescola.com
   Senha do admin: [digite uma senha segura]
   ```

5. **Mostrar informações de acesso:**
   ```
   ✅ Setup completo!
   
   Acesse a aplicação:
   Frontend: https://escola.seudominio.com
   API Docs: https://api.escola.seudominio.com/api
   
   Credenciais do Admin:
   Email: admin@minhaescola.com
   Senha: (a que você definiu)
   ```

---

## 🔒 PARTE 5: Configuração SSL (HTTPS)

### Passo 5.1: Verificar Traefik

O Dokploy usa Traefik que configura SSL automaticamente. Verifique:

```bash
# Ver logs do Traefik
docker logs dokploy-traefik
```

### Passo 5.2: Aguardar certificados

- Aguarde 2-5 minutos para certificados serem gerados
- Traefik obtém certificados Let's Encrypt automaticamente

### Passo 5.3: Verificar HTTPS

```bash
# Testar HTTPS
curl -I https://escola.seudominio.com
curl -I https://api.escola.seudominio.com/health
```

---

## 🌐 PARTE 6: Acessar o Sistema no Navegador

### Passo 6.1: Primeiro Acesso

1. **Abra o navegador**
2. **Acesse:** `https://escola.seudominio.com`
3. **Você verá a tela de login**

### Passo 6.2: Fazer Login

1. **Email:** Use o email do admin criado no Passo 4.4
2. **Senha:** Use a senha definida no Passo 4.4
3. **Clique em "Entrar"**

### Passo 6.3: Configuração Inicial no Sistema

Após o login, configure:

1. **Informações da Escola:**
   - Vá em Configurações
   - Preencha dados da instituição

2. **Criar Ano Letivo:**
   - Vá em Configurações > Anos Letivos
   - Crie o ano atual (ex: 2025)

3. **Cadastrar Primeiros Dados:**
   - Professores
   - Turmas
   - Disciplinas
   - Alunos

---

## 🔍 PARTE 7: Verificação e Testes

### Passo 7.1: Verificar todos os serviços

```bash
# Ver todos containers rodando
docker ps

# Deve mostrar:
# - synexa-sis_postgres_1
# - synexa-sis_redis_1
# - synexa-sis_escola-backend_1
# - synexa-sis_escola-frontend_1
# - synexa-sis_playwright-service_1
```

### Passo 7.2: Testar funcionalidades

1. **Criar um professor teste**
2. **Criar uma turma teste**
3. **Matricular um aluno teste**
4. **Gerar um documento PDF**

### Passo 7.3: Verificar logs em caso de erro

```bash
# Ver logs do backend
docker logs synexa-sis_escola-backend_1 --tail 50

# Ver logs do frontend
docker logs synexa-sis_escola-frontend_1 --tail 50

# Ver logs do banco
docker logs synexa-sis_postgres_1 --tail 50
```

---

## ❗ TROUBLESHOOTING - Problemas Comuns

### Problema 1: "502 Bad Gateway"

**Solução:**
```bash
# Reiniciar containers
cd /var/lib/dokploy/projects/synexa-sis
docker-compose -f docker-compose.dokploy.yml restart
```

### Problema 2: "Connection refused to database"

**Solução:**
```bash
# Verificar se postgres está rodando
docker ps | grep postgres

# Se não estiver, iniciar:
docker-compose -f docker-compose.dokploy.yml up -d postgres

# Aguardar 30 segundos e reiniciar backend
docker-compose -f docker-compose.dokploy.yml restart escola-backend
```

### Problema 3: "Cannot GET /"

**Solução:**
```bash
# Rebuild do frontend
docker-compose -f docker-compose.dokploy.yml up -d --build escola-frontend
```

### Problema 4: SSL não funciona

**Solução:**
1. Verificar se DNS está propagado:
```bash
nslookup escola.seudominio.com
```

2. Verificar portas:
```bash
# Portas 80 e 443 devem estar abertas
sudo ufw allow 80
sudo ufw allow 443
sudo ufw reload
```

3. Reiniciar Traefik:
```bash
docker restart dokploy-traefik
```

---

## 📊 PARTE 8: Monitoramento

### Passo 8.1: Configurar Backups Automáticos

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2h da manhã:
0 2 * * * /var/lib/dokploy/projects/synexa-sis/scripts/backup-dokploy.sh
```

### Passo 8.2: Verificar uso de recursos

```bash
# Ver uso de CPU e memória
docker stats

# Ver espaço em disco
df -h

# Ver logs de acesso
docker logs synexa-sis_escola-frontend_1 | grep "GET\|POST"
```

### Passo 8.3: Configurar alertas (opcional)

No painel Dokploy:
1. Vá em Settings > Notifications
2. Configure webhook para Discord/Slack
3. Ative alertas para falhas de deploy

---

## ✅ CHECKLIST FINAL

Confirme que tudo está funcionando:

- [ ] DNS configurado e propagado
- [ ] Deploy concluído com sucesso no Dokploy
- [ ] Migrations executadas
- [ ] Usuário admin criado
- [ ] HTTPS funcionando (cadeado verde no navegador)
- [ ] Login funcionando
- [ ] Consegue criar/editar dados
- [ ] PDFs sendo gerados
- [ ] Backups configurados

---

## 🎉 PARABÉNS!

Seu sistema Synexa-SIS está online e funcionando!

**Links úteis:**
- Frontend: `https://escola.seudominio.com`
- API: `https://api.escola.seudominio.com/api`
- Dokploy: `http://seu-ip:3000`

**Suporte:**
- Documentação: `/DEPLOYMENT.md`
- Logs: `docker logs [container-name]`
- Backup: `./scripts/backup-dokploy.sh`
- Restore: `./scripts/restore-dokploy.sh`

---

## 📝 Notas Importantes

1. **Segurança:**
   - Troque senhas padrão imediatamente
   - Configure firewall (ufw)
   - Mantenha backups regulares

2. **Performance:**
   - Monitor uso de recursos
   - Configure cache se necessário
   - Otimize imagens Docker

3. **Manutenção:**
   - Atualize sistema regularmente
   - Revise logs semanalmente
   - Teste restauração de backup mensalmente

---

*Última atualização: Janeiro 2025*
*Versão: 1.0*