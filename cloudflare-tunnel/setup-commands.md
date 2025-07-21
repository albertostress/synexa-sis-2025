# 🚀 Comandos para Configurar Cloudflare Tunnel - Synexa-SIS

## 📋 Pré-requisitos
✅ Domínio `synexa.dev` já configurado no Cloudflare  
✅ `cloudflared` já instalado  
✅ Já executou `cloudflared login`  

---

## 1️⃣ Criar o Tunnel

```bash
# Criar tunnel chamado "synexa-tunnel"
cloudflared tunnel create synexa-tunnel
```

**Resultado esperado:**
- Será criado um arquivo JSON em `~/.cloudflared/` (Linux/Mac) ou `C:\Users\SEU_USUARIO\.cloudflared\` (Windows)
- O nome do arquivo será algo como: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json`
- Anote o ID do tunnel (nome do arquivo sem `.json`)

---

## 2️⃣ Atualizar config.yml

Depois de criar o tunnel, edite o arquivo `config.yml` e substitua:

```yml
# Antes
tunnel: TUNNEL-ID
credentials-file: /home/user/.cloudflared/TUNNEL-ID.json

# Depois (com seu ID real)
tunnel: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
credentials-file: ~/.cloudflared/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json
```

### Windows:
```yml
credentials-file: C:\Users\SEU_USUARIO\.cloudflared\xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json
```

---

## 3️⃣ Configurar DNS no Cloudflare

Execute estes comandos para criar os registros DNS:

```bash
# Backend
cloudflared tunnel route dns synexa-tunnel backend.synexa.dev

# Frontend  
cloudflared tunnel route dns synexa-tunnel frontend.synexa.dev
```

**OU manualmente no painel Cloudflare:**
1. Vá para **DNS > Records**
2. Adicione dois registros **CNAME**:
   - `backend` → `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.cfargotunnel.com`
   - `frontend` → `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.cfargotunnel.com`

---

## 4️⃣ Testar a Configuração

```bash
# Validar o config.yml
cloudflared tunnel ingress validate --config config.yml

# Testar as rotas
cloudflared tunnel ingress url --config config.yml https://backend.synexa.dev
cloudflared tunnel ingress url --config config.yml https://frontend.synexa.dev
```

---

## 5️⃣ Executar o Tunnel

### Linux/Mac:
```bash
./start-tunnel.sh
```

### Windows:
```cmd
start-tunnel.bat
```

### Manual:
```bash
cloudflared tunnel run --config config.yml synexa-tunnel
```

---

## 🎯 URLs Finais

Após configurar tudo:
- **Backend API**: https://backend.synexa.dev
- **Frontend**: https://frontend.synexa.dev
- **Swagger Docs**: https://backend.synexa.dev/api

---

## 🔧 Troubleshooting

### Erro: "tunnel not found"
```bash
# Listar tunnels existentes
cloudflared tunnel list

# Se não existe, criar novamente
cloudflared tunnel create synexa-tunnel
```

### Erro: "credentials file not found"
- Verifique o caminho no `config.yml`
- O arquivo deve estar em `~/.cloudflared/` ou `C:\Users\SEU_USUARIO\.cloudflared\`

### Erro: "connection refused"
- Verifique se o backend está rodando na porta 3000
- Verifique se o frontend está rodando na porta 3001
- Teste localmente: `curl http://localhost:3000` e `curl http://localhost:3001`

### DNS não resolve
- Aguarde alguns minutos para propagação do DNS
- Use `dig backend.synexa.dev` ou `nslookup backend.synexa.dev` para verificar