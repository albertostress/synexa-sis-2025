#!/usr/bin/env node

/**
 * Puppeteer MCP Integration for Synexa-SIS Project
 * Integração do Puppeteer com MCP (Model Context Protocol) para uso direto no Claude
 * 
 * Este script permite usar o Puppeteer diretamente via MCP sem necessidade de instalação local
 */

const { createBrowser, createPage, cleanup, takeScreenshot, generatePDF } = require('./puppeteer-config');

// URLs do projeto
const PROJECT_URLS = {
  frontend: 'http://localhost:3001',
  backend: 'http://localhost:3000',
  swagger: 'http://localhost:3000/api',
  login: 'http://localhost:3001/login',
  dashboard: 'http://localhost:3001/dashboard',
};

// Função para usar via MCP
async function mcpScreenshot(url, options = {}) {
  const browser = await createBrowser('screenshot');
  const page = await createPage(browser);
  
  try {
    console.log(`📸 MCP Screenshot: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const screenshot = await takeScreenshot(page, {
      path: options.path || `screenshots/mcp-${Date.now()}.png`,
      fullPage: options.fullPage !== false,
      type: options.type || 'png',
      quality: options.quality || 90,
      ...options
    });
    
    return screenshot;
  } finally {
    await cleanup(browser);
  }
}

// Função para gerar PDF via MCP
async function mcpPDF(url, options = {}) {
  const browser = await createBrowser('pdf');
  const page = await createPage(browser);
  
  try {
    console.log(`📄 MCP PDF: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const pdf = await generatePDF(page, {
      path: options.path || `pdfs/mcp-${Date.now()}.pdf`,
      format: options.format || 'A4',
      printBackground: true,
      ...options
    });
    
    return pdf;
  } finally {
    await cleanup(browser);
  }
}

// Função para testar conectividade via MCP
async function mcpHealthCheck() {
  const browser = await createBrowser('default');
  const page = await createPage(browser);
  
  try {
    console.log('🏥 MCP Health Check');
    
    const results = {};
    
    for (const [name, url] of Object.entries(PROJECT_URLS)) {
      try {
        const response = await page.goto(url, { timeout: 10000 });
        results[name] = {
          url,
          status: response.status(),
          ok: response.ok(),
          timing: Date.now()
        };
        console.log(`✅ ${name}: ${response.status()}`);
      } catch (error) {
        results[name] = {
          url,
          error: error.message,
          ok: false
        };
        console.log(`❌ ${name}: ${error.message}`);
      }
    }
    
    return results;
  } finally {
    await cleanup(browser);
  }
}

// Função para navegação automática via MCP
async function mcpNavigate(url, actions = []) {
  const browser = await createBrowser('dev');
  const page = await createPage(browser);
  
  try {
    console.log(`🧭 MCP Navigate: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    for (const action of actions) {
      console.log(`🎯 Executing action: ${action.type}`);
      
      switch (action.type) {
        case 'click':
          await page.click(action.selector);
          break;
        case 'fill':
          await page.fill(action.selector, action.value);
          break;
        case 'select':
          await page.selectOption(action.selector, action.value);
          break;
        case 'wait':
          await page.waitForSelector(action.selector, { timeout: action.timeout || 10000 });
          break;
        case 'screenshot':
          await takeScreenshot(page, { path: action.path || `screenshots/action-${Date.now()}.png` });
          break;
        case 'pdf':
          await generatePDF(page, { path: action.path || `pdfs/action-${Date.now()}.pdf` });
          break;
        default:
          console.log(`⚠️ Unknown action type: ${action.type}`);
      }
      
      if (action.delay) {
        await page.waitForTimeout(action.delay);
      }
    }
    
    return { success: true, url: page.url() };
  } finally {
    await cleanup(browser);
  }
}

// Função para monitoramento via MCP
async function mcpMonitor(url, duration = 30000) {
  const browser = await createBrowser('default');
  const page = await createPage(browser);
  
  try {
    console.log(`📡 MCP Monitor: ${url} por ${duration}ms`);
    
    const logs = [];
    
    // Interceptar requests
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      logs.push({
        type: 'request',
        method: request.method(),
        url: request.url(),
        timestamp: Date.now()
      });
      request.continue();
    });
    
    page.on('response', response => {
      logs.push({
        type: 'response',
        status: response.status(),
        url: response.url(),
        timestamp: Date.now()
      });
    });
    
    page.on('console', msg => {
      logs.push({
        type: 'console',
        level: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
    
    page.on('pageerror', error => {
      logs.push({
        type: 'error',
        message: error.message,
        timestamp: Date.now()
      });
    });
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Aguardar pelo tempo especificado
    await page.waitForTimeout(duration);
    
    return logs;
  } finally {
    await cleanup(browser);
  }
}

// Função principal para CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'screenshot':
        await mcpScreenshot(args[1], { path: args[2] });
        break;
      case 'pdf':
        await mcpPDF(args[1], { path: args[2] });
        break;
      case 'health':
        await mcpHealthCheck();
        break;
      case 'navigate':
        const actions = args[2] ? JSON.parse(args[2]) : [];
        await mcpNavigate(args[1], actions);
        break;
      case 'monitor':
        const duration = args[2] ? parseInt(args[2]) : 30000;
        const logs = await mcpMonitor(args[1], duration);
        console.log(JSON.stringify(logs, null, 2));
        break;
      default:
        console.log(`
🎭 Puppeteer MCP Integration - Synexa-SIS

Comandos disponíveis:
  screenshot <url> [output]     Screenshot via MCP
  pdf <url> [output]           PDF via MCP  
  health                       Health check via MCP
  navigate <url> [actions]     Navegação automática via MCP
  monitor <url> [duration]     Monitoramento via MCP

Exemplos:
  node .claude/puppeteer-mcp.js screenshot http://localhost:3001
  node .claude/puppeteer-mcp.js pdf http://localhost:3001/dashboard
  node .claude/puppeteer-mcp.js health
  node .claude/puppeteer-mcp.js monitor http://localhost:3001 10000
        `);
    }
  } catch (error) {
    console.error('❌ MCP Error:', error.message);
    process.exit(1);
  }
}

// Exportar para uso direto
module.exports = {
  mcpScreenshot,
  mcpPDF,
  mcpHealthCheck,
  mcpNavigate,
  mcpMonitor,
  PROJECT_URLS
};

// Executar se chamado diretamente
if (require.main === module) {
  main();
}