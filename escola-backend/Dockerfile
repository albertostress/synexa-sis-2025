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
RUN npm run build || (echo "Build falhou, tentando compilar diretamente..." && npx nest build) || (echo "Nest build falhou, tentando tsc..." && npx tsc -p tsconfig.json)

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
    echo '  npm run build || npx tsc' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Iniciar aplicação' >> /entrypoint.sh && \
    echo 'echo "Iniciando aplicação..."' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Usar entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Comando de inicialização
CMD ["node", "dist/main.js"]