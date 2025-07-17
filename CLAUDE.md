📘 Synexa-SIS-2025 – Claude Assistant Rules (Atualizado)

Este ficheiro define as regras oficiais, estrutura e contexto técnico completo para uso da Claude AI durante o desenvolvimento do projeto Synexa-SIS (Sistema Escolar Angola), incluindo tanto o backend (NestJS + PostgreSQL) quanto o frontend (React + Vite).

📍 Todas as respostas, códigos e sugestões da Claude devem seguir fielmente este documento. As funcionalidades seguem uma evolução iterativa por fases.

🧱 Projeto: Synexa-SIS (Sistema Escolar Angola)

Sistema de gestão escolar completo, usado por escolas privadas ou públicas em Angola, com foco em:

Fluxos administrativos e pedagógicos

Gestão de alunos, professores, matrículas, documentos

Controle financeiro (faturas e pagamentos)

Emissão de relatórios, dashboards e documentos oficiais

Divisão de painéis por tipo de utilizador (role-based access)

🧩 Estrutura do Projeto (Caminhos Locais)

D:\Projecto\Synexa-SIS-2025\
├── escola-backend   # Backend (NestJS + Prisma)
└── escola-frontend  # Frontend (Vite + React + Tailwind)

🧠 Stack Tecnológica Geral

Camada

Tecnologias

Backend

NestJS, TypeScript, Prisma, PostgreSQL, Docker Compose

Frontend

React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router

API

RESTful, Swagger, JWT

PDF

Playwright + Handlebars + Tailwind CSS CDN

Segurança

JWT + Guards + @Roles()

Cache

LRU + TTL em módulos críticos

✅ Backend – Módulos Implementados (Fase 1 a 20) ⭐ **STUDENTS ENTERPRISE ATUALIZADO**

**FASE 20 - MÓDULO STUDENTS ENTERPRISE (COMPLETO)**
- ⭐ **Módulo Students refatorado para modelo enterprise completo**
- ✅ **15+ campos**: firstName, lastName, gender, birthDate, phone, bloodType, studentNumber, academicYear, classId, profilePhotoUrl, guardianName, guardianPhone, municipality, province, country, parentEmail, parentPhone
- ✅ **Validações robustas** em português brasileiro com class-validator  
- ✅ **Gender enum**: MASCULINO, FEMININO
- ✅ **Relacionamentos atualizados**: SchoolClass, Finance, Transport, Library, Events
- ✅ **Compatibilidade total** com todos os módulos existentes
- ✅ **Servidor totalmente operacional** - 0 erros de compilação
- ✅ **Database schema** aplicado com sucesso
- ✅ **Swagger documentation** completa
- ✅ **DTOs enterprise** com validações específicas Angola
- ✅ **Service methods** com busca avançada e filtros

**Status atual**: Backend 100% funcional e testado, com módulo Students enterprise implementado, autenticação JWT, validações robustas, geração de PDF, proteção por role, swagger completo e rotas REST documentadas.

**Servidor**: ✅ Operacional na porta 3000 com 0 erros de compilação

🎯 Nova Fase – Frontend Oficial (ADMIN, SECRETARIA, PROFESSOR)

⚠️ O portal dos pais está fora desta fase. Terá projeto separado.

📂 Estrutura recomendada (escola-frontend/src)

src/
├── components/        # Componentes reutilizáveis (botões, cards, inputs)
├── layouts/           # Layouts base como DashboardLayout
├── pages/             # Divisão por role: admin, secretaria, professor
├── router/            # react-router-dom com rotas protegidas por role
├── context/           # AuthContext para login, logout, JWT, role
├── services/          # Chamadas API via axios
├── hooks/             # Custom hooks como useAuth, useRole
├── types/             # Tipagens e contratos compartilhados com o backend
└── utils/             # Helpers (parseJWT, formatDate, roleCheck)

🌍 .env

VITE_API_BASE_URL=http://localhost:3000
VITE_PORT=3001

⚙️ vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
});

🔐 Autenticação JWT no Frontend

Login via /auth/login

JWT salvo no localStorage

Token decodificado com jwt-decode

Role extraída e armazenada no AuthContext

Hook useAuth() para acessar token, role, login, logout

🔒 Proteção de Rotas

Redireciona para /login se token inválido

Roteamento baseado em role: ADMIN, SECRETARIA, PROFESSOR

🧑‍🏫 Regras de Role

Role

Permissões principais

ADMIN

Total. Pode ver todos os painéis e gerir utilizadores

SECRETARIA

Matrículas, pagamentos, documentos

PROFESSOR

Turmas, presenças, notas, observações

PARENT

❌ Portal separado (não incluído nesta fase)

🎨 UI Design

Baseado em Tailwind CSS + shadcn/ui

Estilo moderno e responsivo

Dark mode ativo

Componentes: buttons, cards, modals, tables, inputs, etc.

Sidebar lateral com role-awareness

🔧 Boas Práticas e Convenções Claude

Todos os ficheiros em TypeScript rigoroso (sem any)

Componentes funcionais com hooks

