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
    await expect(page.getByTestId('home-main')).toBeVisible();

    // Verify header section
    await expect(page.getByTestId('home-title')).toBeVisible();
    await expect(page.getByTestId('home-subtitle')).toBeVisible();

    // Verify description section
    await expect(page.getByTestId('home-description-card')).toBeVisible();
    await expect(page.getByTestId('home-description-title')).toBeVisible();

    // Verify CTA section
    await expect(page.getByTestId('home-cta-card')).toBeVisible();
    await expect(page.getByTestId('home-cta-title')).toBeVisible();
    await expect(page.getByTestId('home-cta-button-primary')).toBeVisible();
    await expect(page.getByTestId('home-cta-button-secondary')).toBeVisible();
  });

  test('should display German content by default', async ({ page }) => {
    // Check that German content is displayed by default
    await expect(page.getByTestId('home-title')).toContainText('Schweizer Finanzdaten-Baum-Navigator');
    await expect(page.getByTestId('home-subtitle')).toContainText('Erkunden Sie hierarchische Finanzdatenstrukturen');

    // Check description section
    await expect(page.getByTestId('home-description-title')).toContainText('Finanzdaten von Gemeinden vergleichen');
    await expect(page.getByTestId('home-description-intro')).toContainText('Diese Website ermöglicht es Ihnen');

    // Check CTA section
    await expect(page.getByTestId('home-cta-title')).toContainText('Jetzt Daten erkunden');
    await expect(page.getByTestId('home-cta-button-primary')).toContainText('Finanzdaten vergleichen');
    await expect(page.getByTestId('home-cta-button-secondary')).toContainText('Mehr erfahren');

    // Check language selector shows DE
    await expect(page.getByTestId('language-selector-code')).toContainText('DE');
  });

  test('should switch to English and display English content', async ({ page }) => {
    // Store initial German content for comparison
    const initialTitle = await page.getByTestId('home-title').textContent();
    const initialSubtitle = await page.getByTestId('home-subtitle').textContent();
    const initialDescTitle = await page.getByTestId('home-description-title').textContent();
    const initialCtaTitle = await page.getByTestId('home-cta-title').textContent();
    const initialCtaButtonPrimary = await page.getByTestId('home-cta-button-primary').textContent();
    const initialCtaButtonSecondary = await page.getByTestId('home-cta-button-secondary').textContent();

    // Click language selector to open dropdown
    await page.getByTestId('language-selector-trigger').click();

    // Find and click English option
    await page.getByText('English').click();

    // Wait for language change to take effect
    await expect(page.getByTestId('language-selector-code')).toContainText('EN');

    // Verify English content is displayed
    await expect(page.getByTestId('home-title')).toContainText('Swiss Financial Data Tree Navigator');
    await expect(page.getByTestId('home-subtitle')).toContainText('Explore hierarchical financial data structures');

    // Check description section
    await expect(page.getByTestId('home-description-title')).toContainText('Compare Municipal Financial Data');
    await expect(page.getByTestId('home-description-intro')).toContainText('This website enables you to analyze');

    // Check CTA section
    await expect(page.getByTestId('home-cta-title')).toContainText('Start Exploring Data');
    await expect(page.getByTestId('home-cta-button-primary')).toContainText('Compare Financial Data');
    await expect(page.getByTestId('home-cta-button-secondary')).toContainText('Learn More');

    // Verify content actually changed (not just showing placeholder text)
    const newTitle = page.getByTestId('home-title');
    const newSubtitle = page.getByTestId('home-subtitle');
    const newDescTitle = page.getByTestId('home-description-title');
    const newCtaTitle = page.getByTestId('home-cta-title');
    const newCtaButtonPrimary = page.getByTestId('home-cta-button-primary');
    const newCtaButtonSecondary = page.getByTestId('home-cta-button-secondary');

    await expect(newTitle).not.toHaveText(initialTitle);
    await expect(newSubtitle).not.toHaveText(initialSubtitle);
    await expect(newDescTitle).not.toHaveText(initialDescTitle);
    await expect(newCtaTitle).not.toHaveText(initialCtaTitle);
    await expect(newCtaButtonPrimary).not.toHaveText(initialCtaButtonPrimary);
    await expect(newCtaButtonSecondary).not.toHaveText(initialCtaButtonSecondary);
  });

  test('should switch to French and display French content', async ({ page }) => {
    // Store initial German content for comparison
    const initialTitle = await page.getByTestId('home-title').textContent();
    const initialDescTitle = await page.getByTestId('home-description-title').textContent();

    // Click language selector to open dropdown and select French
    await page.getByTestId('language-selector-trigger').click();
    await page.getByText('Français').click();

    // Wait for language change to take effect
    await expect(page.getByTestId('language-selector-code')).toContainText('FR');

    // Verify French content is displayed
    await expect(page.getByTestId('home-title')).toContainText('Navigateur d\'arbre de données financières suisses');
    await expect(page.getByTestId('home-subtitle')).toContainText('Explorez les structures de données financières hiérarchiques');

    // Check description section
    await expect(page.getByTestId('home-description-title')).toContainText('Comparer les données financières communales');
    await expect(page.getByTestId('home-description-intro')).toContainText('Ce site web vous permet d\'analyser');

    // Check CTA section
    await expect(page.getByTestId('home-cta-title')).toContainText('Commencer l\'exploration des données');
    await expect(page.getByTestId('home-cta-button-primary')).toContainText('Comparer les données financières');
    await expect(page.getByTestId('home-cta-button-secondary')).toContainText('En savoir plus');

    // Verify content actually changed
    const newTitle = page.getByTestId('home-title');
    const newDescTitle = page.getByTestId('home-description-title');

    await expect(newTitle).not.toHaveText(initialTitle);
    await expect(newDescTitle).not.toHaveText(initialDescTitle);
  });

  test('should switch to Italian and display Italian content', async ({ page }) => {
    // Store initial German content for comparison
    const initialTitle = await page.getByTestId('home-title').textContent();
    const initialCtaButtonPrimary = await page.getByTestId('home-cta-button-primary').textContent();

    // Click language selector to open dropdown and select Italian
    await page.getByTestId('language-selector-trigger').click();
    await page.getByText('Italiano').click();

    // Wait for language change to take effect
    await expect(page.getByTestId('language-selector-code')).toContainText('IT');

    // Verify Italian content is displayed
    await expect(page.getByTestId('home-title')).toContainText('Navigatore ad albero dei dati finanziari svizzeri');
    await expect(page.getByTestId('home-subtitle')).toContainText('Esplora le strutture gerarchiche dei dati finanziari');

    // Check description section
    await expect(page.getByTestId('home-description-title')).toContainText('Confronta i dati finanziari comunali');
    await expect(page.getByTestId('home-description-intro')).toContainText('Questo sito web ti consente di analizzare');

    // Check CTA section
    await expect(page.getByTestId('home-cta-title')).toContainText('Inizia a esplorare i dati');
    await expect(page.getByTestId('home-cta-button-primary')).toContainText('Confronta dati finanziari');
    await expect(page.getByTestId('home-cta-button-secondary')).toContainText('Scopri di più');

    // Verify content actually changed
    const newTitle = page.getByTestId('home-title');
    const newCtaButtonPrimary = page.getByTestId('home-cta-button-primary');

    await expect(newTitle).not.toHaveText(initialTitle);
    await expect(newCtaButtonPrimary).not.toHaveText(initialCtaButtonPrimary);
  });

  test('should maintain language selection when navigating back to German', async ({ page }) => {
    // Switch to English first
    await page.getByTestId('language-selector-trigger').click();
    await page.getByText('English').click();
    await expect(page.getByTestId('language-selector-code')).toContainText('EN');

    // Switch back to German
    await page.getByTestId('language-selector-trigger').click();
    await page.getByText('Deutsch').click();
    await expect(page.getByTestId('language-selector-code')).toContainText('DE');

    // Verify German content is displayed again
    await expect(page.getByTestId('home-title')).toContainText('Schweizer Finanzdaten-Baum-Navigator');
    await expect(page.getByTestId('home-description-title')).toContainText('Finanzdaten von Gemeinden vergleichen');
    await expect(page.getByTestId('home-cta-title')).toContainText('Jetzt Daten erkunden');
  });

  test('should display data type descriptions in selected language', async ({ page }) => {
    // Check German data type descriptions
    await expect(page.getByTestId('home-data-type-balance')).toContainText('Bilanz');
    await expect(page.getByTestId('home-data-type-balance')).toContainText('Bilanzpositionen');

    await expect(page.getByTestId('home-data-type-income')).toContainText('Ertrag');
    await expect(page.getByTestId('home-data-type-income')).toContainText('Erfolgsrechnung');

    // Switch to English
    await page.getByTestId('language-selector-trigger').click();
    await page.getByText('English').click();
    await expect(page.getByTestId('language-selector-code')).toContainText('EN');

    // Check English data type descriptions
    await expect(page.getByTestId('home-data-type-balance')).toContainText('Balance Sheet');
    await expect(page.getByTestId('home-data-type-balance')).toContainText('Balance sheet data');

    await expect(page.getByTestId('home-data-type-income')).toContainText('Revenue');
    await expect(page.getByTestId('home-data-type-income')).toContainText('Income statement data');
  });

  test('should close language dropdown when clicking outside', async ({ page }) => {
    // Open language dropdown
    await page.getByTestId('language-selector-trigger').click();
    await expect(page.getByTestId('language-selector-menu')).toBeVisible();

    // Click outside the dropdown to close it
    await page.getByTestId('home-main').click();

    // Dropdown should be closed
    await expect(page.getByTestId('language-selector-menu')).toBeHidden();
  });

  test('should show current language in selector', async ({ page }) => {
    // Check that German is shown by default
    await expect(page.getByTestId('language-selector-code')).toContainText('DE');

    // Switch to French
    await page.getByTestId('language-selector-trigger').click();
    await page.getByText('Français').click();
    await expect(page.getByTestId('language-selector-code')).toContainText('FR');

    // Switch to Italian
    await page.getByTestId('language-selector-trigger').click();
    await page.getByText('Italiano').click();
    await expect(page.getByTestId('language-selector-code')).toContainText('IT');

    // Switch back to German
    await page.getByTestId('language-selector-trigger').click();
    await page.getByText('Deutsch').click();
    await expect(page.getByTestId('language-selector-code')).toContainText('DE');
  });
});
