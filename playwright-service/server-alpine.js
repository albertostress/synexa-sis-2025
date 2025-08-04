const express = require('express');
const { chromium } = require('playwright-core');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Instância global do browser
let browser;

// Inicializar browser
async function initBrowser() {
  try {
    browser = await chromium.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ]
    });
    console.log('✅ Chromium browser iniciado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao iniciar browser:', error);
    process.exit(1);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'playwright-pdf-service',
    browser: browser ? 'ready' : 'not ready'
  });
});

// Endpoint para gerar PDF
app.post('/generate-pdf', async (req, res) => {
  const { html, options = {} } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'HTML content is required' });
  }

  let page;
  try {
    // Criar nova página
    page = await browser.newPage();
    
    // Definir conteúdo HTML
    await page.setContent(html, { waitUntil: 'networkidle' });
    
    // Opções padrão para PDF
    const pdfOptions = {
      format: options.format || 'A4',
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      ...options
    };
    
    // Gerar PDF
    const pdfBuffer = await page.pdf(pdfOptions);
    
    // Enviar PDF como resposta
    res.contentType('application/pdf');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message 
    });
  } finally {
    // Fechar página
    if (page) {
      await page.close();
    }
  }
});

// Endpoint para converter HTML para imagem
app.post('/generate-image', async (req, res) => {
  const { html, options = {} } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'HTML content is required' });
  }

  let page;
  try {
    page = await browser.newPage();
    
    // Definir viewport se especificado
    if (options.viewport) {
      await page.setViewportSize(options.viewport);
    }
    
    await page.setContent(html, { waitUntil: 'networkidle' });
    
    // Opções para screenshot
    const screenshotOptions = {
      type: options.type || 'png',
      fullPage: options.fullPage !== false,
      ...options
    };
    
    const imageBuffer = await page.screenshot(screenshotOptions);
    
    res.contentType(`image/${screenshotOptions.type}`);
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message 
    });
  } finally {
    if (page) {
      await page.close();
    }
  }
});

// Iniciar servidor
async function start() {
  await initBrowser();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Playwright PDF Service rodando na porta ${PORT}`);
    console.log(`📄 Endpoints disponíveis:`);
    console.log(`   - GET  /health`);
    console.log(`   - POST /generate-pdf`);
    console.log(`   - POST /generate-image`);
  });
}

// Tratamento de erros e shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, fechando browser...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido, fechando browser...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

// Iniciar aplicação
start().catch(error => {
  console.error('Erro ao iniciar serviço:', error);
  process.exit(1);
});