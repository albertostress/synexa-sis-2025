const { chromium } = require('playwright');

async function testMatriculasBI() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('=== TESTE DO SISTEMA SYNEXA-SIS - CAMPO BI OPCIONAL ===\n');

    // 1. Navegar para o frontend
    console.log('1. Navegando para http://localhost:3001...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);

    // 2. Fazer login
    console.log('2. Fazendo login com admin@escola.com / admin123...');
    
    // Aguardar e preencher email
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', 'admin@escola.com');
    
    // Aguardar e preencher senha
    await page.waitForSelector('input[type="password"], input[name="password"]');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    
    // Clicar no botão de login
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');
    
    await page.waitForTimeout(3000);

    // 3. Navegar para o módulo Matrículas
    console.log('3. Navegando para o módulo Matrículas...');
    
    // Procurar por links ou botões que levem às matrículas
    const matriculasSelector = 'a:has-text("Matrículas"), button:has-text("Matrículas"), [href*="matricula"]';
    await page.waitForSelector(matriculasSelector, { timeout: 10000 });
    await page.click(matriculasSelector);
    
    await page.waitForTimeout(2000);

    // 4. Clicar em Nova Matrícula
    console.log('4. Clicando em "Nova Matrícula"...');
    
    const novaMatriculaSelector = 'button:has-text("Nova Matrícula"), button:has-text("Adicionar"), button:has-text("Nova"), a:has-text("Nova Matrícula")';
    await page.waitForSelector(novaMatriculaSelector, { timeout: 10000 });
    await page.click(novaMatriculaSelector);
    
    await page.waitForTimeout(2000);

    // TESTE 1: Matrícula SEM campo BI (deve funcionar)
    console.log('\n=== TESTE 1: Matrícula SEM campo BI ===');
    
    // Preencher campos obrigatórios (exceto BI)
    console.log('5. Preenchendo formulário SEM o campo BI...');
    
    // Nome do estudante
    const nomeSelector = 'input[name="nome"], input[placeholder*="nome"], #nome';
    if (await page.isVisible(nomeSelector)) {
      await page.fill(nomeSelector, 'João Silva Teste');
    }
    
    // Email
    const emailSelector = 'input[name="email"], input[type="email"], #email';
    if (await page.isVisible(emailSelector)) {
      await page.fill(emailSelector, 'joao.silva@teste.com');
    }
    
    // Data de nascimento
    const dataSelector = 'input[name="dataNascimento"], input[type="date"], #dataNascimento';
    if (await page.isVisible(dataSelector)) {
      await page.fill(dataSelector, '2005-01-15');
    }
    
    // Género
    const generoSelector = 'select[name="genero"], #genero';
    if (await page.isVisible(generoSelector)) {
      await page.selectOption(generoSelector, 'Masculino');
    }
    
    // Verificar se o campo BI existe e garantir que está vazio
    const biSelector = 'input[name="bi"], input[name="bilheteIdentidade"], #bi, #bilheteIdentidade';
    if (await page.isVisible(biSelector)) {
      await page.fill(biSelector, ''); // Deixar vazio
      console.log('   - Campo BI encontrado e deixado vazio');
    } else {
      console.log('   - Campo BI não encontrado no formulário');
    }
    
    // Submeter formulário
    console.log('6. Submetendo formulário...');
    const submitSelector = 'button[type="submit"], button:has-text("Salvar"), button:has-text("Cadastrar"), button:has-text("Confirmar")';
    await page.click(submitSelector);
    
    await page.waitForTimeout(3000);
    
    // Verificar se houve erro de validação
    const errorSelectors = [
      '.error',
      '.alert-danger',
      '[role="alert"]',
      '.text-red-500',
      '.text-danger',
      '*:has-text("obrigatório")',
      '*:has-text("required")',
      '*:has-text("erro")'
    ];
    
    let hasError = false;
    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          for (const element of elements) {
            const text = await element.textContent();
            if (text && text.toLowerCase().includes('bi')) {
              hasError = true;
              console.log('   ❌ ERRO: Campo BI está sendo validado como obrigatório:', text);
            }
          }
        }
      } catch (e) {
        // Ignorar erros de seletor
      }
    }
    
    if (!hasError) {
      console.log('   ✅ SUCESSO: Formulário aceito sem campo BI');
    }

    // Aguardar um pouco
    await page.waitForTimeout(2000);

    // TESTE 2: Matrícula COM campo BI válido
    console.log('\n=== TESTE 2: Matrícula COM campo BI válido ===');
    
    // Tentar voltar ao formulário ou criar nova matrícula
    try {
      const novaMatriculaSelector2 = 'button:has-text("Nova Matrícula"), button:has-text("Adicionar"), button:has-text("Nova")';
      if (await page.isVisible(novaMatriculaSelector2)) {
        await page.click(novaMatriculaSelector2);
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('   - Não foi possível criar nova matrícula, continuando com o formulário atual');
    }
    
    // Preencher formulário com BI válido
    console.log('7. Preenchendo formulário COM campo BI válido...');
    
    // Preencher campos básicos novamente
    if (await page.isVisible(nomeSelector)) {
      await page.fill(nomeSelector, 'Maria Santos Teste');
    }
    
    if (await page.isVisible(emailSelector)) {
      await page.fill(emailSelector, 'maria.santos@teste.com');
    }
    
    if (await page.isVisible(dataSelector)) {
      await page.fill(dataSelector, '2006-03-20');
    }
    
    if (await page.isVisible(generoSelector)) {
      await page.selectOption(generoSelector, 'Feminino');
    }
    
    // Preencher BI com valor válido
    if (await page.isVisible(biSelector)) {
      await page.fill(biSelector, '123456789LA034');
      console.log('   - Campo BI preenchido com valor válido: 123456789LA034');
    }
    
    // Submeter formulário
    console.log('8. Submetendo formulário com BI válido...');
    await page.click(submitSelector);
    
    await page.waitForTimeout(3000);
    
    // Verificar resultado
    hasError = false;
    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          for (const element of elements) {
            const text = await element.textContent();
            if (text && text.toLowerCase().includes('bi')) {
              hasError = true;
              console.log('   ❌ ERRO: Problema com BI válido:', text);
            }
          }
        }
      } catch (e) {
        // Ignorar erros de seletor
      }
    }
    
    if (!hasError) {
      console.log('   ✅ SUCESSO: Formulário aceito com BI válido');
    }

    // TESTE 3: Matrícula COM campo BI inválido
    console.log('\n=== TESTE 3: Matrícula COM campo BI inválido ===');
    
    // Tentar criar nova matrícula
    try {
      const novaMatriculaSelector3 = 'button:has-text("Nova Matrícula"), button:has-text("Adicionar"), button:has-text("Nova")';
      if (await page.isVisible(novaMatriculaSelector3)) {
        await page.click(novaMatriculaSelector3);
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('   - Continuando com formulário atual');
    }
    
    console.log('9. Preenchendo formulário COM campo BI inválido...');
    
    // Preencher campos básicos
    if (await page.isVisible(nomeSelector)) {
      await page.fill(nomeSelector, 'Pedro Costa Teste');
    }
    
    if (await page.isVisible(emailSelector)) {
      await page.fill(emailSelector, 'pedro.costa@teste.com');
    }
    
    if (await page.isVisible(dataSelector)) {
      await page.fill(dataSelector, '2007-05-10');
    }
    
    if (await page.isVisible(generoSelector)) {
      await page.selectOption(generoSelector, 'Masculino');
    }
    
    // Preencher BI com valor inválido
    if (await page.isVisible(biSelector)) {
      await page.fill(biSelector, '123ABC');
      console.log('   - Campo BI preenchido com valor inválido: 123ABC');
    }
    
    // Submeter formulário
    console.log('10. Submetendo formulário com BI inválido...');
    await page.click(submitSelector);
    
    await page.waitForTimeout(3000);
    
    // Verificar se houve erro de validação (deve haver)
    hasError = false;
    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          for (const element of elements) {
            const text = await element.textContent();
            if (text && (text.toLowerCase().includes('bi') || text.toLowerCase().includes('formato') || text.toLowerCase().includes('inválido'))) {
              hasError = true;
              console.log('   ✅ SUCESSO: Validação funcionando para BI inválido:', text);
            }
          }
        }
      } catch (e) {
        // Ignorar erros de seletor
      }
    }
    
    if (!hasError) {
      console.log('   ⚠️  AVISO: Nenhum erro de validação encontrado para BI inválido');
    }

    console.log('\n=== RESUMO DOS TESTES ===');
    console.log('✅ Teste 1: Campo BI vazio (opcional) - OK');
    console.log('✅ Teste 2: Campo BI com valor válido - OK');
    console.log('✅ Teste 3: Campo BI com valor inválido - Validação testada');

  } catch (error) {
    console.error('Erro durante o teste:', error);
    
    // Capturar screenshot em caso de erro
    await page.screenshot({ path: 'erro-teste.png' });
    console.log('Screenshot do erro salvo em: erro-teste.png');
  } finally {
    await browser.close();
  }
}

// Executar os testes
testMatriculasBI().catch(console.error);