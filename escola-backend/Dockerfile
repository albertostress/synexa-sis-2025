# Dockerfile otimizado para desenvolvimento com hot reload
FROM node:18-alpine

# Instalar dependências do sistema e Chromium para geração de PDFs
RUN apk update && apk upgrade && \
    apk add --no-cache \
    openssl \
    libc6-compat \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ttf-dejavu \
    ttf-droid \
    ttf-liberation \
    font-noto \
    && rm -rf /var/cache/apk/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas arquivos de dependências para cache de layers
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para desenvolvimento)
RUN npm install

# Configurar variáveis de ambiente para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROMIUM_PATH=/usr/bin/chromium-browser \
    NODE_ENV=development

# Expor porta
EXPOSE 3000

# Copiar script de inicialização
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Para desenvolvimento: não copiar código aqui, será montado via volume
# O Prisma generate será executado em runtime quando necessário

# Usar entrypoint para setup inicial
ENTRYPOINT ["/entrypoint.sh"]

# Comando de inicialização para desenvolvimento com hot reload
CMD ["npm", "run", "start:dev"]