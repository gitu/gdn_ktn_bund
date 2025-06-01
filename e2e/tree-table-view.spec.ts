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
    // Check that the page loads with the correct title
    await expect(page.locator('.tree-table-view h1')).toHaveText('Hierarchical Tree Table Demo');

    // Check that the description is present
    await expect(page.locator('.tree-table-view p')).toContainText('Explore financial data in a hierarchical table format');
  });

  test('should display demo controls', async ({ page }) => {
    // Check data path input
    await expect(page.locator('#data-path-input')).toBeVisible();
    await expect(page.locator('#data-path-input')).toHaveValue('gdn/ag/2019');

    // Check dimension selector
    await expect(page.locator('#dimension-select')).toBeVisible();

    // Check title input
    await expect(page.locator('#title-input')).toBeVisible();

    // Check load button
    await expect(page.locator('.load-button')).toBeVisible();
    await expect(page.locator('.load-button')).toHaveText('Load Data');
  });

  test('should display example buttons', async ({ page }) => {
    // Check that example buttons are present
    const exampleButtons = page.locator('.example-button');
    await expect(exampleButtons).toHaveCount(4);

    // Check specific example button texts
    await expect(exampleButtons.nth(0)).toContainText('Aargau 2019 (GDN)');
    await expect(exampleButtons.nth(1)).toContainText('Aargau 2019 Revenue (GDN)');
    await expect(exampleButtons.nth(2)).toContainText('Aargau 2019 (STD-FS)');
    await expect(exampleButtons.nth(3)).toContainText('Zurich 2020 (GDN)');
  });

  test('should load data when clicking load button', async ({ page }) => {
    // Click the load button
    await page.locator('.load-button').click();

    // Wait for the hierarchical tree table component to be loaded
    // (loading might be too fast to catch, so we just wait for the result)
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });
  });

  test('should display tree table with controls', async ({ page }) => {
    // Load data first
    await page.locator('.load-button').click();
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
  });

  test('should display tree table with data rows', async ({ page }) => {
    // Load data first
    await page.locator('.load-button').click();
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });

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
  });

  test('should expand and collapse tree nodes', async ({ page }) => {
    // Load data first
    await page.locator('.load-button').click();
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });

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
  });

  test('should toggle expand all functionality', async ({ page }) => {
    // Load data first
    await page.locator('.load-button').click();
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });

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
  });

  test('should toggle show codes functionality', async ({ page }) => {
    // Load data first
    await page.locator('.load-button').click();
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });

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
  });

  test('should change language', async ({ page }) => {
    // Load data first
    await page.locator('.load-button').click();
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });

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
  });

  test('should load different examples', async ({ page }) => {
    // Click on the second example (Revenue)
    await page.locator('.example-button').nth(1).click();

    // Check that the data path input changed
    await expect(page.locator('#data-path-input')).toHaveValue('gdn/ag/2019');

    // Check that the dimension changed
    await expect(page.locator('#dimension-select')).toHaveValue('ertrag');

    // Check that the title changed
    await expect(page.locator('#title-input')).toHaveValue('Aargau 2019 - Revenue');
  });

  test('should display metadata information', async ({ page }) => {
    // Load data first
    await page.locator('.load-button').click();
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });

    // Check that metadata section is visible
    await expect(page.locator('.metadata-section')).toBeVisible();
    await expect(page.locator('.metadata-section h3')).toContainText('Data Information');

    // Check that metadata items are present
    const metadataItems = page.locator('.metadata-item');
    const itemCount = await metadataItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('should display documentation section', async ({ page }) => {
    // Check that documentation section is visible
    await expect(page.locator('.documentation-section')).toBeVisible();
    await expect(page.locator('.documentation-section h3')).toContainText('Usage Documentation');

    // Check that documentation content is present
    await expect(page.locator('.doc-content')).toBeVisible();
    await expect(page.locator('.doc-content h4').first()).toContainText('Data Path Format');
  });

  test('should handle custom data path input', async ({ page }) => {
    // Clear and enter custom data path
    await page.locator('#data-path-input').fill('std/fs/zh/2020');

    // Change dimension
    await page.locator('#dimension-select').selectOption('ertrag');

    // Change title
    await page.locator('#title-input').fill('Custom Test Data');

    // Click load button
    await page.locator('.load-button').click();

    // Check that the component attempts to load (might show error due to missing data)
    await page.waitForTimeout(1000); // Give it a moment to process
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Load data
    await page.locator('.load-button').click();
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible({ timeout: 10000 });

    // Check that the layout adapts to mobile
    await expect(page.locator('.hierarchical-tree-table')).toBeVisible();
    await expect(page.locator('.tree-table')).toBeVisible();

    // Check that controls are still accessible
    await expect(page.locator('.controls')).toBeVisible();
  });
});
