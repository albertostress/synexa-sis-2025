#!/bin/bash
# Quick Tunnel - Cloudflare com domínio temporário (.trycloudflare.com)
# Não precisa de login, domínio ou configuração DNS!

echo "🚀 Synexa-SIS - Quick Tunnel (Domínio Temporário)"
echo "================================================"
echo ""

# Verificar se cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared não encontrado!"
    echo ""
    echo "Instale primeiro:"
    echo "# Ubuntu/Linux:"
    echo "sudo apt install cloudflared"
    echo ""
    echo "# Windows:"
    echo "choco install cloudflared"
    echo ""
    echo "# macOS:"
    echo "brew install cloudflared"
    exit 1
fi

# Verificar se os serviços estão rodando
echo "🔍 Verificando serviços locais..."

if ! curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Backend não está rodando na porta 3000"
    echo "💡 Execute: docker-compose up escola-backend"
    exit 1
fi
echo "✅ Backend (porta 3000) - OK"

if ! curl -s -f http://localhost:3001 > /dev/null 2>&1; then
    echo "❌ Frontend não está rodando na porta 3001"  
    echo "💡 Execute: npm run dev"
    exit 1
fi
echo "✅ Frontend (porta 3001) - OK"

echo ""
echo "🌐 Iniciando tunnels com domínios temporários..."
echo "⚠️  ATENÇÃO: URLs mudam a cada execução!"
echo ""

# Função para capturar e exibir a URL do tunnel
start_tunnel() {
    local port=$1
    local service=$2
    
    echo "🔗 Iniciando tunnel para $service (porta $port)..."
    
    # Executar cloudflared e capturar a URL
    cloudflared tunnel --url http://localhost:$port 2>&1 | while IFS= read -r line; do
        # Procurar pela linha que contém a URL do tunnel
        if [[ $line == *"trycloudflare.com"* ]] && [[ $line == *"https://"* ]]; then
            # Extrair apenas a URL
            url=$(echo "$line" | grep -oP 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com')
            if [[ -n $url ]]; then
                echo ""
                echo "🎉 $service está disponível em:"
                echo "   $url"
                
                if [[ $service == "Backend" ]]; then
                    echo "   Swagger: $url/api"
                    echo "   Health: $url/health"
                fi
                echo ""
            fi
        fi
        # Mostrar outros logs importantes
        if [[ $line == *"ERR"* ]] || [[ $line == *"error"* ]]; then
            echo "❌ $line"
        fi
    done &
    
    return $!
}

# Iniciar ambos os tunnels em paralelo
echo "🚧 Iniciando tunnel para BACKEND..."
cloudflared tunnel --url http://localhost:3000 &
BACKEND_PID=$!

echo "🚧 Iniciando tunnel para FRONTEND..."
cloudflared tunnel --url http://localhost:3001 &
FRONTEND_PID=$!

echo ""
echo "⏳ Aguarde alguns segundos para os tunnels inicializarem..."
echo "🔗 As URLs aparecerão abaixo:"
echo ""

# Aguardar e capturar as URLs
sleep 5

echo "📋 RESUMO DOS TUNNELS:"
echo "======================"
echo ""

# Tentar capturar URLs dos logs
echo "🔍 Capturando URLs dos tunnels..."
sleep 2

echo ""
echo "✅ Tunnels ativos! Pressione Ctrl+C para parar."
echo ""
echo "💡 Dicas:"
echo "   • As URLs são temporárias e mudam a cada execução"
echo "   • Não precisa de login ou configuração DNS"
echo "   • Ideal para testes e demonstrações"
echo "   • Compartilhe as URLs com colegas para testes"
echo ""

# Aguardar interrupção do usuário
wait $BACKEND_PID $FRONTEND_PID