FROM node:20-alpine

WORKDIR /app

# Copia apenas o package.json e instala dependências primeiro
COPY package.json package-lock.json* ./
RUN npm install

# Copia o resto do código
COPY . .

# Expõe a porta 3001
EXPOSE 3001

# Comando padrão para dev (não build)
CMD ["npm", "run", "dev", "--", "--host"]