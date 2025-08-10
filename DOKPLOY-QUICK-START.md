# ⚡ Guia Rápido - Deploy em 10 Minutos

## 🎯 Deploy Rápido do Synexa-SIS no Dokploy

### 📋 Checklist Pré-Deploy

- ✅ VPS com Dokploy instalado
- ✅ Domínios apontando para o IP do VPS
- ✅ Acesso SSH ao servidor

---

## 🚀 5 PASSOS RÁPIDOS

### 1️⃣ CONFIGURAR DNS (2 min)

No seu provedor de domínio, adicione:

```
escola.seudominio.com → SEU_IP_VPS
api.escola.seudominio.com → SEU_IP_VPS
```

### 2️⃣ CRIAR PROJETO NO DOKPLOY (3 min)

1. Acesse: `http://SEU_IP_VPS:3000`
2. Create Project → Nome: `synexa-sis`
3. Source:
   - Repository: `https://github.com/albertostress/synexa-sis-2025`
   - Docker Compose: `docker-compose.dokploy.yml`

### 3️⃣ CONFIGURAR VARIÁVEIS (2 min)

Na aba Environment, adicione:

```env
FRONTEND_DOMAIN=escola.seudominio.com
BACKEND_DOMAIN=api.escola.seudominio.com
DB_USER=escola_user
DB_PASSWORD=SenhaForte123!@#
DB_NAME=escola_db
JWT_SECRET=32caracteresaleatorios1234567890
```

### 4️⃣ DEPLOY (3 min)

1. Clique em "Deploy" 🚀
2. Aguarde build completar
3. Verificar todos containers rodando

### 5️⃣ CRIAR ADMIN (2 min)

SSH no servidor e execute:

```bash
cd /var/lib/dokploy/projects/synexa-sis
./scripts/init-dokploy.sh

# Quando solicitado:
Email: admin@escola.com
Senha: [sua senha segura]
```

---

## ✅ PRONTO!

Acesse: `https://escola.seudominio.com`

Login com as credenciais criadas.

---

## 🆘 Problemas?

### Erro 502:
```bash
docker-compose -f docker-compose.dokploy.yml restart
```

### Erro de Database:
```bash
docker logs synexa-sis_postgres_1
docker-compose -f docker-compose.dokploy.yml up -d postgres
```

### Erro de SSL:
- Aguarde 5 minutos
- Verifique DNS: `ping escola.seudominio.com`

---

## 📞 Comandos Úteis

```bash
# Ver logs
docker logs synexa-sis_escola-backend_1 -f

# Reiniciar tudo
docker-compose -f docker-compose.dokploy.yml restart

# Ver status
docker ps | grep synexa

# Backup rápido
docker exec synexa-sis_postgres_1 pg_dump -U escola_user escola_db > backup.sql
```

---

*Deploy mais rápido que fazer café! ☕*