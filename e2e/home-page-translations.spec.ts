import { test, expect } from '@playwright/test';

test.describe('HomeView Translation Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('should load home page successfully and display main content sections', async ({ page }) => {
    // Verify page loads successfully
    await expect(page).toHaveTitle(/GDN KTN BUND/);

    // Check that main content sections are present
    await expect(page.locator('.home-view')).toBeVisible();

    // Verify header section
    await expect(page.locator('.header h1')).toBeVisible();
    await expect(page.locator('.header p')).toBeVisible();

    // Verify description section
    await expect(page.locator('.description-section')).toBeVisible();
    await expect(page.locator('.description-section h2')).toBeVisible();
    await expect(page.locator('.description-section .intro')).toBeVisible();

    // Verify CTA section
    await expect(page.locator('.cta-section')).toBeVisible();
    await expect(page.locator('.cta-section h3')).toBeVisible();
    await expect(page.locator('.cta-button.primary')).toBeVisible();
    await expect(page.locator('.cta-button.secondary')).toBeVisible();
  });

  test('should display German content by default', async ({ page }) => {
    // Check that German content is displayed by default
    await expect(page.locator('.header h1')).toContainText('Schweizer Finanzdaten-Baum-Navigator');
    await expect(page.locator('.header p')).toContainText('Erkunden Sie hierarchische Finanzdatenstrukturen');

    // Check description section
    await expect(page.locator('.description-section h2')).toContainText('Finanzdaten von Gemeinden vergleichen');
    await expect(page.locator('.description-section .intro')).toContainText('Diese Website ermöglicht es Ihnen');

    // Check CTA section
    await expect(page.locator('.cta-section h3')).toContainText('Jetzt Daten erkunden');
    await expect(page.locator('.cta-button.primary')).toContainText('Finanzdaten vergleichen');
    await expect(page.locator('.cta-button.secondary')).toContainText('Mehr erfahren');

    // Check language selector shows DE
    await expect(page.locator('.language-code')).toContainText('DE');
  });

  test('should switch to English and display English content', async ({ page }) => {
    // Store initial German content for comparison
    const initialTitle = await page.locator('.header h1').textContent();
    const initialSubtitle = await page.locator('.header p').textContent();
    const initialDescTitle = await page.locator('.description-section h2').textContent();
    const initialCtaTitle = await page.locator('.cta-section h3').textContent();
    const initialCtaButtonPrimary = await page.locator('.cta-button.primary').textContent();
    const initialCtaButtonSecondary = await page.locator('.cta-button.secondary').textContent();

    // Click language selector to open dropdown
    await page.locator('.language-trigger').click();

    // Wait for dropdown to be visible
    await expect(page.locator('.language-dropdown')).toBeVisible();

    // Find and click English option
    const englishOption = page.locator('.language-option').filter({ hasText: 'English' });
    await expect(englishOption).toBeVisible();
    await englishOption.click();

    // Wait for language change to take effect
    await expect(page.locator('.language-code')).toContainText('EN');

    // Verify English content is displayed
    await expect(page.locator('.header h1')).toContainText('Swiss Financial Data Tree Navigator');
    await expect(page.locator('.header p')).toContainText('Explore hierarchical financial data structures');

    // Check description section
    await expect(page.locator('.description-section h2')).toContainText('Compare Municipal Financial Data');
    await expect(page.locator('.description-section .intro')).toContainText('This website enables you to analyze');

    // Check CTA section
    await expect(page.locator('.cta-section h3')).toContainText('Start Exploring Data');
    await expect(page.locator('.cta-button.primary')).toContainText('Compare Financial Data');
    await expect(page.locator('.cta-button.secondary')).toContainText('Learn More');

    // Verify content actually changed (not just showing placeholder text)
    const newTitle = page.locator('.header h1');
    const newSubtitle = page.locator('.header p');
    const newDescTitle = page.locator('.description-section h2');
    const newCtaTitle = page.locator('.cta-section h3');
    const newCtaButtonPrimary = page.locator('.cta-button.primary');
    const newCtaButtonSecondary = page.locator('.cta-button.secondary');

    await expect(newTitle).not.toHaveText(initialTitle);
    await expect(newSubtitle).not.toHaveText(initialSubtitle);
    await expect(newDescTitle).not.toHaveText(initialDescTitle);
    await expect(newCtaTitle).not.toHaveText(initialCtaTitle);
    await expect(newCtaButtonPrimary).not.toHaveText(initialCtaButtonPrimary);
    await expect(newCtaButtonSecondary).not.toHaveText(initialCtaButtonSecondary);
  });

  test('should switch to French and display French content', async ({ page }) => {
    // Store initial German content for comparison
    const initialTitle = await page.locator('.header h1').textContent();
    const initialDescTitle = await page.locator('.description-section h2').textContent();

    // Click language selector to open dropdown
    await page.locator('.language-trigger').click();

    // Wait for dropdown to be visible
    await expect(page.locator('.language-dropdown')).toBeVisible();

    // Find and click French option
    const frenchOption = page.locator('.language-option').filter({ hasText: 'Français' });
    await expect(frenchOption).toBeVisible();
    await frenchOption.click();

    // Wait for language change to take effect
    await expect(page.locator('.language-code')).toContainText('FR');

    // Verify French content is displayed
    await expect(page.locator('.header h1')).toContainText('Navigateur d\'arbre de données financières suisses');
    await expect(page.locator('.header p')).toContainText('Explorez les structures de données financières hiérarchiques');

    // Check description section
    await expect(page.locator('.description-section h2')).toContainText('Comparer les données financières communales');
    await expect(page.locator('.description-section .intro')).toContainText('Ce site web vous permet d\'analyser');

    // Check CTA section
    await expect(page.locator('.cta-section h3')).toContainText('Commencer l\'exploration des données');
    await expect(page.locator('.cta-button.primary')).toContainText('Comparer les données financières');
    await expect(page.locator('.cta-button.secondary')).toContainText('En savoir plus');

    // Verify content actually changed
    const newTitle = page.locator('.header h1');
    const newDescTitle = page.locator('.description-section h2');

    await expect(newTitle).not.toHaveText(initialTitle);
    await expect(newDescTitle).not.toHaveText(initialDescTitle);
  });

  test('should switch to Italian and display Italian content', async ({ page }) => {
    // Store initial German content for comparison
    const initialTitle = await page.locator('.header h1').textContent();
    const initialCtaButtonPrimary = await page.locator('.cta-button.primary').textContent();

    // Click language selector to open dropdown
    await page.locator('.language-trigger').click();

    // Wait for dropdown to be visible
    await expect(page.locator('.language-dropdown')).toBeVisible();

    // Find and click Italian option
    const italianOption = page.locator('.language-option').filter({ hasText: 'Italiano' });
    await expect(italianOption).toBeVisible();
    await italianOption.click();

    // Wait for language change to take effect
    await expect(page.locator('.language-code')).toContainText('IT');

    // Verify Italian content is displayed
    await expect(page.locator('.header h1')).toContainText('Navigatore ad albero dei dati finanziari svizzeri');
    await expect(page.locator('.header p')).toContainText('Esplora le strutture gerarchiche dei dati finanziari');

    // Check description section
    await expect(page.locator('.description-section h2')).toContainText('Confronta i dati finanziari comunali');
    await expect(page.locator('.description-section .intro')).toContainText('Questo sito web ti consente di analizzare');

    // Check CTA section
    await expect(page.locator('.cta-section h3')).toContainText('Inizia a esplorare i dati');
    await expect(page.locator('.cta-button.primary')).toContainText('Confronta dati finanziari');
    await expect(page.locator('.cta-button.secondary')).toContainText('Scopri di più');

    // Verify content actually changed
    const newTitle = page.locator('.header h1');
    const newCtaButtonPrimary = page.locator('.cta-button.primary');

    await expect(newTitle).not.toHaveText(initialTitle);
    await expect(newCtaButtonPrimary).not.toHaveText(initialCtaButtonPrimary);
  });

  test('should maintain language selection when navigating back to German', async ({ page }) => {
    // Switch to English first
    await page.locator('.language-trigger').click();
    await expect(page.locator('.language-dropdown')).toBeVisible();
    await page.locator('.language-option').filter({ hasText: 'English' }).click();
    await expect(page.locator('.language-code')).toContainText('EN');

    // Switch back to German
    await page.locator('.language-trigger').click();
    await expect(page.locator('.language-dropdown')).toBeVisible();
    await page.locator('.language-option').filter({ hasText: 'Deutsch' }).click();
    await expect(page.locator('.language-code')).toContainText('DE');

    // Verify German content is displayed again
    await expect(page.locator('.header h1')).toContainText('Schweizer Finanzdaten-Baum-Navigator');
    await expect(page.locator('.description-section h2')).toContainText('Finanzdaten von Gemeinden vergleichen');
    await expect(page.locator('.cta-section h3')).toContainText('Jetzt Daten erkunden');
  });

  test('should display data type descriptions in selected language', async ({ page }) => {
    // Check German data type descriptions
    await expect(page.locator('.data-type').first()).toContainText('Bilanz');
    await expect(page.locator('.data-type').first()).toContainText('Bilanzpositionen - Vermögen, Schulden und Eigenkapital');

    await expect(page.locator('.data-type').last()).toContainText('Ertrag');
    await expect(page.locator('.data-type').last()).toContainText('Erfolgsrechnung - Einnahmen (Ertrag) und Ausgaben (Aufwand)');

    // Switch to English
    await page.locator('.language-trigger').click();
    await page.locator('.language-option').filter({ hasText: 'English' }).click();
    await expect(page.locator('.language-code')).toContainText('EN');

    // Check English data type descriptions
    await expect(page.locator('.data-type').first()).toContainText('Balance Sheet');
    await expect(page.locator('.data-type').first()).toContainText('Balance sheet data - Assets, liabilities, and equity');

    await expect(page.locator('.data-type').last()).toContainText('Revenue');
    await expect(page.locator('.data-type').last()).toContainText('Income statement data - Revenue (income) and expenditure (expenses)');
  });

  test('should close language dropdown when clicking backdrop', async ({ page }) => {
    // Open language dropdown
    await page.locator('.language-trigger').click();
    await expect(page.locator('.language-dropdown')).toBeVisible();

    // Click on the backdrop to close the dropdown
    await page.locator('.language-backdrop').click();

    // Dropdown should be closed
    await expect(page.locator('.language-dropdown')).toBeHidden();
  });

  test('should show active language in dropdown', async ({ page }) => {
    // Open language dropdown
    await page.locator('.language-trigger').click();
    await expect(page.locator('.language-dropdown')).toBeVisible();

    // German should be marked as active (default)
    const germanOption = page.locator('.language-option').filter({ hasText: 'Deutsch' });
    await expect(germanOption).toHaveClass(/active/);
    await expect(germanOption.locator('.pi-check')).toBeVisible();

    // Close dropdown and switch to French
    await page.locator('.language-option').filter({ hasText: 'Français' }).click();
    await expect(page.locator('.language-code')).toContainText('FR');

    // Open dropdown again
    await page.locator('.language-trigger').click();
    await expect(page.locator('.language-dropdown')).toBeVisible();

    // French should now be marked as active
    const frenchOption = page.locator('.language-option').filter({ hasText: 'Français' });
    await expect(frenchOption).toHaveClass(/active/);
    await expect(frenchOption.locator('.pi-check')).toBeVisible();
  });
});
