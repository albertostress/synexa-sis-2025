@echo off
REM Script para atualizar configuração do frontend para usar tunnel

echo 🔧 Configurando frontend para usar Cloudflare Tunnel...
echo ================================================

set FRONTEND_DIR=%~dp0..\escola-frontend

REM Fazer backup do .env original
if not exist "%FRONTEND_DIR%\.env.backup" (
    copy "%FRONTEND_DIR%\.env" "%FRONTEND_DIR%\.env.backup"
    echo ✅ Backup criado: .env.backup
)

REM Perguntar a URL do backend tunnel
echo.
echo 📝 Cole a URL do seu BACKEND tunnel:
echo    Exemplo: https://poll-identifier-taking-austria.trycloudflare.com
echo.
set /p BACKEND_URL="Backend URL: "

REM Validar URL
echo %BACKEND_URL% | findstr "https://" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ URL inválida! Deve começar com https://
    pause
    exit /b 1
)

REM Criar novo .env
echo # Configuração para Cloudflare Tunnel > "%FRONTEND_DIR%\.env"
echo VITE_API_URL=%BACKEND_URL% >> "%FRONTEND_DIR%\.env"
echo VITE_PORT=3001 >> "%FRONTEND_DIR%\.env"

echo.
echo ✅ Configuração atualizada!
echo 📄 Arquivo: %FRONTEND_DIR%\.env
echo 🔗 Backend URL: %BACKEND_URL%
echo.
echo ⚠️  O Vite vai reiniciar automaticamente
echo 💡 Aguarde alguns segundos e teste novamente
echo.

REM Mostrar instruções finais
echo 🎯 Próximos passos:
echo    1. Aguarde o Vite reiniciar
echo    2. Acesse: seu-frontend.trycloudflare.com
echo    3. Faça login: admin@escola.com / 123456
echo.
echo 🔄 Para voltar ao modo local:
echo    copy "%FRONTEND_DIR%\.env.backup" "%FRONTEND_DIR%\.env"
echo.

pause