Axios configurado com baseURL + interceptor JWT

Tipagens importadas do backend sempre que possível

Commits claros, pequenos e semânticos

💬 Commits Exemplo

git commit -m "feat: criar layout base do painel admin"
git commit -m "fix: ajustar redirecionamento de login"

🧩 O que Claude AI deve sempre considerar

Porta do frontend é 3001, backend é 3000

JWT com role é a base do controle de acesso

Rotas REST já existem e estão protegidas

Cada painel deve ter páginas próprias por perfil (admin/secretaria/professor)

Evitar duplicação de lógicas ou contratos

O design deve parecer profissional (padrão Fortune 500)

📌 Regras de Execução no Claude (Autorizadas)

✅ Comandos Permitidos

ls, pwd, cat, head, tail
npm install, npm run dev, npx tailwindcss init -p
npm test

⚠️ Com autorização

npm install <package>, git commit, git push

❌ Proibidos sem confirmação

rm -rf, sudo, chmod 777, git reset --hard

🚀 Módulos Frontend Implementados

✅ Módulo de Professores (src/pages/admin/Teachers.tsx)
- Tela completa com PageHeader, KPIs, busca e filtros
- 4 KPIs: Total, Ativos, Disciplinas, Experiência Média
- Campo de busca com ícone (nome/email)
- Filtro de status (dropdown)
- Tabela com avatares, badges e botões de ação
- Loading states com skeletons
- Empty states e error handling
- Responsivo e com dark mode
- Proteção por role ADMIN

🔧 Problemas Conhecidos e Soluções

⚠️ Hot Reload em Docker Frontend
PROBLEMA: Após editar arquivos .tsx no frontend, as mudanças não aparecem no browser mesmo com hot reload ativo.

SINTOMAS:
- Arquivo editado e salvo
- Browser continua mostrando versão anterior
- docker logs mostra Vite funcionando
- Hard refresh não resolve

SOLUÇÃO TESTADA:
```bash
# Reiniciar container do frontend
docker restart escola-frontend

# Ou recriar completamente
docker-compose down escola-frontend
docker-compose up -d escola-frontend
```

CAUSA: O hot reload do Vite dentro do container Docker não detecta mudanças no volume mounted ocasionalmente.

PREVENÇÃO: Sempre reiniciar o container frontend após edições significativas em páginas .tsx

📄 Observações Finais

Atualiza este ficheiro sempre que uma nova funcionalidade for implementada (backend ou frontend)

A Claude AI deve sempre ler este ficheiro antes de gerar código, conectar APIs, criar páginas ou sugerir estrutura

O sistema está a ser desenvolvido de forma modular, iterativa e com foco em escalabilidade

O código é propriedade de António Hermelinda e segue práticas profissionais

Estamos a construir o melhor sistema escolar de Angola. 🚀

# 📘 Synexa-SIS-2025 – Claude Assistant Rules (Atualizado)

Este ficheiro define as regras e o contexto completo para uso da Claude AI no desenvolvimento do projeto **Synexa-SIS** (Sistema Escolar Angola), até à **FASE 11** concluída. É o documento oficial de referência técnica.

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

## ✅ Módulos já implementados (Fase 1 a 14 + Serviços)

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
| S1   | Transport            | ✅ Gestão de rotas, horários, alunos e condutores
| S2   | Events               | ✅ Gestão de eventos escolares com participantes

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
| S1   | Transport            | ✅ Gestão de rotas, horários, alunos e condutores

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


---

## 🚧 Módulos ainda por implementar (planejados)

| Fase | Módulo               | Objetivo |
|------|----------------------|----------|
| 15   | Multi-escola (SaaS)  | Gestão multi-instância com separação por tenant

| Fase | Módulo               | Objetivo |
|------|----------------------|----------|
| 14   | Uploads              | Envio de ficheiros de matrícula, provas, etc.
| 15   | Multi-escola (SaaS)  | Gestão multi-instância com separação por tenant

| Fase | Módulo               | Objetivo |
|------|----------------------|----------|
| 13   | Dashboards           | Métricas, gráficos de desempenho, inadimplência
| 14   | Uploads              | Envio de ficheiros de matrícula, provas, etc.
| 15   | Multi-escola (SaaS)  | Gestão multi-instância com separação por tenant

| Fase | Módulo               | Objetivo |
|------|----------------------|----------|
| 12   | Communication        | Mensagens internas escola → pais/professores
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

## 📄 Observações finais

- Sempre que novos módulos forem implementados, atualiza este ficheiro imediatamente com as referências completas (fase, endpoints, relações, regras de acesso, estrutura, status do backend e dependências).

- Todos os módulos seguem separação de camadas: Controller → Service → DTO → Entity
- Swagger obrigatório em todos os endpoints
- Tokens JWT expiram em 1h por padrão
- Documentação e prompts base foram definidos por António Hermelinda
- Todas as funcionalidades seguem evolução iterativa por fases

Se precisares de gerar novo módulo, basta pedir: 
👉 "Gera o prompt do módulo [nome] para Claude Code"
