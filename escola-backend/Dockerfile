# Dockerfile otimizado para desenvolvimento com hot reload
FROM node:18-alpine

# Instalar dependências do sistema necessárias
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas arquivos de dependências para cache de layers
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para desenvolvimento)
RUN npm install

# Configurar variáveis de ambiente para Playwright
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
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