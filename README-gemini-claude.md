# 🤖 Gemini-Claude Workflow Automation

**Automatize o workflow entre Gemini CLI e Claude Code para economizar tokens e contexto**

## 🚀 Instalação Rápida

```bash
# 1. Verificar dependências
which gemini claude-code git jq

# 2. Tornar o script executável
chmod +x ./gemini-claude.sh

# 3. Executar primeira análise
./gemini-claude.sh analyze-feature "implement user dashboard"
```

## 📋 Pré-requisitos

- **Gemini CLI** - Para análise de código com IA
- **Claude Code** - Para execução de comandos otimizados  
- **Git** - Projeto deve estar em repositório git
- **jq** - Para processamento JSON

```bash
# Instalar jq se necessário
sudo apt install jq        # Ubuntu/Debian
brew install jq            # macOS
```

## 🎯 Casos de Uso

### 1. Analisar e Implementar Feature
```bash
./gemini-claude.sh analyze-feature "add user authentication with JWT"
./gemini-claude.sh feature "implement dark mode toggle"
```

### 2. Corrigir Issues e Bugs
```bash
./gemini-claude.sh fix-issues
./gemini-claude.sh fix-issues "login form validation errors"
./gemini-claude.sh debug "API timeout issues"
```

### 3. Refatorar Módulos
```bash
./gemini-claude.sh refactor-module "src/components/auth"
./gemini-claude.sh refactor "escola-backend/src/students"
```

### 4. Análise Completa do Projeto
```bash
./gemini-claude.sh full-analysis
```

## 🔧 Configuração

### Configuração Automática
O script cria automaticamente `.gemini-claude/config.env` na primeira execução.

### Configuração Manual
```bash
# Copiar exemplo de configuração
cp .gemini-claude-example.env .gemini-claude/config.env

# Editar configurações
nano .gemini-claude/config.env
```

### Principais Configurações
```bash
GEMINI_MODEL=gemini-pro          # Modelo do Gemini
MAX_TOKENS=8192                  # Tokens máximos por request
INTERACTIVE_MODE=true            # Modo interativo
DRY_RUN=false                   # Preview sem execução
AUTO_COMMIT=false               # Auto-commit mudanças
CACHE_TTL=3600                  # Cache por 1 hora
```

## 📁 Estrutura de Arquivos

```
.gemini-claude/
├── analysis/          # Análises do Gemini com timestamp
│   ├── analysis_feature_20240120_143022.json
│   └── prompt_feature_20240120_143022.txt
├── tasks/             # Tarefas individuais extraídas
│   ├── task_auth_001.json
│   └── task_dashboard_002.json
├── commands/          # Scripts Claude Code gerados
│   ├── commands_20240120_143022.sh
│   └── execution_plan.txt
├── logs/              # Logs de execução
│   ├── gemini-claude.log
│   └── execution_20240120_143022.log
├── cache/             # Cache de análises (TTL: 1h)
│   └── sha256_hash.json
└── config.env         # Configuração personalizada
```

## 🎮 Modo Interativo

```bash
./gemini-claude.sh analyze-feature "user dashboard"
```

```
=== TASK SELECTION MENU ===
Total tasks found: 4

1. Create Dashboard component structure
   Priority: HIGH | Complexity: MEDIUM | Tokens: 450
   ID: dashboard_001

2. Add dashboard routing to App.js  
   Priority: HIGH | Complexity: SIMPLE | Tokens: 200
   ID: routing_002

3. Implement user data API integration
   Priority: MEDIUM | Complexity: COMPLEX | Tokens: 800
   ID: api_003

4. Add dashboard styling with Tailwind
   Priority: LOW | Complexity: SIMPLE | Tokens: 300
   ID: styling_004

Options:
  a) Execute all tasks in recommended order
  s) Select specific tasks by number (e.g., 1,3,5)
  q) Quit without executing

Your choice: s
Enter task numbers: 1,2
```

## 🔄 Workflow Automatizado

### 1. **Análise com Gemini**
- Executa Gemini CLI automaticamente
- Processa a saída e extrai tarefas atômicas
- Salva análises estruturadas em JSON
- Identifica dependências entre tarefas

### 2. **Geração de Comandos Claude**
- Converte análises em prompts otimizados
- Gera comandos Claude Code específicos
- Organiza por prioridade e dependência
- Estima uso de tokens por tarefa

### 3. **Execução Controlada**
- Modo interativo para seleção de tarefas
- Preview antes da execução
- Logs detalhados de cada operação
- Auto-commit opcional das mudanças

## 📊 Monitoramento e Logs

### Ver Configuração Atual
```bash
./gemini-claude.sh config
```

### Ver Logs Recentes
```bash
./gemini-claude.sh logs
```

