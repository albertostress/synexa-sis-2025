#!/bin/bash

# Fix para adicionar SECRETARIA ao endpoint de summary financeiro

docker exec escola-backend sed -i "s/@Roles('ADMIN', 'DIRETOR')/@Roles('ADMIN', 'SECRETARIA', 'DIRETOR')/g" /app/src/finance/finance.controller.ts

echo "Roles atualizadas. Reiniciando backend..."
docker restart escola-backend

echo "Aguardando backend inicializar..."
sleep 10

echo "Correção aplicada com sucesso!"