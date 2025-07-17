#!/usr/bin/env node

/**
 * Puppeteer Helper Script for Synexa-SIS Project
 * Script auxiliar para facilitar o uso do Puppeteer no projeto Synexa-SIS
 * 
 * Usage:
 * node .claude/puppeteer-helper.js <command> [options]
 * 
 * Commands:
 * - screenshot <url> [output]
 * - pdf <url> [output]
 * - test-login
 * - test-dashboard
 * - monitor <url>
 * - performance <url>
 */

const { createBrowser, createPage, cleanup, takeScreenshot, generatePDF } = require('./puppeteer-config');

// URLs do projeto
const URLS = {
  frontend: 'http://localhost:3001',
  backend: 'http://localhost:3000',
  swagger: 'http://localhost:3000/api',
  login: 'http://localhost:3001/login',
  dashboard: 'http://localhost:3001/dashboard',
  students: 'http://localhost:3001/students',
  teachers: 'http://localhost:3001/teachers',
  classes: 'http://localhost:3001/classes',
  grades: 'http://localhost:3001/grades',
  finance: 'http://localhost:3001/finance',
};

// Credenciais de teste
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@synexa.com',
    password: 'admin123'
  },
  secretary: {
    email: 'secretary@synexa.com', 
    password: 'secretary123'
  },
  teacher: {
    email: 'teacher@synexa.com',
    password: 'teacher123'
  }
};

// Comando principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    showHelp();
    return;
  }
  
  try {
    switch (command) {
      case 'screenshot':
        await takeScreenshotCommand(args[1], args[2]);
        break;
      case 'pdf':
        await generatePDFCommand(args[1], args[2]);
        break;
      case 'test-login':
        await testLoginCommand(args[1] || 'admin');
        break;
      case 'test-dashboard':
        await testDashboardCommand();
        break;
      case 'monitor':
        await monitorCommand(args[1]);
        break;
      case 'performance':
        await performanceCommand(args[1]);
        break;
      case 'health-check':
        await healthCheckCommand();
        break;
      case 'e2e-flow':
        await e2eFlowCommand(args[1]);
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.error(`❌ Comando desconhecido: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('❌ Erro ao executar comando:', error.message);
    process.exit(1);
  }
}

// Comando: Screenshot
async function takeScreenshotCommand(url, output) {
  if (!url) {
    console.error('❌ URL é obrigatória');
    console.log('💡 Uso: node .claude/puppeteer-helper.js screenshot <url> [output]');
    return;
  }
  
  const browser = await createBrowser('screenshot');
  const page = await createPage(browser);
  
  try {
    console.log(`📸 Capturando screenshot de: ${url}`);
    await page.goto(url);
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    const outputPath = output || `screenshots/screenshot-${Date.now()}.png`;
    await takeScreenshot(page, { path: outputPath });
    
    console.log(`✅ Screenshot salvo em: ${outputPath}`);
  } finally {
    await cleanup(browser);
  }
}

// Comando: PDF
async function generatePDFCommand(url, output) {
  if (!url) {
    console.error('❌ URL é obrigatória');
    console.log('💡 Uso: node .claude/puppeteer-helper.js pdf <url> [output]');
    return;
  }
  
  const browser = await createBrowser('pdf');
  const page = await createPage(browser);
  
  try {
    console.log(`📄 Gerando PDF de: ${url}`);
    await page.goto(url);
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    const outputPath = output || `pdfs/document-${Date.now()}.pdf`;
    await generatePDF(page, { path: outputPath });
    
    console.log(`✅ PDF salvo em: ${outputPath}`);
  } finally {
    await cleanup(browser);
  }
}

// Comando: Test Login
async function testLoginCommand(role = 'admin') {
  const browser = await createBrowser('dev');
  const page = await createPage(browser);
  
  try {
    console.log(`🔐 Testando login como: ${role}`);
    
    const credentials = TEST_CREDENTIALS[role];
    if (!credentials) {
      console.error(`❌ Credenciais não encontradas para role: ${role}`);
      return;
    }
    
    await page.goto(URLS.login);
    
    // Preencher formulário de login
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForNavigation();
    
    // Verificar se chegou no dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login realizado com sucesso');
      console.log(`🎯 Redirecionado para: ${currentUrl}`);
      
      // Capturar screenshot do dashboard
      await takeScreenshot(page, { path: `screenshots/dashboard-${role}-${Date.now()}.png` });
    } else {
      console.log('❌ Login falhou ou não redirecionou corretamente');
    }
    
  } finally {
    await cleanup(browser);
  }
}

// Comando: Test Dashboard
async function testDashboardCommand() {
  const browser = await createBrowser('dev');
  const page = await createPage(browser);
  
  try {
    console.log('📊 Testando dashboard...');
    
    // Fazer login como admin
    await loginAsAdmin(page);
    
    // Testar navegação no dashboard
    const menuItems = [
      { selector: '[data-testid="sidebar-students"]', name: 'Estudantes' },
      { selector: '[data-testid="sidebar-teachers"]', name: 'Professores' },
      { selector: '[data-testid="sidebar-classes"]', name: 'Turmas' },
      { selector: '[data-testid="sidebar-grades"]', name: 'Notas' },
      { selector: '[data-testid="sidebar-finance"]', name: 'Finanças' }
    ];
    
    for (const item of menuItems) {
      try {
        console.log(`🔍 Testando navegação: ${item.name}`);
        await page.click(item.selector);
        await page.waitForLoadState('networkidle');
        
        // Capturar screenshot da página
        await takeScreenshot(page, { 
          path: `screenshots/dashboard-${item.name.toLowerCase()}-${Date.now()}.png` 
        });
        
        console.log(`✅ ${item.name} - OK`);
      } catch (error) {
        console.log(`❌ ${item.name} - ERRO: ${error.message}`);
      }
    }
    
  } finally {
    await cleanup(browser);
  }
}

// Comando: Monitor
async function monitorCommand(url) {
  if (!url) {
    url = URLS.frontend;
  }
  
  const browser = await createBrowser('dev');
  const page = await createPage(browser);
  
  try {
    console.log(`📡 Monitorando: ${url}`);
    
    // Interceptar requests
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      console.log(`📤 Request: ${request.method()} ${request.url()}`);
      request.continue();
    });
    
    page.on('response', response => {
      const status = response.status();
      const statusIcon = status >= 400 ? '❌' : '✅';
      console.log(`📥 Response: ${statusIcon} ${status} ${response.url()}`);
    });
    
    page.on('console', msg => {
      console.log(`💬 Console: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error(`🚨 Page Error: ${error.message}`);
    });
    
    await page.goto(url);
    
    console.log('📡 Monitoramento ativo. Pressione Ctrl+C para sair.');
    
    // Manter o script rodando
    await new Promise(() => {});
    
  } finally {
    await cleanup(browser);
  }
}

