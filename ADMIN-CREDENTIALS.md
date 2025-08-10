# 🔑 Credenciais dos Usuários - Synexa-SIS

## 👥 Usuários de Teste

Para desenvolvimento e testes, você pode criar 3 usuários padrão executando:

```bash
./scripts/create-test-users.sh
```

Isso criará:

| Papel | Email | Senha | Acesso |
|-------|-------|-------|--------|
| **Admin** | admin@escola.com | admin123 | Total ao sistema |
| **Secretaria** | secretaria@escola.com | secretaria123 | Matrículas, Alunos, Documentos |
| **Professor** | professor@escola.com | professor123 | Notas, Presenças, Alunos |

## ⚠️ IMPORTANTE: Segurança em Produção

**NUNCA** use estas senhas padrão em produção! Para produção, crie usuários com senhas fortes.

## 📝 Como Criar o Usuário Admin

### Opção 1: Script Automático (Recomendado)

1. **Acesse o servidor via SSH:**
```bash
ssh root@seu-servidor
```

2. **Navegue até o projeto:**
```bash
cd /var/lib/dokploy/projects/synexa-sis
# ou
cd /etc/dokploy/compose/[seu-projeto]/code
```

3. **Execute o script de criação:**
```bash
./scripts/create-admin.sh
```

4. **Siga as instruções:**
```
Email do admin: admin@escola.com
Senha do admin: [escolha uma senha segura]
```

### Opção 2: Via Container do Backend

1. **Encontre o container:**
```bash
docker ps | grep backend
```

2. **Execute o comando de criação:**
```bash
docker exec -it [CONTAINER_NAME] npx prisma studio
```

3. **Acesse Prisma Studio:**
- Abra: `http://seu-servidor:5555`
- Vá na tabela `User`
- Clique em "Add Record"
- Preencha:
  - email: `admin@escola.com`
  - password: (use um gerador de hash bcrypt)
  - name: `Administrador`
  - role: `ADMIN`

### Opção 3: Seed Inicial

Se você está fazendo um deployment inicial:

```bash
# No servidor
cd /var/lib/dokploy/projects/synexa-sis/escola-backend

# Criar arquivo seed
cat > prisma/seed-admin.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('SuaSenhaAqui123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@escola.com' },
    update: {
      password: password,
      role: 'ADMIN'
    },
    create: {
      email: 'admin@escola.com',
      password: password,
      name: 'Administrador',
      role: 'ADMIN'
    }
  });
  
  console.log('Admin criado/atualizado com sucesso!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
EOF

# Executar seed
docker exec [CONTAINER_NAME] node prisma/seed-admin.js
```

## 🔐 Credenciais Recomendadas

Após criar o admin, use estas credenciais:

```
Email: admin@escola.com
Senha: [a que você definiu]
```

## 🚨 Segurança

1. **NUNCA** use senhas padrão em produção
2. **SEMPRE** crie uma senha forte:
   - Mínimo 8 caracteres
   - Letras maiúsculas e minúsculas
   - Números
   - Caracteres especiais

3. **Exemplo de senha forte:** `Escola@2025Admin!`

## ❌ Erro 401 ao fazer login?

Se você recebe erro 401 (Unauthorized), significa que:

1. **Usuário não existe** - Execute o script de criação
2. **Senha incorreta** - Verifique a senha digitada
3. **Banco não sincronizado** - Execute as migrations:
   ```bash
   docker exec [CONTAINER_NAME] npx prisma migrate deploy
   ```

## 📞 Suporte

Se continuar com problemas:

1. Verifique os logs:
```bash
docker logs [CONTAINER_NAME] --tail 50
```

2. Teste a API:
```bash
curl http://localhost:3000/health
```

3. Verifique o banco:
```bash
docker exec [POSTGRES_CONTAINER] psql -U postgres -d escola -c "SELECT email FROM users;"
```

---

**Nota:** Por segurança, o sistema não vem com usuário admin pré-configurado. Você deve criar um administrador após o deployment seguindo as instruções acima.