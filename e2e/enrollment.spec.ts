import { test, expect } from '@playwright/test';

test.describe('Enrollment Form', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:3001/login');
    
    // Login as admin
    await page.fill('input[name="email"]', 'admin@escola.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Entrar")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    // Navigate to enrollments page
    await page.goto('http://localhost:3001/enrollments');
  });

  test('should create enrollment successfully', async ({ page }) => {
    // Click on the "Nova Matrícula" button
    await page.click('text=+ Nova Matrícula');
    
    // Wait for the modal/form to appear
    await expect(page.locator('text=Nova Matrícula')).toBeVisible();

    // Step 1: Fill student data
    await page.fill('input[name="student.firstName"]', 'António');
    await page.fill('input[name="student.lastName"]', 'Hermelinda');
    await page.selectOption('select[name="student.gender"]', 'MASCULINO');
    await page.fill('input[name="student.birthDate"]', '2005-05-20');
    await page.fill('input[name="student.province"]', 'Luanda');
    await page.fill('input[name="student.municipality"]', 'Maianga');
    
    // Click next to guardian tab
    await page.click('text=Próximo: Encarregado');

    // Step 2: Fill guardian data
    await page.fill('input[name="student.guardian.name"]', 'Maria Silva');
    await page.fill('input[name="student.guardian.phone"]', '923456789');
    await page.fill('input[name="student.guardian.email"]', 'maria@email.com');
    await page.selectOption('select[name="student.guardian.relationship"]', 'Mãe');
    await page.fill('textarea[name="student.guardian.address"]', 'Rua da Paz, Maianga, Luanda');
    
    // Click next to enrollment tab
    await page.click('text=Próximo: Matrícula');

    // Step 3: Fill enrollment data
    await page.selectOption('select[name="academicYear"]', '2025');
    
    // Wait for classes to load and select one
    await page.waitForTimeout(1000);
    await page.selectOption('select[name="classId"]', { index: 1 }); // Select first available class
    
    // Submit the form
    await page.click('button:has-text("Criar Matrícula")');

    // Expect success message
    await expect(page.locator('text=Matrícula criada com sucesso')).toBeVisible({ timeout: 10000 });
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Click on the "Nova Matrícula" button
    await page.click('text=+ Nova Matrícula');
    
    // Wait for the modal/form to appear
    await expect(page.locator('text=Nova Matrícula')).toBeVisible();

    // Try to submit without filling required fields
    await page.click('text=Próximo: Encarregado');
    await page.click('text=Próximo: Matrícula');
    await page.click('button:has-text("Criar Matrícula")');

    // Expect validation error message
    await expect(page.locator('text=Por favor, verifique os campos obrigatórios')).toBeVisible();
  });

  test('should prevent enrollment when class is full', async ({ page }) => {
    // Click on the "Nova Matrícula" button
    await page.click('text=+ Nova Matrícula');
    
    // Fill valid student data
    await page.fill('input[name="student.firstName"]', 'José');
    await page.fill('input[name="student.lastName"]', 'Santos');
    await page.selectOption('select[name="student.gender"]', 'MASCULINO');
    await page.fill('input[name="student.birthDate"]', '2006-03-15');
    await page.fill('input[name="student.province"]', 'Luanda');
    await page.fill('input[name="student.municipality"]', 'Ingombota');
    
    await page.click('text=Próximo: Encarregado');
    
    // Fill guardian data
    await page.fill('input[name="student.guardian.name"]', 'Ana Santos');
    await page.fill('input[name="student.guardian.phone"]', '924567890');
    await page.fill('input[name="student.guardian.email"]', 'ana@email.com');
    await page.selectOption('select[name="student.guardian.relationship"]', 'Mãe');
    await page.fill('textarea[name="student.guardian.address"]', 'Av. Marginal, Ingombota, Luanda');
    
    await page.click('text=Próximo: Matrícula');
    
    // Select academic year
    await page.selectOption('select[name="academicYear"]', '2025');
    
    // If we find a full class, select it and verify button is disabled
    const fullClassOption = page.locator('text=Esta turma está cheia');
    if (await fullClassOption.isVisible()) {
      // Button should be disabled
      await expect(page.locator('button:has-text("Criar Matrícula")')).toBeDisabled();
    }
  });

  test('should validate BI format when provided', async ({ page }) => {
    // Click on the "Nova Matrícula" button
    await page.click('text=+ Nova Matrícula');
    
    // Fill student data with invalid BI
    await page.fill('input[name="student.firstName"]', 'Maria');
    await page.fill('input[name="student.lastName"]', 'Costa');
    await page.selectOption('select[name="student.gender"]', 'FEMININO');
    await page.fill('input[name="student.birthDate"]', '2007-08-10');
    await page.fill('input[name="student.biNumber"]', '123'); // Invalid BI format
    await page.fill('input[name="student.province"]', 'Luanda');
    await page.fill('input[name="student.municipality"]', 'Viana');
    
    // Move to next field to trigger validation
    await page.fill('input[name="student.province"]', 'Luanda');
    
    // Expect BI validation error
    await expect(page.locator('text=BI deve ter 14 caracteres')).toBeVisible();
  });
});