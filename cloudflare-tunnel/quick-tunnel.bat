@echo off
REM Quick Tunnel - Cloudflare com domínio temporário (.trycloudflare.com)
REM Não precisa de login, domínio ou configuração DNS!

title Synexa-SIS Quick Tunnel

echo 🚀 Synexa-SIS - Quick Tunnel (Domínio Temporário)
echo ================================================
echo.

REM Verificar se cloudflared está instalado
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ cloudflared não encontrado!
    echo.
    echo Instale primeiro:
    echo # Windows ^(PowerShell como Admin^):
    echo choco install cloudflared
    echo.
    echo # Ou baixe diretamente:
    echo https://github.com/cloudflare/cloudflared/releases/latest
    pause
    exit /b 1
)

REM Verificar se os serviços estão rodando
echo 🔍 Verificando serviços locais...

curl -s -f http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend não está rodando na porta 3000
    echo 💡 Execute: docker-compose up escola-backend
    pause
    exit /b 1
)
echo ✅ Backend ^(porta 3000^) - OK

curl -s -f http://localhost:3001 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend não está rodando na porta 3001
    echo 💡 Execute: npm run dev
    pause
    exit /b 1
)
echo ✅ Frontend ^(porta 3001^) - OK

echo.
echo 🌐 Iniciando tunnels com domínios temporários...
echo ⚠️  ATENÇÃO: URLs mudam a cada execução!
echo.

REM Criar diretório temporário para logs
if not exist "%TEMP%\synexa-tunnel" mkdir "%TEMP%\synexa-tunnel"

echo 🚧 Iniciando tunnel para BACKEND...
start "Backend Tunnel" /min cloudflared tunnel --url http://localhost:3000

echo 🚧 Iniciando tunnel para FRONTEND...  
start "Frontend Tunnel" /min cloudflared tunnel --url http://localhost:3001

echo.
echo ⏳ Aguarde alguns segundos para os tunnels inicializarem...
echo 🔗 Verifique as janelas minimizadas para ver as URLs!
echo.

timeout /t 5 /nobreak >nul

echo 📋 INSTRUÇÕES:
echo ==============
echo.
echo ✅ Tunnels iniciados em janelas separadas!
echo.
echo 🔍 Para ver as URLs:
echo    1. Verifique as janelas "Backend Tunnel" e "Frontend Tunnel" na barra de tarefas
echo    2. As URLs aparecem como: https://xxxxxxx.trycloudflare.com
echo    3. Copie e compartilhe essas URLs para testes
echo.
echo 💡 Dicas:
echo    • As URLs são temporárias e mudam a cada execução
echo    • Não precisa de login ou configuração DNS
echo    • Ideal para testes e demonstrações
echo    • Backend: adicione /api no final para Swagger
echo.
echo ⚠️  Para parar os tunnels:
echo    • Feche as janelas "Backend Tunnel" e "Frontend Tunnel"
echo    • Ou use o Gerenciador de Tarefas
echo.
echo Pressione qualquer tecla para continuar...
pause >nul