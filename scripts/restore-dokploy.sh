#!/bin/bash

# Script de restauração para Synexa-SIS no Dokploy

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar se foi passado arquivo de backup
if [ $# -eq 0 ]; then
    echo -e "${RED}Uso: ./restore-dokploy.sh <data_backup>${NC}"
    echo -e "${YELLOW}Exemplo: ./restore-dokploy.sh 20240101_020000${NC}"
    echo ""
    echo "Backups disponíveis:"
    ls -lh /var/backups/synexa-sis/ | grep database_
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="/var/backups/synexa-sis"

# Detectar containers
POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "postgres|database" | head -n1)
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}✗ Container PostgreSQL não encontrado${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá substituir todos os dados atuais!${NC}"
read -p "Tem certeza que deseja continuar? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${RED}Operação cancelada${NC}"
    exit 1
fi

# 1. Parar aplicação
echo -e "${YELLOW}Parando aplicação...${NC}"
docker stop $BACKEND_CONTAINER

# 2. Restaurar banco de dados
if [ -f "$BACKUP_DIR/database_$BACKUP_DATE.sql.gz" ]; then
    echo -e "${YELLOW}Restaurando banco de dados...${NC}"
    
    # Limpar banco atual
    docker exec $POSTGRES_CONTAINER psql -U ${DB_USER:-user} -c "DROP DATABASE IF EXISTS ${DB_NAME:-escola_db};"
    docker exec $POSTGRES_CONTAINER psql -U ${DB_USER:-user} -c "CREATE DATABASE ${DB_NAME:-escola_db};"
    
    # Restaurar backup
    gunzip -c $BACKUP_DIR/database_$BACKUP_DATE.sql.gz | docker exec -i $POSTGRES_CONTAINER psql -U ${DB_USER:-user} ${DB_NAME:-escola_db}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Banco de dados restaurado${NC}"
    else
        echo -e "${RED}✗ Erro ao restaurar banco de dados${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Arquivo de backup do banco não encontrado: database_$BACKUP_DATE.sql.gz${NC}"
    exit 1
fi

# 3. Restaurar arquivos (se existir)
if [ -f "$BACKUP_DIR/files_$BACKUP_DATE.tar.gz" ]; then
    echo -e "${YELLOW}Restaurando arquivos...${NC}"
    
    # Limpar diretório atual
    rm -rf /var/lib/dokploy/projects/synexa-sis/files/*
    
    # Extrair backup
    tar -xzf $BACKUP_DIR/files_$BACKUP_DATE.tar.gz -C /var/lib/dokploy/projects/synexa-sis/
    
    echo -e "${GREEN}✓ Arquivos restaurados${NC}"
else
    echo -e "${YELLOW}⚠️  Backup de arquivos não encontrado (opcional)${NC}"
fi

# 4. Restaurar configurações (se existir)
if [ -f "$BACKUP_DIR/env_$BACKUP_DATE.txt" ]; then
    echo -e "${YELLOW}Configurações disponíveis em: $BACKUP_DIR/env_$BACKUP_DATE.txt${NC}"
    echo -e "${YELLOW}Revise e atualize manualmente se necessário${NC}"
fi

# 5. Reiniciar aplicação
echo -e "${YELLOW}Reiniciando aplicação...${NC}"
docker start $BACKEND_CONTAINER

# Aguardar aplicação ficar pronta
sleep 10

# 6. Verificar saúde
echo -e "${YELLOW}Verificando status da aplicação...${NC}"
if docker exec $BACKEND_CONTAINER curl -f http://localhost:3000/health &>/dev/null; then
    echo -e "${GREEN}✓ Aplicação está funcionando!${NC}"
else
    echo -e "${RED}✗ Aplicação não está respondendo. Verifique os logs:${NC}"
    echo -e "${YELLOW}docker logs $BACKEND_CONTAINER${NC}"
fi

echo -e "${GREEN}✅ Restauração concluída!${NC}"