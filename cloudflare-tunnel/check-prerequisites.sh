#!/bin/bash
# Script para verificar todos os pré-requisitos do Cloudflare Tunnel

echo "🔍 Verificando pré-requisitos para Cloudflare Tunnel..."
echo "=================================================="

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Verificar se cloudflared está instalado
echo -n "1. Verificando cloudflared... "
if command -v cloudflared &> /dev/null; then
    VERSION=$(cloudflared --version 2>/dev/null | head -n1)
    echo -e "${GREEN}✅ Instalado${NC} ($VERSION)"
else
    echo -e "${RED}❌ Não encontrado${NC}"
    echo "   💡 Instale com: sudo apt install cloudflared (Linux) ou choco install cloudflared (Windows)"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar login no Cloudflare
echo -n "2. Verificando login Cloudflare... "
if [ -f ~/.cloudflared/cert.pem ]; then
    echo -e "${GREEN}✅ Logado${NC} (cert.pem encontrado)"
else
    echo -e "${RED}❌ Não logado${NC}"
    echo "   💡 Execute: cloudflared login"
    ERRORS=$((ERRORS + 1))
fi

# 3. Verificar serviços locais
echo -n "3. Verificando backend (porta 3000)... "
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Rodando${NC}"
else
    echo -e "${RED}❌ Não responde${NC}"
    echo "   💡 Inicie o backend: docker-compose up escola-backend"
    ERRORS=$((ERRORS + 1))
fi

echo -n "4. Verificando frontend (porta 3001)... "
if curl -s -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Rodando${NC}"
else
    echo -e "${RED}❌ Não responde${NC}"
    echo "   💡 Inicie o frontend: npm run dev"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verificar arquivo de configuração
echo -n "5. Verificando config.yml... "
CONFIG_FILE="$(dirname "$0")/config.yml"
if [ -f "$CONFIG_FILE" ]; then
    if grep -q "TUNNEL-ID" "$CONFIG_FILE"; then
        echo -e "${YELLOW}⚠️  Precisa configurar${NC}"
        echo "   💡 Substitua TUNNEL-ID pelo ID real após criar o tunnel"
    else
        echo -e "${GREEN}✅ Configurado${NC}"
    fi
else
    echo -e "${RED}❌ Não encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 6. Verificar conectividade de rede
echo -n "6. Verificando conectividade Cloudflare... "
if curl -s -f https://api.cloudflare.com/client/v4 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Falha de conexão${NC}"
    echo "   💡 Verifique sua conexão à internet"
    ERRORS=$((ERRORS + 1))
fi

echo "=================================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Tudo pronto! Você pode executar o tunnel.${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Se config.yml ainda tem TUNNEL-ID, execute: cloudflared tunnel create synexa-tunnel"
    echo "2. Edite config.yml com o ID real do tunnel"
    echo "3. Configure DNS: cloudflared tunnel route dns synexa-tunnel backend.synexa.dev"
    echo "4. Execute: ./start-tunnel.sh"
else
    echo -e "${RED}❌ Encontrados $ERRORS problemas. Corrija-os antes de continuar.${NC}"
    
    if [ $ERRORS -ge 2 ] && [ ! -f ~/.cloudflared/cert.pem ]; then
        echo ""
        echo -e "${YELLOW}💡 Dica: Comece executando 'cloudflared login' primeiro!${NC}"
    fi
fi