// Comando: Performance
async function performanceCommand(url) {
  if (!url) {
    url = URLS.frontend;
  }
  
  const browser = await createBrowser('default');
  const page = await createPage(browser);
  
  try {
    console.log(`⚡ Testando performance de: ${url}`);
    
    // Medir tempo de carregamento
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`📊 Tempo de carregamento: ${loadTime}ms`);
    
    // Obter métricas do navegador
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
      };
    });
    
    console.log('📈 Métricas de Performance:');
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`   Load Complete: ${metrics.loadComplete}ms`);
    console.log(`   First Paint: ${metrics.firstPaint}ms`);
    console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint}ms`);
    
    // Capturar screenshot para análise visual
    await takeScreenshot(page, { path: `screenshots/performance-${Date.now()}.png` });
    
  } finally {
    await cleanup(browser);
  }
}

// Comando: Health Check
async function healthCheckCommand() {
  const browser = await createBrowser('default');
  const page = await createPage(browser);
  
  try {
    console.log('🏥 Executando health check...');
    
    const checks = [
      { name: 'Frontend', url: URLS.frontend },
      { name: 'Backend API', url: URLS.backend },
      { name: 'Swagger', url: URLS.swagger },
    ];
    
    for (const check of checks) {
      try {
        console.log(`🔍 Verificando ${check.name}...`);
        const response = await page.goto(check.url);
        
        if (response.ok()) {
          console.log(`✅ ${check.name} - OK (${response.status()})`);
        } else {
          console.log(`❌ ${check.name} - ERRO (${response.status()})`);
        }
      } catch (error) {
        console.log(`❌ ${check.name} - ERRO: ${error.message}`);
      }
    }
    
  } finally {
    await cleanup(browser);
  }
}

// Comando: E2E Flow
async function e2eFlowCommand(flow) {
  const browser = await createBrowser('dev');
  const page = await createPage(browser);
  
  try {
    console.log(`🔄 Executando fluxo E2E: ${flow}`);
    
    switch (flow) {
      case 'student-registration':
        await e2eStudentRegistration(page);
        break;
      case 'grade-input':
        await e2eGradeInput(page);
        break;
      case 'payment-process':
        await e2ePaymentProcess(page);
        break;
      default:
        console.error(`❌ Fluxo desconhecido: ${flow}`);
        console.log('💡 Fluxos disponíveis: student-registration, grade-input, payment-process');
    }
    
  } finally {
    await cleanup(browser);
  }
}

// Fluxo E2E: Registro de Estudante
async function e2eStudentRegistration(page) {
  console.log('👤 Iniciando fluxo de registro de estudante...');
  
  // Login como admin
  await loginAsAdmin(page);
  
  // Navegar para estudantes
  await page.click('[data-testid="sidebar-students"]');
  await page.waitForLoadState('networkidle');
  
  // Abrir modal de adicionar estudante
  await page.click('[data-testid="add-student-btn"]');
  
  // Preencher formulário
  await page.fill('input[name="name"]', 'João Silva Teste');
  await page.fill('input[name="email"]', 'joao.teste@email.com');
  await page.fill('input[name="birthDate"]', '2005-03-15');
  await page.selectOption('select[name="grade"]', '10');
  
  // Submeter formulário
  await page.click('button[type="submit"]');
  
  // Aguardar sucesso
  await page.waitForSelector('.success-message');
  
  console.log('✅ Estudante registrado com sucesso');
  
  // Capturar screenshot
  await takeScreenshot(page, { path: `screenshots/student-registration-${Date.now()}.png` });
}

// Fluxo E2E: Lançamento de Notas
async function e2eGradeInput(page) {
  console.log('📝 Iniciando fluxo de lançamento de notas...');
  
  // Login como professor
  await loginAsTeacher(page);
  
  // Navegar para notas
  await page.click('[data-testid="sidebar-grades"]');
  await page.waitForLoadState('networkidle');
  
  // Selecionar turma
  await page.selectOption('select[name="class"]', 'class-10a');
  
  // Selecionar disciplina
  await page.selectOption('select[name="subject"]', 'subject-math');
  
  // Lançar nota
  await page.fill('input[data-student-id="1"]', '18.5');
  
  // Salvar notas
  await page.click('button[data-testid="save-grades"]');
  
  // Aguardar sucesso
  await page.waitForSelector('.grades-saved');
  
  console.log('✅ Notas lançadas com sucesso');
  
  // Capturar screenshot
  await takeScreenshot(page, { path: `screenshots/grade-input-${Date.now()}.png` });
}

// Fluxo E2E: Processo de Pagamento
async function e2ePaymentProcess(page) {
  console.log('💰 Iniciando fluxo de processo de pagamento...');
  
  // Login como secretaria
  await loginAsSecretary(page);
  
  // Navegar para finanças
  await page.click('[data-testid="sidebar-finance"]');
  await page.waitForLoadState('networkidle');
  
  // Processar pagamento
  await page.click('[data-testid="process-payment-btn"]');
  
  // Preencher dados do pagamento
  await page.fill('input[name="amount"]', '5000');
  await page.selectOption('select[name="method"]', 'bank-transfer');
  await page.fill('textarea[name="description"]', 'Pagamento de mensalidade');
  
  // Confirmar pagamento
  await page.click('button[data-testid="confirm-payment"]');
  
  // Aguardar sucesso
  await page.waitForSelector('.payment-success');
  
  console.log('✅ Pagamento processado com sucesso');
  
  // Capturar screenshot
  await takeScreenshot(page, { path: `screenshots/payment-process-${Date.now()}.png` });
}

// Função auxiliar: Login como Admin
async function loginAsAdmin(page) {
  await page.goto(URLS.login);
  await page.fill('input[name="email"]', TEST_CREDENTIALS.admin.email);
  await page.fill('input[name="password"]', TEST_CREDENTIALS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

// Função auxiliar: Login como Professor
async function loginAsTeacher(page) {
  await page.goto(URLS.login);
  await page.fill('input[name="email"]', TEST_CREDENTIALS.teacher.email);
  await page.fill('input[name="password"]', TEST_CREDENTIALS.teacher.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

// Função auxiliar: Login como Secretaria
async function loginAsSecretary(page) {
  await page.goto(URLS.login);
  await page.fill('input[name="email"]', TEST_CREDENTIALS.secretary.email);
  await page.fill('input[name="password"]', TEST_CREDENTIALS.secretary.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

// Mostrar ajuda
function showHelp() {
  console.log(`
