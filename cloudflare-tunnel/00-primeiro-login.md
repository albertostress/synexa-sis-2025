# 🔐 Primeiro Acesso - Cloudflare Login

Como você ainda não fez login no Cloudflare, siga estes passos **antes** de configurar o tunnel.

---

## 📋 **Pré-requisitos**

1. ✅ **Conta no Cloudflare** - Crie em https://dash.cloudflare.com/sign-up se não tiver
2. ✅ **Domínio synexa.dev** adicionado ao Cloudflare (ou outro domínio seu)
3. ✅ **cloudflared instalado**

---

## 1️⃣ **Instalar cloudflared (se não tiver)**

### Windows:
```powershell
# Via Chocolatey (recomendado)
choco install cloudflared

# OU baixar diretamente
# https://github.com/cloudflare/cloudflared/releases/latest
# Baixe cloudflared-windows-amd64.exe
# Renomeie para cloudflared.exe
# Mova para uma pasta no PATH (ex: C:\Windows\System32)
```

### Linux/Ubuntu/WSL:
```bash
# Via wget (Ubuntu/Debian)
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# OU via package manager
sudo apt update && sudo apt install cloudflared
```

### macOS:
```bash
# Via Homebrew
brew install cloudflared

# OU via download direto
curl -L --output cloudflared.tgz https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz
tar -xzf cloudflared.tgz
sudo mv cloudflared /usr/local/bin
sudo chmod +x /usr/local/bin/cloudflared
```

---

## 2️⃣ **Verificar Instalação**

```bash
cloudflared --version
```

**Resultado esperado:**
```
cloudflared version 2023.x.x (built YYYY-MM-DD-TTTT UTC)
```

---

## 3️⃣ **Fazer Login no Cloudflare**

```bash
cloudflared login
```

**O que vai acontecer:**
1. 🌐 **Abrirá uma página web** no seu navegador
2. 🔐 **Faça login** na sua conta Cloudflare
3. ✅ **Autorize o cloudflared** a acessar sua conta
4. 📋 **Selecione o domínio** synexa.dev (ou seu domínio)
5. ✅ **Confirme** a autorização

**Resultado esperado:**
```
You have successfully logged in.
If you wish to copy your credentials to a server, they have been saved to:
/home/user/.cloudflared/cert.pem
```

---

## 4️⃣ **Verificar se o Login Funcionou**

```bash
# Listar seus domínios
cloudflared tunnel list

# OU verificar o arquivo de certificado
ls ~/.cloudflared/
```

**Windows:**
```cmd
dir C:\Users\%USERNAME%\.cloudflared\
```

Deve aparecer um arquivo `cert.pem` - isso significa que o login foi bem-sucedido!

---

## 5️⃣ **Verificar seu Domínio no Cloudflare**

Acesse https://dash.cloudflare.com e verifique:

1. ✅ **synexa.dev está listado** nos seus domínios
2. ✅ **Status = Active** (nameservers apontando para Cloudflare)
3. ✅ **Cloudflare SSL** habilitado

---

## ❌ **Problemas Comuns**

### "command not found: cloudflared"
- cloudflared não foi instalado corretamente
- No Windows: adicione o .exe ao PATH
- No Linux: use `sudo dpkg -i` ou `apt install`

### "Failed to authenticate"
- Verifique sua conexão à internet
- Tente em outro navegador
- Limpe cookies do Cloudflare

### "Domain not found"
- O domínio synexa.dev não está na sua conta
- Adicione o domínio no painel Cloudflare primeiro

### "No zones found"
- Você não tem domínios ativos no Cloudflare
- Adicione um domínio primeiro no dash.cloudflare.com

---

## ✅ **Próximo Passo**

Depois que o login estiver funcionando, continue com:
📄 **setup-commands.md** - Para criar e configurar o tunnel

---

## 🆘 **Precisa de Ajuda?**

Se você não tem domínio próprio, pode:

1. **Comprar um domínio barato** (ex: .dev, .com, .net)
2. **Transferir para Cloudflare** (gratuito)
3. **OU usar subdomínio gratuito** de serviços como:
   - FreeDNS (afraid.org) 
   - No-IP
   - DuckDNS

**Exemplo com FreeDNS:**
- Crie conta em https://freedns.afraid.org
- Registre: `meusite.chickenkiller.com`
- Configure no Cloudflare como domínio externo

---

**🚀 Execute o login primeiro, depois volta para os outros arquivos!**