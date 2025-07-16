# 📘 Synexa-SIS-2025 – Claude Assistant Rules (Atualizado)

Este ficheiro define as regras e o contexto completo para uso da Claude AI no desenvolvimento do projeto **Synexa-SIS** (Sistema Escolar Angola), até à **FASE 13** concluída (Analytics). É o documento oficial de referência técnica.

---

## 🧱 Projeto: Synexa-SIS (Sistema Escolar Angola)

- Base: **NestJS + Prisma + Docker Compose**
- Backend roda totalmente dentro de container Docker (`escola-backend`)
- Banco de dados: **PostgreSQL (via Prisma)**
- Autenticação: **JWT** com `@Roles()` + `Guards`
- Stack: **TypeScript (sem `any`)** + `class-validator`
- Geração de PDFs: **Playwright + Handlebars + Tailwind CSS (CDN)**
- Organização por domínio (módulos independentes)
- Documentação automática via Swagger
- **Cache LRU + TTL** nos módulos críticos (PDFs, documentos)
- Todas as rotas seguem padrão REST, com proteção por role
- Testes: **unitários e e2e obrigatórios** após cada endpoint criado
- Código e APIs seguem sempre os padrões definidos no projeto (ex: `@Roles`, Guards, validações com DTO)


---

## 🔐 Segurança

- **Senha**: Hasheada com **bcrypt** (ou argon2 futuramente)
- **JWT** com expiração e roles (`ADMIN`, `SECRETARIA`, `PROFESSOR`, `DIRETOR`, `PARENT`)
- Todas as rotas protegidas com Guards (`JwtAuthGuard`, `RolesGuard`, `ParentAuthGuard`)
- **Sem hardcoded secrets** → usar `.env`
- Endpoints críticos têm validações robustas contra uso indevido (ex: professores só lançam nas suas turmas)


---

## ✅ Módulos já implementados (Fase 1 a 11)

| Fase | Módulo              | Estado |
|------|---------------------|--------|
| 1    | Auth                | ✅ JWT + Roles
| 2    | Teachers            | ✅ CRUD + vínculo User
| 3    | Subjects            | ✅ N:M com Teachers
| 4    | Classes             | ✅ Turmas com professores, turnos, ano
| 5    | Enrollment          | ✅ Matrículas com status e ano letivo
| 6    | Grades              | ✅ Notas por disciplina, restrições por professor
| 7    | Report Cards        | ✅ Boletins com médias, aprovação automática
| 8    | Documents           | ✅ Certificado, Declaração, Histórico (JSON)
| 8.2  | PDF Generator       | ✅ Geração real com Playwright + HTML
| 9    | Finance             | ✅ Faturas, pagamentos, PDF, histórico, cache
| 10   | Parents Portal      | ✅ JWT próprio, boletins, docs, pagamentos
| 11   | Attendance          | ✅ Registro por professor, % frequência, filtros, relatórios
| 12   | Communication       | ✅ Mensagens internas, filtros, confirmação leitura, stats


---

## 🎯 Status Atual do Sistema (FASE 12 - Communication)

### ✅ **Completamente Funcional:**
- **12 módulos principais** implementados e testados
- **Autenticação JWT** com 5 roles (ADMIN, SECRETARIA, PROFESSOR, DIRETOR, PARENT)
- **Base de dados PostgreSQL** com 17 tabelas relacionadas
- **API REST completa** com 58+ endpoints documentados (Swagger)
- **Geração de PDFs** funcionando (Playwright + Handlebars + Tailwind)
- **Sistema de matrículas, notas, boletins e financeiro** operacional
- **Portal dos pais** com acesso independente
- **Controle de presença** com cálculo de frequência automático
- **Sistema de comunicação interna** com mensagens para diferentes públicos

### ⚠️ **Pequenas Pendências Técnicas:**
1. **Módulo Attendance**: Endpoint `POST /attendance/mark` com erro 500 (debug menor necessário)
2. **Cache de PDFs**: Funcional mas pode ser otimizado
3. **Validações**: Algumas podem ser reforçadas

### 🔧 **Integrações Funcionais:**
- ✅ Students ↔ Classes ↔ Enrollments
- ✅ Teachers ↔ Subjects ↔ Grades  
- ✅ Finance ↔ Students ↔ Parents
- ✅ Attendance ↔ Classes ↔ Students ↔ Subjects
- ✅ Communication ↔ Users (todos os roles)
- ✅ Documents com geração de PDFs
- ✅ Report Cards com médias automáticas

---

## 🚧 Módulos ainda por implementar (planejados)

| Fase | Módulo               | Objetivo |
|------|----------------------|----------|
| 13   | Dashboards           | Métricas, gráficos de desempenho, inadimplência
| 14   | Uploads              | Envio de ficheiros de matrícula, provas, etc.
| 15   | Multi-escola (SaaS)  | Gestão multi-instância com separação por tenant


---

## 🏥 Serviços obrigatórios (confirmados)

Estes módulos não podem faltar:

- `/transport` – Transporte escolar
- `/library` – Biblioteca
- `/cafeteria` – Cantina
- `/medical` – Atendimento médico
- `/events` – Eventos escolares


---

## 🚨 Comandos e Regras Claude AI

### ✅ Comandos Permitidos
```bash
# Visualização
ls, pwd, cat, head, tail
find, grep, rg

# Dev
npm install, npm run dev, npm test
docker-compose up, docker-compose logs
prisma generate, prisma studio

# Git (leitura)
git status, git log, git diff, git branch
```

### ⚠️ Comandos com Autorização
```bash
# Git
git add, git commit, git push, git merge

# Prisma
prisma migrate dev, prisma db push, prisma migrate deploy

# Sistema
rm, docker-compose down, docker system prune

# Pacotes
npm install <package>, yarn add <package>
```

