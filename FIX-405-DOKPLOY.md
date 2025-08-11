# 🔧 Correção do Erro 405 no Dokploy

## ❌ Problema Identificado
O frontend está enviando requisições para **si mesmo** (`https://escola.kiandaedge.online/auth/login`) ao invés da **API** (`https://api.kiandaedge.online/auth/login`).

## ✅ Solução Rápida

### 1. Configure as Variáveis de Ambiente no Dokploy

No painel Dokploy, vá em **Environment** e adicione/confirme:

```env
BACKEND_DOMAIN=api.kiandaedge.online
FRONTEND_DOMAIN=escola.kiandaedge.online
```

### 2. Verifique o docker-compose.dokploy.yml

O arquivo já foi corrigido para:

```yaml
escola-frontend:
  build:
    context: ./escola-frontend
    dockerfile: Dockerfile.dokploy
    args:
      VITE_API_URL: https://${BACKEND_DOMAIN}
```

### 3. Faça o Redeploy

1. No Dokploy, clique em **"Redeploy"**
2. Aguarde o build completar
3. Verifique nos logs de build se aparece:
   ```
   Building frontend with API URL: https://api.kiandaedge.online
   ```

## 🔍 Como Verificar se Funcionou

### No Browser (DevTools):
1. Abra **F12** → **Network**
2. Tente fazer login
3. A requisição deve ir para: `https://api.kiandaedge.online/auth/login`
4. **NÃO** para: `https://escola.kiandaedge.online/auth/login`

### Via Terminal:
```bash
# Teste direto na API
curl -X POST https://api.kiandaedge.online/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.com","password":"admin123"}'
```

## 📝 Checklist de Verificação

- [ ] `BACKEND_DOMAIN` está configurado como `api.kiandaedge.online`
- [ ] `FRONTEND_DOMAIN` está configurado como `escola.kiandaedge.online`
- [ ] O build do frontend mostra `Building frontend with API URL: https://api.kiandaedge.online`
- [ ] As requisições no DevTools vão para `https://api.kiandaedge.online/*`
- [ ] Login funciona com as credenciais de teste

## 🎯 Credenciais de Teste

```
admin@escola.com / admin123
secretaria@escola.com / secretaria123
professor@escola.com / professor123
```

## ⚠️ Se Ainda Não Funcionar

1. **Force rebuild sem cache:**
   ```bash
   # No servidor via SSH
   cd /etc/dokploy/compose/[seu-projeto]/code
   docker-compose -f docker-compose.dokploy.yml build --no-cache escola-frontend
   docker-compose -f docker-compose.dokploy.yml up -d escola-frontend
   ```

2. **Verifique se a variável está chegando no build:**
   ```bash
   docker exec [container-frontend] cat /usr/share/nginx/html/index.html | grep -i api
   ```

3. **Limpe o cache do browser:**
   - CTRL+SHIFT+R (Windows/Linux)
   - CMD+SHIFT+R (Mac)

---

**O erro 405 acontece porque o Nginx do frontend não aceita POST. A solução é garantir que as requisições vão para a API correta!**