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

✅ Backend – Módulos Implementados (Fase 1 a 19)

[Ver seção anterior para detalhes por fase. Inclui: auth, professores, disciplinas, turmas, matrículas, notas, boletins, documentos, PDF, finanças, portal dos pais, presenças, comunicação, dashboards, uploads, biblioteca, transporte, eventos, configurações globais.]

Status atual: Backend 100% funcional e testado, com autenticação, JWT, validações robustas, geração de PDF, proteção por role, swagger completo e rotas REST documentadas.

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

