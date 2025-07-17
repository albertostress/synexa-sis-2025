#!/usr/bin/env node

/**
 * Context7 MCP Helper para Synexa-SIS
 * Comandos rápidos para acesso a documentação
 */

const config = require('./mcp-context7-config.json');

class Context7Helper {
  constructor() {
    this.shortcuts = config.shortcuts;
    this.customCommands = config.custom_commands;
  }

  // Comando: docs <library>
  async docs(libraryName) {
    console.log(`🔍 Buscando documentação para: ${libraryName}`);
    
    if (this.shortcuts[libraryName]) {
      const shortcut = this.shortcuts[libraryName];
      console.log(`📂 Categoria: ${shortcut.category}`);
      console.log(`📝 Descrição: ${shortcut.description}`);
      console.log(`⚡ Comando: ${shortcut.command}`);
      return shortcut.command;
    }
    
    console.log(`❌ Biblioteca '${libraryName}' não encontrada nos shortcuts`);
    console.log(`💡 Disponíveis: ${Object.keys(this.shortcuts).join(', ')}`);
    return null;
  }

  // Comando: quick <library> <topic>
  async quick(libraryName, topic) {
    console.log(`🚀 Busca rápida: ${libraryName} -> ${topic}`);
    
    if (this.shortcuts[libraryName]) {
      const shortcut = this.shortcuts[libraryName];
      console.log(`📂 Categoria: ${shortcut.category}`);
      console.log(`🎯 Tópico: ${topic}`);
      return {
        command: shortcut.command,
        topic: topic
      };
    }
    
    console.log(`❌ Biblioteca '${libraryName}' não encontrada`);
    return null;
  }

  // Comando: check <library>
  async check(libraryName) {
    console.log(`🔍 Verificando disponibilidade: ${libraryName}`);
    
    if (this.shortcuts[libraryName]) {
      const shortcut = this.shortcuts[libraryName];
      console.log(`✅ Disponível`);
      console.log(`📂 Categoria: ${shortcut.category}`);
      console.log(`📝 Descrição: ${shortcut.description}`);
      return true;
    }
    
    console.log(`❌ Não disponível nos shortcuts`);
    return false;
  }

  // Listar todos os shortcuts
  listShortcuts() {
    console.log('📚 Shortcuts disponíveis:');
    console.log('========================');
    
    Object.entries(this.shortcuts).forEach(([key, value]) => {
      console.log(`🔸 ${key.padEnd(12)} - ${value.description} (${value.category})`);
    });
  }

  // Listar por categoria
  listByCategory(category) {
    console.log(`📂 Categoria: ${category}`);
    console.log('==================');
    
    Object.entries(this.shortcuts)
      .filter(([key, value]) => value.category === category)
      .forEach(([key, value]) => {
        console.log(`🔸 ${key.padEnd(12)} - ${value.description}`);
      });
  }

  // Favoritos
  getFavorites() {
    console.log('⭐ Bibliotecas favoritas:');
    console.log('========================');
    
    config.favorites.forEach(fav => {
      if (this.shortcuts[fav]) {
        console.log(`🔸 ${fav.padEnd(12)} - ${this.shortcuts[fav].description}`);
      }
    });
  }
}

// CLI Interface
const helper = new Context7Helper();
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'docs':
    if (args[1]) {
      helper.docs(args[1]);
    } else {
      console.log('❌ Uso: node docs-helper.js docs <library-name>');
    }
    break;

  case 'quick':
    if (args[1] && args[2]) {
      helper.quick(args[1], args[2]);
    } else {
      console.log('❌ Uso: node docs-helper.js quick <library-name> <topic>');
    }
    break;

  case 'check':
    if (args[1]) {
      helper.check(args[1]);
    } else {
      console.log('❌ Uso: node docs-helper.js check <library-name>');
    }
    break;

  case 'list':
    helper.listShortcuts();
    break;

  case 'category':
    if (args[1]) {
      helper.listByCategory(args[1]);
    } else {
      console.log('❌ Uso: node docs-helper.js category <category-name>');
      console.log('📂 Categorias: backend, frontend, database, styling, tooling, language, auth, documentation, testing, templating');
    }
    break;

  case 'favorites':
  case 'fav':
    helper.getFavorites();
    break;

  default:
    console.log('🚀 Context7 MCP Helper - Synexa-SIS');
    console.log('===================================');
    console.log('');
    console.log('📋 Comandos disponíveis:');
    console.log('  docs <library>        - Buscar documentação');
    console.log('  quick <library> <topic> - Busca com tópico específico');
    console.log('  check <library>       - Verificar disponibilidade');
    console.log('  list                  - Listar todos os shortcuts');
    console.log('  category <name>       - Listar por categoria');
    console.log('  favorites             - Mostrar favoritos');
    console.log('');
    console.log('💡 Exemplo: node docs-helper.js docs nestjs');
    break;
}

module.exports = Context7Helper;