/**
 * Puppeteer Configuration for Synexa-SIS Project
 * Configuração do Puppeteer para uso no projeto Synexa-SIS
 */

const puppeteer = require('../escola-backend/node_modules/puppeteer');

// Configuração padrão do Puppeteer (otimizada para WSL/Docker)
const defaultConfig = {
  headless: true,
  defaultViewport: {
    width: 1920,
    height: 1080,
  },
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-default-apps',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--disable-webgl',
    '--disable-webgl2',
    '--ignore-certificate-errors',
    '--ignore-ssl-errors',
    '--ignore-certificate-errors-spki-list',
    '--ignore-certificate-errors-ssl-warning',
    '--allow-running-insecure-content',
    '--disable-features=VizDisplayCompositor',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=9222'
  ],
};

// Configuração para desenvolvimento (com interface)
const devConfig = {
  ...defaultConfig,
  headless: false,
  devtools: true,
  slowMo: 250,
};

// Configuração para produção (otimizada)
const prodConfig = {
  ...defaultConfig,
  headless: 'new',
  args: [
    ...defaultConfig.args,
    '--disable-extensions',
    '--disable-plugins',
    '--disable-images',
    '--disable-javascript',
  ],
};

// Configuração para PDFs
const pdfConfig = {
  ...defaultConfig,
  headless: 'new',
  args: [
    ...defaultConfig.args,
    '--run-all-compositor-stages-before-draw',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ],
};

// Configuração para screenshots
const screenshotConfig = {
  ...defaultConfig,
  headless: 'new',
  defaultViewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2,
  },
};

// Configuração para testes
const testConfig = {
  ...defaultConfig,
  headless: 'new',
  args: [
    ...defaultConfig.args,
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
  ],
};

// Função para criar instância do Puppeteer
async function createBrowser(config = 'default') {
  const configs = {
    default: defaultConfig,
    dev: devConfig,
    prod: prodConfig,
    pdf: pdfConfig,
    screenshot: screenshotConfig,
    test: testConfig,
  };

  const selectedConfig = configs[config] || defaultConfig;
  
  try {
    const browser = await puppeteer.launch(selectedConfig);
    console.log(`✅ Puppeteer browser criado com config: ${config}`);
    return browser;
  } catch (error) {
    console.error('❌ Erro ao criar browser Puppeteer:', error);
    throw error;
  }
}

// Função para criar página com configurações padrão
async function createPage(browser, options = {}) {
  const page = await browser.newPage();
  
  // Configurações padrão da página
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  // Interceptar requests se necessário
  if (options.blockImages) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });
  }
  
  // Timeout padrão
  page.setDefaultTimeout(options.timeout || 30000);
  
  return page;
}

// Função para cleanup
async function cleanup(browser) {
  if (browser) {
    await browser.close();
    console.log('🔄 Browser Puppeteer fechado');
  }
}

// Função para aguardar elemento
async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`❌ Elemento não encontrado: ${selector}`);
    return false;
  }
}

// Função para screenshot com configurações otimizadas
async function takeScreenshot(page, options = {}) {
  const defaultOptions = {
    fullPage: true,
    type: 'png',
    quality: 90,
  };
  
  const screenshotOptions = { ...defaultOptions, ...options };
  
  try {
    const screenshot = await page.screenshot(screenshotOptions);
    console.log('📸 Screenshot capturado');
    return screenshot;
  } catch (error) {
    console.error('❌ Erro ao capturar screenshot:', error);
    throw error;
  }
}

// Função para gerar PDF com configurações otimizadas
async function generatePDF(page, options = {}) {
  const defaultOptions = {
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1cm',
      bottom: '1cm',
      left: '1cm',
      right: '1cm',
    },
  };
  
  const pdfOptions = { ...defaultOptions, ...options };
  
  try {
    const pdf = await page.pdf(pdfOptions);
    console.log('📄 PDF gerado');
    return pdf;
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    throw error;
  }
}

module.exports = {
  createBrowser,
  createPage,
  cleanup,
  waitForElement,
  takeScreenshot,
  generatePDF,
  configs: {
    default: defaultConfig,
    dev: devConfig,
    prod: prodConfig,
    pdf: pdfConfig,
    screenshot: screenshotConfig,
    test: testConfig,
  },
};