#!/bin/bash
# Script para iniciar Cloudflare Tunnel no Linux/Mac
# Synexa-SIS - Backend e Frontend

echo "========================================"
echo "  Synexa-SIS Cloudflare Tunnel"
echo "  Backend:  https://backend.synexa.dev"
echo "  Frontend: https://frontend.synexa.dev"
echo "========================================"
echo

# Verificar se cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "[ERRO] cloudflared não encontrado!"
    echo "Por favor, instale: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    exit 1
fi

# Caminho para o config.yml
CONFIG_PATH="$(dirname "$0")/config.yml"

# Verificar se o arquivo de configuração existe
if [ ! -f "$CONFIG_PATH" ]; then
    echo "[ERRO] Arquivo config.yml não encontrado em: $CONFIG_PATH"
    exit 1
fi

echo "[INFO] Iniciando tunnel com configuração: $CONFIG_PATH"
echo "[INFO] Pressione Ctrl+C para parar o tunnel"
echo

# Executar o tunnel
cloudflared tunnel run --config "$CONFIG_PATH" synexa-tunnel