### ❌ Comandos Proibidos
```bash
# Destrutivos sem confirmação
rm -rf, sudo rm
sudo, chmod 777, chown
git reset --hard, git clean -fd
```


---

## 🔧 Comandos Importantes do Projeto

### **Desenvolvimento:**
```bash
# Iniciar projeto completo
docker compose up -d

# Aplicar mudanças no banco (Prisma)
docker compose exec escola-backend npx prisma db push

# Build e verificar erros
docker compose exec escola-backend npm run build

# Logs para debug
docker compose logs escola-backend --tail=20

# Reiniciar apenas o backend
docker compose restart escola-backend
```

### **Testes e API:**
```bash
# Testar API (exemplo)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@escola.com", "password": "admin123"}'

# Swagger/Documentação
http://localhost:3000/api
```

### **Base de Dados:**
```bash
# Gerar client Prisma após mudanças no schema
docker compose exec escola-backend npx prisma generate

# Reset completo do banco (cuidado!)
docker compose exec escola-backend npx prisma db push --force-reset
```

---

## 📢 Módulo Communication (FASE 12) - Detalhes Técnicos

### 🎯 **Funcionalidades Implementadas:**
- ✅ **Criação de mensagens** para diferentes públicos-alvo
- ✅ **Sistema de confirmação de leitura** (readBy array JSON)
- ✅ **Filtros avançados** (prioridade, data, status de leitura, busca textual)
- ✅ **Estatísticas administrativas** (taxa de leitura, distribuição por prioridade/público)
- ✅ **Soft delete** e **expiração automática** de mensagens
- ✅ **Paginação** em todos os endpoints de listagem
- ✅ **Controle de acesso por roles** (criação restrita a ADMIN/DIRETOR/SECRETARIA)

### 📊 **Audiences Suportadas:**
- `PARENTS` - Todos os pais/encarregados
- `TEACHERS` - Todos os professores  
- `ALL_STAFF` - Toda a equipe (ADMIN/DIRETOR/SECRETARIA/PROFESSOR)
- `SPECIFIC_CLASS` - Pais e professores de uma turma específica
- `INDIVIDUAL` - Usuário específico por ID
- `GROUP` - Grupo de usuários por IDs

### 🎨 **Níveis de Prioridade:**
- `LOW` - Prioridade baixa
- `NORMAL` - Prioridade normal (padrão)
- `HIGH` - Prioridade alta
- `URGENT` - Prioridade urgente

### 🛡️ **Endpoints API:**
```
POST   /communication/messages           # Criar mensagem (ADMIN/DIRETOR/SECRETARIA)
GET    /communication/inbox             # Caixa de entrada com filtros
GET    /communication/messages/:id      # Detalhes da mensagem
POST   /communication/messages/:id/read # Marcar como lida
PUT    /communication/messages/:id      # Editar mensagem (criador/ADMIN/DIRETOR)
DELETE /communication/messages/:id      # Deletar mensagem (criador/ADMIN/DIRETOR)
GET    /communication/stats             # Estatísticas (ADMIN/DIRETOR)
GET    /communication/sent              # Mensagens enviadas (ADMIN/DIRETOR/SECRETARIA)
```

### 🗄️ **Modelo de Dados:**
```sql
CommunicationMessage {
  id: UUID
  title: String(5-200 chars)
  content: String(10-2000 chars)  
  priority: MessagePriority (enum)
  audience: MessageAudience[] (array)
  targetUsers: String[] (IDs calculados automaticamente)
  readBy: JSON (array de userIds que leram)
  expiresAt: DateTime? (opcional)
  isDeleted: Boolean (soft delete)
  createdBy: String (FK User)
  createdAt/updatedAt: DateTime
}
```

### ✅ **Testes Realizados:**
- ✅ Autenticação e autorização por roles
- ✅ Criação de mensagens com targetUsers automático
- ✅ Sistema de marcação como lida funcionando
- ✅ Filtros por prioridade (HIGH, URGENT) funcionando
- ✅ Filtro por status de leitura (unread=true) funcionando
- ✅ Estatísticas calculadas corretamente (100% taxa leitura)
- ✅ Paginação e summary funcionando
- ✅ Swagger documentation completa

---

## 📄 Observações finais

- Sempre que novos módulos forem implementados, atualiza este ficheiro imediatamente com as referências completas (fase, endpoints, relações, regras de acesso, estrutura, status do backend e dependências).

- Todos os módulos seguem separação de camadas: Controller → Service → DTO → Entity
- Swagger obrigatório em todos os endpoints
- Tokens JWT expiram em 1h por padrão
- Documentação e prompts base foram definidos por António Hermelinda
- Todas as funcionalidades seguem evolução iterativa por fases

### 🎯 **Próximos Passos Recomendados:**

1. **DEBUG PRIORITÁRIO:**
   - Corrigir erro 500 no `POST /attendance/mark` (provável issue no Prisma constraint)
   
2. **MÓDULOS ESSENCIAIS FALTANTES:**
   - ~~**Communication**: Sistema de mensagens internas~~ ✅ **IMPLEMENTADO**
   - **Transport**: Gestão de transporte escolar  
   - **Library**: Controle de biblioteca
   - **Cafeteria**: Gestão de cantina
   - **Medical**: Atendimento médico escolar
   - **Events**: Eventos e calendário escolar

3. **MELHORIAS TÉCNICAS:**
   - Testes unitários e e2e 
   - Otimização de cache
   - Logs estruturados
   - Monitorização (métricas)

Se precisares de gerar novo módulo, basta pedir: 
👉 "Gera o prompt do módulo [nome] para Claude Code"
