# 🌐 Cloudflare Tunnel - Synexa-SIS

Esta pasta contém a configuração completa do Cloudflare Tunnel para expor o sistema Synexa-SIS online com domínios personalizados.

---

## 📂 Estrutura de Arquivos

```
cloudflare-tunnel/
├── config.yml           # Configuração principal do tunnel
├── start-tunnel.bat     # Script Windows para iniciar o tunnel
├── start-tunnel.sh      # Script Linux/Mac para iniciar o tunnel
├── setup-commands.md    # Comandos detalhados de configuração
└── README.md           # Esta documentação
```

---

## 🚀 Quick Start

### 1. Configuração Inicial (uma vez só)
```bash
# 1. Criar o tunnel
cloudflared tunnel create synexa-tunnel

# 2. Anotar o ID do tunnel que foi criado
# 3. Editar config.yml e substituir TUNNEL-ID pelo ID real
# 4. Configurar DNS
cloudflared tunnel route dns synexa-tunnel backend.synexa.dev
cloudflared tunnel route dns synexa-tunnel frontend.synexa.dev
```

### 2. Executar o Tunnel
```bash
# Linux/Mac
./start-tunnel.sh

# Windows
start-tunnel.bat
```

---

## 🎯 URLs Expostas

Depois de configurar, você terá acesso a:

- **🔧 Backend API**: https://backend.synexa.dev
  - Swagger: https://backend.synexa.dev/api
  - Health Check: https://backend.synexa.dev/health
  - Database: PostgreSQL interno (não exposto)

- **🎨 Frontend**: https://frontend.synexa.dev
  - Interface completa do sistema escolar
  - Hot reload funcionando via tunnel
  - Autenticação JWT integrada

---

## 📋 Pré-requisitos

✅ **Cloudflared instalado**
```bash
# Windows (via Chocolatey)
choco install cloudflared

# Linux/Mac (via package manager ou download direto)
# Veja: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

✅ **Domínio configurado no Cloudflare**
- `synexa.dev` deve estar gerenciado pelo Cloudflare
- DNS deve estar usando os nameservers do Cloudflare

✅ **Login na Cloudflare feito**
```bash
cloudflared login
```

✅ **Serviços locais rodando**
- Backend em `http://localhost:3000` (Docker)
- Frontend em `http://localhost:3001` (Vite dev server)

---

## 🔧 Configuração do config.yml

O arquivo `config.yml` está configurado para:

### Backend (porta 3000)
- **URL**: https://backend.synexa.dev
- **Serviço**: Docker container NestJS
- **Features**: API REST, Swagger, autenticação JWT
- **Headers**: CORS configurado, timeout de 30s

### Frontend (porta 3001)
- **URL**: https://frontend.synexa.dev
- **Serviço**: Vite dev server React
- **Features**: Hot reload via WebSocket, roteamento SPA
- **Headers**: Suporte a WebSocket para desenvolvimento

### Fallback
- Qualquer outro domínio retorna **404**

---

## 🛠️ Scripts Disponíveis

### `start-tunnel.sh` (Linux/Mac)
- Verifica dependências
- Valida configuração
- Inicia o tunnel com logs
- Mostra URLs de acesso

### `start-tunnel.bat` (Windows)
- Mesmas funcionalidades da versão Unix
- Interface Windows nativa
- Pausa automática em caso de erro

---

## 🔍 Monitoramento

### Logs do Tunnel
Os scripts mostram logs em tempo real do tunnel, incluindo:
- Conexões estabelecidas
- Requests roteados
- Erros de conectividade
- Status dos serviços locais

### Health Checks
Você pode monitorar se os serviços estão funcionando:
```bash
# Backend
curl https://backend.synexa.dev/health

# Frontend (deve retornar HTML)
curl -I https://frontend.synexa.dev
```

---

## 🚨 Troubleshooting Comum

### ❌ "tunnel not found"
- Execute: `cloudflared tunnel list`
- Se não existe, execute: `cloudflared tunnel create synexa-tunnel`

### ❌ "connection refused localhost:3000"
- Verifique se o backend Docker está rodando
- Teste: `docker ps` e `curl http://localhost:3000`

### ❌ "connection refused localhost:3001"
- Verifique se o frontend Vite está rodando
- Teste: `npm run dev` e `curl http://localhost:3001`

### ❌ DNS não resolve
- Aguarde 5-10 minutos para propagação
- Verifique no painel Cloudflare se os CNAMEs foram criados
- Teste: `nslookup backend.synexa.dev`

### ❌ CORS errors no frontend
- Verifique se o frontend está configurado para usar `https://backend.synexa.dev`
- Update `VITE_API_BASE_URL` se necessário

---

## 📚 Documentação Oficial

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Configuration Reference](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/configuration/)
- [DNS Configuration](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/routing-to-tunnel/dns/)

---

## 🎉 Próximos Passos

Após configurar o tunnel, você pode:

1. **Compartilhar URLs** com colegas/clientes para testes
2. **Configurar HTTPS** automático (já incluso com Cloudflare)
3. **Monitorar logs** de acesso no painel Cloudflare
4. **Configurar WAF** para proteção adicional
5. **Setup CI/CD** para deploy automático via tunnel

---

**🚀 Happy tunneling! O seu Synexa-SIS agora está acessível globalmente!**