FROM mcr.microsoft.com/playwright:v1.48.1-jammy

WORKDIR /app

# Instalar dependências necessárias
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código do serviço
COPY . .

# Expor porta para o serviço
EXPOSE 3333

# Comando para iniciar o serviço
CMD ["node", "server.js"]