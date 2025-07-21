#!/bin/bash
# Script para atualizar configuração do frontend para usar tunnel

echo "🔧 Configurando frontend para usar Cloudflare Tunnel..."
echo "================================================"

FRONTEND_DIR="$(dirname "$0")/../escola-frontend"

# Fazer backup do .env original
if [ ! -f "$FRONTEND_DIR/.env.backup" ]; then
    cp "$FRONTEND_DIR/.env" "$FRONTEND_DIR/.env.backup"
    echo "✅ Backup criado: .env.backup"
fi

# Perguntar a URL do backend tunnel
echo ""
echo "📝 Cole a URL do seu BACKEND tunnel:"
echo "   Exemplo: https://poll-identifier-taking-austria.trycloudflare.com"
echo ""
read -p "Backend URL: " BACKEND_URL

# Validar URL
if [[ ! $BACKEND_URL == https://* ]]; then
    echo "❌ URL inválida! Deve começar com https://"
    exit 1
fi

# Criar novo .env
cat > "$FRONTEND_DIR/.env" << EOF
# Configuração para Cloudflare Tunnel
VITE_API_URL=$BACKEND_URL
VITE_PORT=3001
EOF

echo ""
echo "✅ Configuração atualizada!"
echo "📄 Arquivo: $FRONTEND_DIR/.env"
echo "🔗 Backend URL: $BACKEND_URL"
echo ""
echo "⚠️  O Vite vai reiniciar automaticamente"
echo "💡 Aguarde alguns segundos e teste novamente"
echo ""

# Mostrar instruções finais
echo "🎯 Próximos passos:"
echo "   1. Aguarde o Vite reiniciar"
echo "   2. Acesse: seu-frontend.trycloudflare.com"
echo "   3. Faça login: admin@escola.com / 123456"
echo ""
echo "🔄 Para voltar ao modo local:"
echo "   cp $FRONTEND_DIR/.env.backup $FRONTEND_DIR/.env"
echo ""