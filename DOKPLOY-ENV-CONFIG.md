# 🔧 Configuração de Variáveis de Ambiente no Dokploy

## ⚠️ IMPORTANTE: Configure estas variáveis no Dokploy!

### 📝 No Painel Dokploy:

1. Vá para seu projeto
2. Clique na aba **"Environment"**
3. Adicione TODAS estas variáveis:

```env
# DOMÍNIOS (OBRIGATÓRIO - ajuste para seus domínios)
FRONTEND_DOMAIN=escola.seudominio.com
BACKEND_DOMAIN=api.escola.seudominio.com

# DATABASE (OBRIGATÓRIO)
DB_USER=escola_user
DB_PASSWORD=SuaSenhaSegura123!
DB_NAME=escola_db

# JWT (OBRIGATÓRIO - gere uma string aleatória de 32+ caracteres)
JWT_SECRET=gere32caracteresaleatoriosaqui1234567890ABCDEF

# EMAIL (OPCIONAL - deixe vazio se não usar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@escola.com

# IMPORTANTE PARA O FRONTEND (BUILD TIME)
VITE_API_URL=https://api.escola.seudominio.com
```

## 🚨 ERRO 405 - Como Resolver

Se você está vendo erro 405 no navegador:

### Para Desenvolvimento Local:
```env
# No arquivo escola-frontend/.env
VITE_API_URL=http://localhost:3000
```

### Para Produção (Dokploy):
```env
# Nas variáveis de ambiente do Dokploy
VITE_API_URL=https://api.escola.seudominio.com
```

## ⚡ Script Rápido para Dokploy

Se preferir, crie um arquivo `.env.dokploy` no servidor:

```bash
# SSH no servidor
cd /etc/dokploy/compose/[seu-projeto]/code

# Crie o arquivo
cat > .env.dokploy << 'EOF'
FRONTEND_DOMAIN=escola.seudominio.com
BACKEND_DOMAIN=api.escola.seudominio.com
DB_USER=escola_user
DB_PASSWORD=SenhaForte123!
DB_NAME=escola_db
JWT_SECRET=32caracteresaleatorios1234567890
VITE_API_URL=https://api.escola.seudominio.com
EOF
```

## 🔄 Após Configurar:

1. **Salve as variáveis**
2. **Clique em "Redeploy"**
3. **Aguarde o build completar**

## ✅ Verificação:

Teste se funcionou:
```bash
# No servidor
curl https://api.escola.seudominio.com/health
curl https://escola.seudominio.com
```

## 🎯 Resumo dos Domínios:

| Serviço | URL Local | URL Produção |
|---------|-----------|--------------|
| Frontend | http://localhost:3001 | https://escola.seudominio.com |
| Backend API | http://localhost:3000 | https://api.escola.seudominio.com |
| API Docs | http://localhost:3000/api | https://api.escola.seudominio.com/api |

## 📞 Teste de Login:

Com os usuários criados anteriormente:
- **admin@escola.com** / admin123
- **secretaria@escola.com** / secretaria123
- **professor@escola.com** / professor123

---

**Nota:** O erro 405 geralmente ocorre quando o frontend tenta chamar sua própria URL ao invés da API. Certifique-se que `VITE_API_URL` está configurado corretamente!