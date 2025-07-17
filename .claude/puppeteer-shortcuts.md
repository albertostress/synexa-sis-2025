# 🎭 Puppeteer Shortcuts & Commands - Synexa-SIS

Comandos e shortcuts para usar Puppeteer no projeto Synexa-SIS com maximum efficiency.

## 🚀 Quick Start Commands

### Iniciar Browser
```javascript
// Configuração padrão
const { createBrowser } = require('./.claude/puppeteer-config');
const browser = await createBrowser('default');

// Desenvolvimento (com interface)
const browser = await createBrowser('dev');

// Produção (otimizado)
const browser = await createBrowser('prod');

// Para PDFs
const browser = await createBrowser('pdf');

// Para screenshots
const browser = await createBrowser('screenshot');
```

### Criar Página
```javascript
const { createPage } = require('./.claude/puppeteer-config');
const page = await createPage(browser);

// Com opções
const page = await createPage(browser, {
  blockImages: true,
  timeout: 60000
});
```

## 📸 Screenshot Commands

### Screenshot básico
```javascript
const { takeScreenshot } = require('./.claude/puppeteer-config');
await page.goto('http://localhost:3001');
const screenshot = await takeScreenshot(page);
```

### Screenshot com opções
```javascript
const screenshot = await takeScreenshot(page, {
  path: 'screenshots/login-page.png',
  fullPage: true,
  type: 'png',
  quality: 90
});
```

### Screenshot de elemento específico
```javascript
const element = await page.$('.dashboard-card');
const screenshot = await element.screenshot({
  path: 'screenshots/dashboard-card.png'
});
```

## 📄 PDF Generation Commands

### PDF básico
```javascript
const { generatePDF } = require('./.claude/puppeteer-config');
await page.goto('http://localhost:3001/reports');
const pdf = await generatePDF(page);
```

### PDF com opções avançadas
```javascript
const pdf = await generatePDF(page, {
  path: 'reports/student-report.pdf',
  format: 'A4',
  printBackground: true,
  landscape: false,
  margin: {
    top: '2cm',
    bottom: '2cm',
    left: '1.5cm',
    right: '1.5cm'
  },
  headerTemplate: '<div style="font-size:10px;">Synexa-SIS Report</div>',
  footerTemplate: '<div style="font-size:10px;">Page <span class="pageNumber"></span></div>',
  displayHeaderFooter: true
});
```

## 🎯 Common Selectors for Synexa-SIS

### Login Form
```javascript
await page.fill('input[name="email"]', 'admin@synexa.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');
```

### Dashboard Navigation
```javascript
// Sidebar navigation
await page.click('[data-testid="sidebar-students"]');
await page.click('[data-testid="sidebar-teachers"]');
await page.click('[data-testid="sidebar-classes"]');
await page.click('[data-testid="sidebar-grades"]');
await page.click('[data-testid="sidebar-finance"]');
```

### Modal Operations
```javascript
// Open modal
await page.click('[data-testid="add-student-btn"]');

// Fill modal form
await page.fill('input[name="name"]', 'João Silva');
await page.fill('input[name="email"]', 'joao@email.com');

// Close modal
await page.click('[data-testid="modal-close"]');
```

### Table Operations
```javascript
// Search in table
await page.fill('input[placeholder="Buscar..."]', 'João');

// Sort table
await page.click('th[data-column="name"]');

// Pagination
await page.click('[data-testid="pagination-next"]');
```

## 🔍 Testing Shortcuts

### Wait for Elements
```javascript
// Wait for element to be visible
await page.waitForSelector('.dashboard-loaded');

// Wait for navigation
await page.waitForNavigation();

// Wait for specific text
await page.waitForFunction(
  () => document.querySelector('.status').textContent.includes('Carregado')
);
```

### Form Validation Tests
```javascript
// Test required field validation
await page.click('button[type="submit"]');
const errorMessage = await page.textContent('.error-message');
expect(errorMessage).toContain('Campo obrigatório');

// Test email format validation
await page.fill('input[type="email"]', 'invalid-email');
await page.click('button[type="submit"]');
const emailError = await page.textContent('.email-error');
expect(emailError).toContain('Email inválido');
```

### Authentication Tests
```javascript
// Test login success
await page.fill('input[name="email"]', 'admin@synexa.com');
await page.fill('input[name="password"]', 'password123');
await page.click('button[type="submit"]');
await page.waitForSelector('.dashboard');

// Test login failure
await page.fill('input[name="email"]', 'wrong@email.com');
await page.fill('input[name="password"]', 'wrongpassword');
await page.click('button[type="submit"]');
await page.waitForSelector('.error-message');
```

## 📊 Performance Testing

