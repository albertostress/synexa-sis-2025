# Multi-stage build para produção
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files e instalar dependências
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copiar código fonte e fazer build de produção
COPY . .
RUN npm run build

# Stage de produção com Nginx
FROM nginx:alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Remover config padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copiar build da aplicação React
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

CMD ["nginx", "-g", "daemon off;"]