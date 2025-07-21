@echo off
REM Script para iniciar Cloudflare Tunnel no Windows
REM Synexa-SIS - Backend e Frontend

echo ========================================
echo   Synexa-SIS Cloudflare Tunnel
echo   Backend:  https://backend.synexa.dev
echo   Frontend: https://frontend.synexa.dev
echo ========================================
echo.

REM Verificar se cloudflared está instalado
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] cloudflared não encontrado!
    echo Por favor, instale: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
    pause
    exit /b 1
)

REM Caminho para o config.yml (ajustar se necessário)
set CONFIG_PATH=%~dp0config.yml

REM Verificar se o arquivo de configuração existe
if not exist "%CONFIG_PATH%" (
    echo [ERRO] Arquivo config.yml não encontrado em: %CONFIG_PATH%
    pause
    exit /b 1
)

echo [INFO] Iniciando tunnel com configuração: %CONFIG_PATH%
echo [INFO] Pressione Ctrl+C para parar o tunnel
echo.

REM Executar o tunnel
cloudflared tunnel run --config "%CONFIG_PATH%" synexa-tunnel

pause