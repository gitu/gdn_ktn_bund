import { test, expect } from '@playwright/test';

// Mock data for testing
const mockGdnData = `konto;bezeichnung;betrag
3;Aufwand;150000
30;Personalaufwand;100000
31;Sachaufwand;50000
300;Löhne;80000
301;Sozialversicherungsbeiträge;20000`;

const mockTreeStructure = {
  metadata: {
    dimension: 'aufwand',
    model: 'fs',
    source: 'test',
    generatedAt: '2024-01-01T00:00:00.000Z',
    totalNodes: 5,
    maxDepth: 3
  },
  tree: {
    code: 'root',
    labels: {
      de: 'Gesamt',
      fr: 'Total',
      it: 'Totale',
      en: 'Total'
    },
    level: 0,
    hasValue: true,
    children: [
      {
        code: '3',
        labels: {
          de: 'Aufwand',
          fr: 'Charges',
          it: 'Spese',
          en: 'Expenses'
        },
        level: 1,
        hasValue: true,
        children: [
          {
            code: '30',
            labels: {
              de: 'Personalaufwand',
              fr: 'Charges de personnel',
              it: 'Spese del personale',
              en: 'Personnel expenses'
            },
            level: 2,
            hasValue: true,
            children: [
              {
                code: '300',
                labels: {
                  de: 'Löhne',
                  fr: 'Salaires',
                  it: 'Salari',
                  en: 'Wages'
                },
                level: 3,
                hasValue: true,
                children: []
              },
              {
                code: '301',
                labels: {
                  de: 'Sozialversicherungsbeiträge',
                  fr: 'Cotisations sociales',
                  it: 'Contributi sociali',
                  en: 'Social security contributions'
                },
                level: 3,
                hasValue: true,
                children: []
              }
            ]
          },
          {
            code: '31',
            labels: {
              de: 'Sachaufwand',
              fr: 'Charges matérielles',
              it: 'Spese materiali',
              en: 'Material expenses'
            },
            level: 2,
            hasValue: true,
            children: []
          }
        ]
      }
    ]
  }
};

