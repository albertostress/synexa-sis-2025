# Comandos Slash Context7 - Synexa-SIS

## /docs
**Descrição**: Buscar documentação rápida de uma biblioteca
**Uso**: `/docs <library-name>`
**Exemplo**: `/docs nestjs`

Busca documentação usando Context7 MCP para as bibliotecas configuradas no projeto.

## /quick
**Descrição**: Buscar documentação com tópico específico
**Uso**: `/quick <library-name> <topic>`
**Exemplo**: `/quick nestjs guards`

Busca documentação focada em um tópico específico da biblioteca.

## /check
**Descrição**: Verificar se uma biblioteca está disponível
**Uso**: `/check <library-name>`
**Exemplo**: `/check prisma`

Verifica se a biblioteca está configurada nos shortcuts do Context7.

## /libs
**Descrição**: Listar todas as bibliotecas disponíveis
**Uso**: `/libs`

Lista todos os shortcuts configurados organizados por categoria.

## /fav
**Descrição**: Mostrar bibliotecas favoritas do projeto
**Uso**: `/fav`

Mostra as bibliotecas mais utilizadas no projeto Synexa-SIS.

## Bibliotecas Configuradas

### Backend
- **nestjs** - Framework NestJS
- **prisma** - ORM Prisma
- **jwt** - JSON Web Tokens
- **swagger** - Documentação API

### Frontend
- **react** - Biblioteca React
- **vite** - Build tool Vite
- **tailwind** - Framework CSS

### Testing & Tools
- **playwright** - Testes e2e
- **handlebars** - Templates
- **typescript** - TypeScript

### Exemplos de Uso

```bash
# Buscar documentação NestJS
/docs nestjs

# Buscar sobre Guards no NestJS
/quick nestjs guards

# Verificar se Prisma está disponível
/check prisma

# Listar todas as bibliotecas
/libs

# Ver favoritos
/fav
```