### Measure Page Load Time
```javascript
const startTime = Date.now();
await page.goto('http://localhost:3001/dashboard');
await page.waitForSelector('.dashboard-loaded');
const loadTime = Date.now() - startTime;
console.log(`Page loaded in ${loadTime}ms`);
```

### Network Monitoring
```javascript
// Monitor network requests
await page.setRequestInterception(true);
page.on('request', request => {
  console.log(`Request: ${request.method()} ${request.url()}`);
  request.continue();
});

page.on('response', response => {
  console.log(`Response: ${response.status()} ${response.url()}`);
});
```

## 🎨 UI Testing Shortcuts

### Theme Testing
```javascript
// Test dark mode
await page.click('[data-testid="theme-toggle"]');
await page.waitForSelector('body.dark');

// Test light mode
await page.click('[data-testid="theme-toggle"]');
await page.waitForSelector('body.light');
```

### Responsive Testing
```javascript
// Mobile view
await page.setViewport({ width: 375, height: 667 });
await page.reload();

// Tablet view
await page.setViewport({ width: 768, height: 1024 });
await page.reload();

// Desktop view
await page.setViewport({ width: 1920, height: 1080 });
await page.reload();
```

## 🧪 E2E Testing Flows

### Student Registration Flow
```javascript
// Navigate to students page
await page.click('[data-testid="sidebar-students"]');

// Open add student modal
await page.click('[data-testid="add-student-btn"]');

// Fill form
await page.fill('input[name="name"]', 'Maria Santos');
await page.fill('input[name="email"]', 'maria@email.com');
await page.fill('input[name="birthDate"]', '2005-03-15');
await page.selectOption('select[name="grade"]', '10');

// Submit form
await page.click('button[type="submit"]');

// Verify success
await page.waitForSelector('.success-message');
```

### Grade Input Flow
```javascript
// Navigate to grades page
await page.click('[data-testid="sidebar-grades"]');

// Select class
await page.selectOption('select[name="class"]', 'class-10a');

// Select subject
await page.selectOption('select[name="subject"]', 'subject-math');

// Input grade
await page.fill('input[data-student-id="1"]', '18.5');

// Save grades
await page.click('button[data-testid="save-grades"]');

// Verify success
await page.waitForSelector('.grades-saved');
```

## 🔧 Debugging Commands

### Console Logs
```javascript
// Enable console logs
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// Evaluate JavaScript
const result = await page.evaluate(() => {
  return document.querySelector('.dashboard-title').textContent;
});
```

### Error Handling
```javascript
// Handle page errors
page.on('pageerror', error => {
  console.error('Page error:', error);
});

// Handle request failures
page.on('requestfailed', request => {
  console.error('Request failed:', request.url());
});
```

## 📱 Mobile Testing

### Device Emulation
```javascript
const iPhone = puppeteer.devices['iPhone 12'];
await page.emulate(iPhone);

const iPad = puppeteer.devices['iPad Pro'];
await page.emulate(iPad);
```

### Touch Events
```javascript
// Tap element
await page.tap('.mobile-menu-toggle');

// Swipe
await page.touchscreen.swipe(100, 100, 200, 100);
```

## 🎯 Common Shortcuts

### Quick Browser Setup
```javascript
// One-liner for quick testing
const browser = await require('./.claude/puppeteer-config').createBrowser('dev');
const page = await browser.newPage();
await page.goto('http://localhost:3001');
```

### Quick Screenshot
```javascript
// One-liner screenshot
await (await browser.newPage()).goto('http://localhost:3001') && await page.screenshot({ path: 'quick-screenshot.png' });
```

### Quick PDF
```javascript
// One-liner PDF
await (await browser.newPage()).goto('http://localhost:3001/reports') && await page.pdf({ path: 'quick-report.pdf' });
```

## 🔄 Cleanup Commands

### Always Close Browser
```javascript
const { cleanup } = require('./.claude/puppeteer-config');
await cleanup(browser);
```

### Multiple Browser Cleanup
```javascript
const browsers = [browser1, browser2, browser3];
await Promise.all(browsers.map(b => cleanup(b)));
```

---

## 🎪 Pro Tips

1. **Use data-testid attributes** for reliable element selection
2. **Always wait for elements** before interacting with them
3. **Use page.evaluate()** for complex JavaScript operations
4. **Monitor network requests** for API testing
5. **Take screenshots** for visual regression testing
6. **Use headless: false** for debugging
7. **Set viewport** for consistent screenshots
8. **Use page.pdf()** for generating reports
9. **Handle errors gracefully** with try-catch blocks
10. **Close browsers** to prevent memory leaks

---

*Este arquivo é parte do projeto Synexa-SIS e deve ser mantido atualizado com novos comandos e shortcuts conforme o projeto evolui.*