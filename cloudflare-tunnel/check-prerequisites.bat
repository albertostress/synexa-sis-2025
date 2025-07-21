@echo off
REM Script para verificar todos os pré-requisitos do Cloudflare Tunnel (Windows)

echo 🔍 Verificando pré-requisitos para Cloudflare Tunnel...
echo ==================================================

set ERRORS=0

REM 1. Verificar se cloudflared está instalado
echo.
echo 1. Verificando cloudflared...
where cloudflared >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ cloudflared encontrado
    cloudflared --version 2>nul | head -n1
) else (
    echo ❌ cloudflared não encontrado
    echo    💡 Instale com: choco install cloudflared
    echo    💡 Ou baixe de: https://github.com/cloudflare/cloudflared/releases/latest
    set /a ERRORS+=1
)

REM 2. Verificar login no Cloudflare
echo.
echo 2. Verificando login Cloudflare...
if exist "%USERPROFILE%\.cloudflared\cert.pem" (
    echo ✅ Logado (cert.pem encontrado)
) else (
    echo ❌ Não logado
    echo    💡 Execute: cloudflared login
    set /a ERRORS+=1
)

REM 3. Verificar serviços locais
echo.
echo 3. Verificando backend (porta 3000)...
curl -s -f http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend rodando
) else (
    echo ❌ Backend não responde
    echo    💡 Inicie o backend: docker-compose up escola-backend
    set /a ERRORS+=1
)

echo.
echo 4. Verificando frontend (porta 3001)...
curl -s -f http://localhost:3001 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend rodando
) else (
    echo ❌ Frontend não responde
    echo    💡 Inicie o frontend: npm run dev
    set /a ERRORS+=1
)

REM 5. Verificar arquivo de configuração
echo.
echo 5. Verificando config.yml...
set CONFIG_FILE=%~dp0config.yml
if exist "%CONFIG_FILE%" (
    findstr "TUNNEL-ID" "%CONFIG_FILE%" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ⚠️  config.yml precisa ser configurado
        echo    💡 Substitua TUNNEL-ID pelo ID real após criar o tunnel
    ) else (
        echo ✅ config.yml configurado
    )
) else (
    echo ❌ config.yml não encontrado
    set /a ERRORS+=1
)

REM 6. Verificar conectividade
echo.
echo 6. Verificando conectividade Cloudflare...
curl -s -f https://api.cloudflare.com/client/v4 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Conectividade OK
) else (
    echo ❌ Falha de conexão com Cloudflare
    echo    💡 Verifique sua conexão à internet
    set /a ERRORS+=1
)

echo.
echo ==================================================

if %ERRORS% EQU 0 (
    echo 🎉 Tudo pronto! Você pode executar o tunnel.
    echo.
    echo Próximos passos:
    echo 1. Se config.yml ainda tem TUNNEL-ID, execute: cloudflared tunnel create synexa-tunnel
    echo 2. Edite config.yml com o ID real do tunnel
    echo 3. Configure DNS: cloudflared tunnel route dns synexa-tunnel backend.synexa.dev
    echo 4. Execute: start-tunnel.bat
) else (
    echo ❌ Encontrados %ERRORS% problemas. Corrija-os antes de continuar.
    echo.
    if %ERRORS% GEQ 2 (
        if not exist "%USERPROFILE%\.cloudflared\cert.pem" (
            echo 💡 Dica: Comece executando 'cloudflared login' primeiro!
        )
    )
)

echo.
pause