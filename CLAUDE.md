# 📘 Synexa-SIS-2025 – Claude Assistant Rules (Atualizado)

Este ficheiro define as regras e o contexto completo para uso da Claude AI no desenvolvimento do projeto **Synexa-SIS** (Sistema Escolar Angola), até à **FASE 15** concluída. É o documento oficial de referência técnica.

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

## ✅ Módulos já implementados (Fase 1 a 15)

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
| 11   | Attendance          | ✅ Registro por professor, % frequência, filtros
| 12   | Communication       | ✅ Mensagens internas com leitura e estatísticas
| 13   | Analytics           | ✅ Dashboards com métricas de presença, notas e finanças
| 14   | Uploads             | ✅ Gestão de ficheiros com Multer, vinculação a entidades
| 15   | Library             | ✅ Biblioteca com empréstimos, devoluções e controle de acervo


---

## 🚧 Módulos ainda por implementar (planejados)

| Fase | Módulo               | Objetivo |
|------|----------------------|----------|
| 16   | Multi-escola (SaaS)  | Gestão multi-instância com separação por tenant


---

## 🏥 Serviços obrigatórios (confirmados)

Estes módulos não podem faltar:

- `/transport` – Transporte escolar
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

## 📄 Observações finais

- Sempre que novos módulos forem implementados, atualiza este ficheiro imediatamente com as referências completas (fase, endpoints, relações, regras de acesso, estrutura, status do backend e dependências).

- Todos os módulos seguem separação de camadas: Controller → Service → DTO → Entity
- Swagger obrigatório em todos os endpoints
- Tokens JWT expiram em 1h por padrão
- Documentação e prompts base foram definidos por António Hermelinda
- Todas as funcionalidades seguem evolução iterativa por fases