test.describe('TreeTableView', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the fetch requests for CSV data and tree structure
    await page.route('**/data/gdn/ag/2019.csv', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: mockGdnData
      });
    });

    await page.route('**/data/trees/aufwand-fs-tree.json', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTreeStructure)
      });
    });

    // Navigate to the tree table view
    await page.goto('/tree-table');
  });

  test('should load and display the tree table view', async ({ page }) => {
    // Check that the page loads with the correct title (now localized)
    await expect(page.locator('.tree-table-view h1')).toContainText('Hierarchische Baumtabelle');

    // Check that the description is present
    await expect(page.locator('.tree-table-view p')).toContainText('Erkunden Sie Finanzdaten');
  });

  test('should display demo controls', async ({ page }) => {
    // Check dimension selector
    await expect(page.locator('#dimension-select')).toBeVisible();

    // Check title input
    await expect(page.locator('#title-input')).toBeVisible();

    // Check that data browser is present
    await expect(page.locator('.data-browser')).toBeVisible();
  });

  test('should display data browser', async ({ page }) => {
    // Check that data browser section is present
    await expect(page.locator('.data-browser-section')).toBeVisible();
    await expect(page.locator('.data-browser-section h3')).toContainText('Datenbrowser');

    // Check that search input is present
    await expect(page.locator('.search-input')).toBeVisible();

    // Check that filter controls are present
    await expect(page.locator('.filter-controls')).toBeVisible();
  });

  test('should load data when selecting from data browser', async ({ page }) => {
    // Wait for data browser to load
    await expect(page.locator('.data-browser')).toBeVisible();

    // Wait for search results to load
    await page.waitForTimeout(2000);

    // Check if there are any result items and click the first one
    const resultItems = page.locator('.result-item');
    const resultCount = await resultItems.count();

    if (resultCount > 0) {
      await resultItems.first().click();

      // Wait for the hierarchical tree table component to be loaded
      await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display tree table with controls when data is loaded', async ({ page }) => {
    // Load data first by selecting from data browser
    await expect(page.locator('.data-browser')).toBeVisible();
    await page.waitForTimeout(2000);

    const resultItems = page.locator('.result-item');
    const resultCount = await resultItems.count();

    if (resultCount > 0) {
      await resultItems.first().click();
      await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });

      // Check table header
      await expect(page.locator('.table-header h3')).toBeVisible();

      // Check language selector
      await expect(page.locator('.controls select')).toBeVisible();

      // Check expand/collapse button
      await expect(page.locator('.expand-button')).toBeVisible();

      // Check show codes checkbox
      await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();

      // Check show values checkbox
      await expect(page.locator('input[type="checkbox"]').nth(1)).toBeVisible();
    }
  });

  // Helper function to load data via data browser
  async function loadDataViaBrowser(page) {
    await expect(page.locator('.data-browser')).toBeVisible();
    await page.waitForTimeout(2000);

    const resultItems = page.locator('.result-item');
    const resultCount = await resultItems.count();

    if (resultCount > 0) {
      await resultItems.first().click();
      await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });
      return true;
    }
    return false;
  }

  test('should display tree table with data rows', async ({ page }) => {
    // Load data first via data browser
    const dataLoaded = await loadDataViaBrowser(page);

    if (dataLoaded) {
      // Check that the table is present
      await expect(page.locator('.tree-table')).toBeVisible();

      // Check table headers
      await expect(page.locator('.tree-table th').first()).toContainText('Bezeichnung');
      await expect(page.locator('.tree-table th').nth(1)).toContainText('Wert');

      // Check that data rows are present
      const dataRows = page.locator('.tree-row');
      const rowCount = await dataRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Check that the root row is visible
      await expect(dataRows.first()).toBeVisible();
    }
  });

  test('should expand and collapse tree nodes', async ({ page }) => {
    // Load data first via data browser
    const dataLoaded = await loadDataViaBrowser(page);

    if (dataLoaded) {
      // Find expand toggle buttons
      const expandToggle = page.locator('.expand-toggle').first();

      if (await expandToggle.isVisible()) {
        // Check initial state (should be expanded by default)
        await expect(expandToggle).toContainText('▼');

        // Click to collapse
        await expandToggle.click();
        await expect(expandToggle).toContainText('▶');

        // Click to expand again
        await expandToggle.click();
        await expect(expandToggle).toContainText('▼');
      }
    }
  });

  test('should toggle expand all functionality', async ({ page }) => {
    // Load data first via data browser
    const dataLoaded = await loadDataViaBrowser(page);

    if (dataLoaded) {
      // Find expand all button
      const expandAllButton = page.locator('.expand-button');

      // Check initial state
      await expect(expandAllButton).toContainText('Expand All');

      // Click to expand all
      await expandAllButton.click();
      await expect(expandAllButton).toContainText('Collapse All');

      // Click to collapse all
      await expandAllButton.click();
      await expect(expandAllButton).toContainText('Expand All');
    }
  });

  test('should toggle show codes functionality', async ({ page }) => {
    // Load data first via data browser
    const dataLoaded = await loadDataViaBrowser(page);

    if (dataLoaded) {
      // Find show codes checkbox
      const showCodesCheckbox = page.locator('input[type="checkbox"]').first();

      // Initially codes should be hidden (2 columns: label and value)
      await expect(page.locator('.tree-table th')).toHaveCount(2);

      // Check the show codes checkbox
      await showCodesCheckbox.check();

      // Now should have 3 columns: label, code, and value
      await expect(page.locator('.tree-table th')).toHaveCount(3);
      await expect(page.locator('.tree-table th').nth(1)).toContainText('Code');

      // Uncheck to hide codes again
      await showCodesCheckbox.uncheck();
      await expect(page.locator('.tree-table th')).toHaveCount(2);
    }
  });

  test('should change language', async ({ page }) => {
    // Load data first via data browser
    const dataLoaded = await loadDataViaBrowser(page);

    if (dataLoaded) {
      // Find language selector
      const languageSelect = page.locator('.controls select');

      // Check initial language (German)
      await expect(page.locator('.tree-table th').first()).toContainText('Bezeichnung');

      // Change to French
      await languageSelect.selectOption('fr');
      await expect(page.locator('.tree-table th').first()).toContainText('Désignation');

      // Change to English
      await languageSelect.selectOption('en');
      await expect(page.locator('.tree-table th').first()).toContainText('Label');

      // Change back to German
      await languageSelect.selectOption('de');
      await expect(page.locator('.tree-table th').first()).toContainText('Bezeichnung');
    }
  });

  test('should allow dimension selection', async ({ page }) => {
    // Check dimension selector
    await expect(page.locator('#dimension-select')).toBeVisible();

    // Change dimension
    await page.locator('#dimension-select').selectOption('ertrag');
    await expect(page.locator('#dimension-select')).toHaveValue('ertrag');

    // Change back
    await page.locator('#dimension-select').selectOption('aufwand');
    await expect(page.locator('#dimension-select')).toHaveValue('aufwand');
  });

  test('should display metadata information', async ({ page }) => {
    // Load data first via data browser
    const dataLoaded = await loadDataViaBrowser(page);

    if (dataLoaded) {
      // Check that metadata section is visible
      await expect(page.locator('.metadata-section')).toBeVisible();
      await expect(page.locator('.metadata-section h3')).toContainText('Dateninformationen');

      // Check that metadata items are present
      const metadataItems = page.locator('.metadata-item');
      const itemCount = await metadataItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('should display documentation section', async ({ page }) => {
    // Check that documentation section is visible
    await expect(page.locator('.documentation-section')).toBeVisible();
    await expect(page.locator('.documentation-section h3')).toContainText('Nutzungsdokumentation');

    // Check that documentation content is present
    await expect(page.locator('.doc-content')).toBeVisible();
    await expect(page.locator('.doc-content h4').first()).toContainText('Datenpfad-Format');
  });

  test('should allow custom title input', async ({ page }) => {
    // Change title
    await page.locator('#title-input').fill('Custom Test Data');
    await expect(page.locator('#title-input')).toHaveValue('Custom Test Data');

    // Clear title
    await page.locator('#title-input').fill('');
    await expect(page.locator('#title-input')).toHaveValue('');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Load data via data browser
    const dataLoaded = await loadDataViaBrowser(page);

    if (dataLoaded) {
      // Check that the layout adapts to mobile
      await expect(page.locator('.hierarchical-tree-table')).toBeVisible();
      await expect(page.locator('.tree-table')).toBeVisible();

      // Check that controls are still accessible
      await expect(page.locator('.controls')).toBeVisible();
    }
  });
});