### Limpar Cache e Arquivos Temporários
```bash
./gemini-claude.sh clean
```

## 🎛️ Variáveis de Ambiente

```bash
# Configuração rápida via env vars
export INTERACTIVE_MODE=false
export DRY_RUN=true
export GEMINI_MODEL=gemini-pro
export MAX_TOKENS=4096

./gemini-claude.sh analyze-feature "quick feature test"
```

## 🔍 Modo Debug

```bash
# Preview comandos sem executar
DRY_RUN=true ./gemini-claude.sh feature "test feature"

# Executar com debug completo  
LOG_LEVEL=DEBUG ./gemini-claude.sh refactor "src/auth"

# Modo não-interativo para CI/CD
INTERACTIVE_MODE=false ./gemini-claude.sh fix-issues
```

## ⚡ Performance e Cache

### Sistema de Cache Inteligente
- **TTL padrão**: 1 hora (3600s)
- **Cache por**: hash do tipo + descrição da tarefa
- **Auto-limpeza**: arquivos > 7 dias removidos automaticamente

### Otimização de Tokens
- **Análise prévia**: estima tokens antes da execução
- **Contexto mínimo**: inclui apenas arquivos relevantes
- **Tarefas atômicas**: quebra trabalho em pequenas partes
- **Prompts focados**: comandos Claude Code específicos

## 🚀 Integração CI/CD

```yaml
# .github/workflows/auto-fix.yml
name: Auto-fix with Gemini-Claude
on:
  issues:
    types: [opened]

jobs:
  auto-fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup dependencies
        run: |
          # Instalar gemini-cli, claude-code, jq
      - name: Auto-analyze issue
        run: |
          export INTERACTIVE_MODE=false
          export AUTO_COMMIT=true
          ./gemini-claude.sh fix-issues "${{ github.event.issue.title }}"
```

## 🎯 Exemplos Práticos

### Projeto Synexa-SIS
```bash
# Implementar novo módulo de biblioteca
./gemini-claude.sh analyze-feature "implement library management module"

# Corrigir erros de TypeScript
./gemini-claude.sh fix-issues "TypeScript compilation errors"

# Refatorar módulo de estudantes
./gemini-claude.sh refactor-module "escola-backend/src/students"

# Análise completa do sistema
./gemini-claude.sh full-analysis
```

### Resultados Esperados
- ✅ **Economia de tokens**: 60-80% comparado ao uso manual
- ✅ **Contexto otimizado**: apenas arquivos relevantes incluídos  
- ✅ **Tarefas atômicas**: execução controlada e reversível
- ✅ **Histórico completo**: logs e análises preservados
- ✅ **Workflow repetível**: mesmas análises cachadas

## 🔧 Troubleshooting

### Erro: "gemini command not found"
```bash
# Instalar Gemini CLI
npm install -g @google-ai/generativelanguage

# Ou verificar PATH
echo $PATH | grep gemini
```

### Erro: "Not in a git repository" 
```bash
# Inicializar git se necessário
git init
git add .
git commit -m "Initial commit"
```

### Cache não funciona
```bash
# Verificar permissões
ls -la .gemini-claude/cache/

# Limpar cache corrompido
./gemini-claude.sh clean
```

### JSON inválido do Gemini
```bash
# Verificar logs
./gemini-claude.sh logs

# Executar com debug
LOG_LEVEL=DEBUG ./gemini-claude.sh feature "test"
```

## 📈 Métricas e Estatísticas

O script automaticamente rastreia:
- **Tokens utilizados** por execução
- **Tempo de análise** do Gemini
- **Taxa de sucesso** das tarefas
- **Cache hit ratio** para performance
- **Arquivos modificados** por sessão

### Ver Métricas
```bash
# Análise de uso de tokens
grep "tokens used" .gemini-claude/logs/gemini-claude.log

# Performance do cache  
grep "cache" .gemini-claude/logs/gemini-claude.log

# Taxa de sucesso
grep "completed\|failed" .gemini-claude/logs/execution_*.log
```

## 🤝 Contribuição

Para melhorar o script:

1. **Fork** o repositório
2. **Criar** branch para feature
3. **Testar** com diferentes tipos de projeto
4. **Documentar** mudanças
5. **Submeter** pull request

### Áreas de Melhoria
- [ ] Suporte a mais linguagens de programação
- [ ] Integração com mais ferramentas de IA
- [ ] Dashboard web para visualização
- [ ] Plugins para IDEs populares
- [ ] Suporte a análises de segurança
- [ ] Integração com Slack/Discord
- [ ] Análise de performance de código

---

**Criado para o projeto Synexa-SIS-2025**  
*Automatizando workflows de IA para máxima eficiência* 🚀