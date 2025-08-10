#!/bin/bash

# Script de backup automático para Synexa-SIS no Dokploy
# Configurar no cron para execução diária: 0 2 * * * /path/to/backup-dokploy.sh

# Configurações
BACKUP_DIR="/var/backups/synexa-sis"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Iniciando backup do Synexa-SIS...${NC}"

# Detectar containers
POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "postgres|database" | head -n1)
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}✗ Container PostgreSQL não encontrado${NC}"
    exit 1
fi

# 1. Backup do banco de dados
echo -e "${YELLOW}Fazendo backup do banco de dados...${NC}"
docker exec $POSTGRES_CONTAINER pg_dump -U ${DB_USER:-user} ${DB_NAME:-escola_db} | gzip > $BACKUP_DIR/database_$DATE.sql.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup do banco criado: database_$DATE.sql.gz${NC}"
else
    echo -e "${RED}✗ Erro ao criar backup do banco${NC}"
    exit 1
fi

# 2. Backup de uploads e arquivos
echo -e "${YELLOW}Fazendo backup de arquivos...${NC}"
if [ -d "/var/lib/dokploy/projects/synexa-sis/files" ]; then
    tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C /var/lib/dokploy/projects/synexa-sis files/
    echo -e "${GREEN}✓ Backup de arquivos criado: files_$DATE.tar.gz${NC}"
fi

# 3. Backup de configurações
echo -e "${YELLOW}Fazendo backup de configurações...${NC}"
if [ -f "/var/lib/dokploy/projects/synexa-sis/.env.dokploy" ]; then
    cp /var/lib/dokploy/projects/synexa-sis/.env.dokploy $BACKUP_DIR/env_$DATE.txt
    echo -e "${GREEN}✓ Backup de configurações criado: env_$DATE.txt${NC}"
fi

# 4. Limpar backups antigos
echo -e "${YELLOW}Removendo backups com mais de $RETENTION_DAYS dias...${NC}"
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}✓ Limpeza concluída${NC}"

# 5. Listar backups atuais
echo -e "${GREEN}Backups disponíveis:${NC}"
ls -lh $BACKUP_DIR | tail -n 5

echo -e "${GREEN}✅ Backup completo!${NC}"

# Opcional: Enviar para storage externo (S3, etc)
# aws s3 cp $BACKUP_DIR/database_$DATE.sql.gz s3://seu-bucket/backups/
# rclone copy $BACKUP_DIR/database_$DATE.sql.gz remote:backups/