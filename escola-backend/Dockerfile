# Dockerfile otimizado para produção
FROM node:18-alpine AS builder

# Instalar dependências do sistema necessárias
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    postgresql-client

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci --include=dev

# Copiar código fonte
COPY . .

# Verificar arquivos copiados
RUN ls -la && ls -la src/

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação
RUN rm -rf dist && npm run build || (echo "Build falhou, tentando limpar e recompilar..." && rm -rf dist && npx nest build)

# Verificar se o build gerou os arquivos
RUN echo "Verificando resultado do build..." && \
    ls -la /app/ && \
    echo "Conteúdo de dist:" && \
    ls -la /app/dist/ || echo "AVISO: Diretório dist não existe!"

# Stage de produção
FROM node:18-alpine

RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    postgresql-client

WORKDIR /app

# Copiar apenas o necessário do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/nest-cli.json ./nest-cli.json
COPY --from=builder /app/src ./src
# Criar script de build inline
RUN echo '#!/bin/sh' > /app/build.sh && \
    echo 'echo "=== Iniciando processo de build ==="' >> /app/build.sh && \
    echo 'rm -rf dist' >> /app/build.sh && \
    echo 'if [ ! -f tsconfig.json ]; then' >> /app/build.sh && \
    echo '  echo "ERRO: tsconfig.json não encontrado!"' >> /app/build.sh && \
    echo '  exit 1' >> /app/build.sh && \
    echo 'fi' >> /app/build.sh && \
    echo 'echo "Tentando build com Nest CLI..."' >> /app/build.sh && \
    echo 'npx nest build' >> /app/build.sh && \
    echo 'if [ -f dist/main.js ]; then' >> /app/build.sh && \
    echo '  echo "✅ Build com Nest CLI bem-sucedido!"' >> /app/build.sh && \
    echo '  exit 0' >> /app/build.sh && \
    echo 'fi' >> /app/build.sh && \
    echo 'echo "Nest CLI falhou, tentando com tsc..."' >> /app/build.sh && \
    echo 'npx tsc' >> /app/build.sh && \
    echo 'if [ -f dist/main.js ]; then' >> /app/build.sh && \
    echo '  echo "✅ Build com tsc bem-sucedido!"' >> /app/build.sh && \
    echo '  exit 0' >> /app/build.sh && \
    echo 'fi' >> /app/build.sh && \
    echo 'echo "Build completo falhou, tentando compilação manual..."' >> /app/build.sh && \
    echo 'mkdir -p dist' >> /app/build.sh && \
    echo 'npx tsc --skipLibCheck --module commonjs --target ES2017 --experimentalDecorators --emitDecoratorMetadata --outDir dist src/main.ts' >> /app/build.sh && \
    echo 'if [ -f dist/main.js ]; then' >> /app/build.sh && \
    echo '  echo "✅ Build manual bem-sucedido!"' >> /app/build.sh && \
    echo '  exit 0' >> /app/build.sh && \
    echo 'fi' >> /app/build.sh && \
    echo 'echo "❌ ERRO: Não foi possível compilar o projeto!"' >> /app/build.sh && \
    echo 'exit 1' >> /app/build.sh && \
    chmod +x /app/build.sh

# Configurar variáveis de ambiente
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Expor porta
EXPOSE 3000

# Criar script de entrypoint inline com inicialização de banco
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Aguardar PostgreSQL ficar disponível' >> /entrypoint.sh && \
    echo 'echo "Aguardando PostgreSQL..."' >> /entrypoint.sh && \
    echo 'while ! nc -z ${DATABASE_HOST:-postgres} ${DATABASE_PORT:-5432}; do' >> /entrypoint.sh && \
    echo '  sleep 1' >> /entrypoint.sh && \
    echo 'done' >> /entrypoint.sh && \
    echo 'echo "PostgreSQL está disponível!"' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Tentar criar usuário e banco se não existirem' >> /entrypoint.sh && \
    echo 'echo "Verificando/criando usuário e banco de dados..."' >> /entrypoint.sh && \
    echo '# Pular criação de usuário - usar credenciais existentes' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Executar migrações do Prisma' >> /entrypoint.sh && \
    echo 'echo "Executando migrações do banco de dados..."' >> /entrypoint.sh && \
    echo 'npx prisma migrate deploy || npx prisma db push' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Verificar se dist existe, senão compilar' >> /entrypoint.sh && \
    echo 'if [ ! -f /app/dist/main.js ]; then' >> /entrypoint.sh && \
    echo '  echo "Arquivo main.js não encontrado, compilando..."' >> /entrypoint.sh && \
    echo '  sh /app/build.sh || npm run build' >> /entrypoint.sh && \
    echo '  echo "Build concluído, verificando arquivos..."' >> /entrypoint.sh && \
    echo '  ls -la /app/dist/' >> /entrypoint.sh && \
    echo '  if [ ! -f /app/dist/main.js ]; then' >> /entrypoint.sh && \
    echo '    echo "ERRO: Build não gerou main.js! Tentando compilação alternativa..."' >> /entrypoint.sh && \
    echo '    cd /app && npx tsc --outDir dist src/main.ts' >> /entrypoint.sh && \
    echo '    ls -la /app/dist/' >> /entrypoint.sh && \
    echo '  fi' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Aguardar build completar' >> /entrypoint.sh && \
    echo 'sleep 5' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Iniciar aplicação' >> /entrypoint.sh && \
    echo 'echo "Iniciando aplicação..."' >> /entrypoint.sh && \
    echo 'if [ -f /app/dist/main.js ]; then' >> /entrypoint.sh && \
    echo '  exec "$@"' >> /entrypoint.sh && \
    echo 'else' >> /entrypoint.sh && \
    echo '  echo "ERRO FATAL: main.js não existe após build!"' >> /entrypoint.sh && \
    echo '  echo "Conteúdo de /app:"' >> /entrypoint.sh && \
    echo '  ls -la /app/' >> /entrypoint.sh && \
    echo '  echo "Conteúdo de /app/dist:"' >> /entrypoint.sh && \
    echo '  ls -la /app/dist/' >> /entrypoint.sh && \
    echo '  exit 1' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Usar entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Comando de inicialização
CMD ["node", "dist/main.js"]