🎭 Puppeteer Helper - Synexa-SIS Project

Comandos disponíveis:

📸 Screenshots:
  screenshot <url> [output]     Capturar screenshot de uma página
  
📄 PDFs:
  pdf <url> [output]           Gerar PDF de uma página
  
🔐 Testes de Autenticação:
  test-login [role]            Testar login (admin|secretary|teacher)
  
📊 Testes de Interface:
  test-dashboard               Testar navegação no dashboard
  
📡 Monitoramento:
  monitor [url]                Monitorar requests e responses
  
⚡ Performance:
  performance [url]            Testar performance de uma página
  
🏥 Health Check:
  health-check                 Verificar saúde dos serviços
  
🔄 Fluxos E2E:
  e2e-flow <flow>              Executar fluxo E2E
    - student-registration
    - grade-input
    - payment-process
  
❓ Ajuda:
  help                         Mostrar esta ajuda

Exemplos:
  node .claude/puppeteer-helper.js screenshot http://localhost:3001
  node .claude/puppeteer-helper.js test-login admin
  node .claude/puppeteer-helper.js e2e-flow student-registration
  node .claude/puppeteer-helper.js performance http://localhost:3001/dashboard
  `);
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  takeScreenshotCommand,
  generatePDFCommand,
  testLoginCommand,
  testDashboardCommand,
  monitorCommand,
  performanceCommand,
  healthCheckCommand,
  e2eFlowCommand,
};