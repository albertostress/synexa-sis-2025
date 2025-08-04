# Teste de Restrições de Permissão - ROLE: SECRETARIA

## Objetivo
Verificar se as restrições de permissão foram aplicadas corretamente para usuários com ROLE: SECRETARIA.

## Alterações Implementadas

### Backend (NestJS)
1. **UsersController**: Adicionados guards `@Roles('ADMIN', 'DIRETOR')` em todos os endpoints
2. **SubjectsController**: Removido acesso de SECRETARIA aos endpoints de criação/edição
3. **SettingsController**: Removido acesso de SECRETARIA a todos os endpoints de configuração
4. **TeachersController**: Já estava protegido com `@Roles('ADMIN')`
5. **GradesController**: Mantido acesso de leitura para SECRETARIA, mas não edição

### Frontend (React)
1. **AppSidebar**: Removidos do menu para SECRETARIA:
   - Professores
   - Disciplinas
   - Notas
   - Utilizadores
   - Configurações
   - Relatórios Avançados

2. **Dashboard**: SECRETARIA usa `SecretariaDashboard` com apenas KPIs operacionais:
   - Total de Matrículas
   - Taxa de Renovação
   - Taxa de Adimplência
   - Frequência Média

## Casos de Teste

### 1. Login como SECRETARIA
- **Credenciais**: Use um usuário com role SECRETARIA
- **Esperado**: Login bem-sucedido e redirecionamento para dashboard

### 2. Verificação do Menu Lateral
- **Ação**: Após login, verificar itens do menu
- **Esperado**: NÃO devem aparecer:
  - Professores
  - Disciplinas
  - Notas
  - Utilizadores
  - Configurações
  - Relatórios
- **Esperado**: DEVEM aparecer:
  - Dashboard
  - Alunos
  - Turmas
  - Matrículas
  - Boletins
  - Documentos
  - Presenças
  - Financeiro
  - Biblioteca
  - Transporte
  - Eventos

### 3. Tentativa de Acesso Direto a URLs Protegidas
- **Ação**: Tentar acessar diretamente:
  - `/users`
  - `/teachers`
  - `/settings`
  - `/analytics`
- **Esperado**: Redirecionamento para página de erro 403 ou dashboard

### 4. Teste de API via Backend
- **Ação**: Com token de SECRETARIA, tentar fazer requisições:
  - `GET /users` - Deve retornar 403 Forbidden
  - `POST /users` - Deve retornar 403 Forbidden
  - `GET /settings` - Deve retornar 403 Forbidden
  - `POST /subjects` - Deve retornar 403 Forbidden
- **Esperado**: Todos devem retornar 403 Forbidden

### 5. Dashboard Específico
- **Ação**: Verificar dashboard após login
- **Esperado**: Ver apenas KPIs operacionais, sem gráficos de desempenho global

## Comandos para Teste Manual

```bash
# 1. Criar usuário SECRETARIA (execute no backend)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"name":"Secretária Teste","email":"secretaria@escola.com","password":"123456","role":"SECRETARIA"}'

# 2. Login como SECRETARIA
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secretaria@escola.com","password":"123456"}'

# 3. Testar acesso negado (use o token retornado)
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer <SECRETARIA_TOKEN>"
# Esperado: 403 Forbidden
```

## Conclusão
As restrições foram implementadas em ambos os níveis (backend e frontend) para garantir que usuários com ROLE: SECRETARIA tenham acesso apenas às funcionalidades operacionais do sistema.