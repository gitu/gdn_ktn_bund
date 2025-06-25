import { test, expect } from '@playwright/test'

test.describe('Comparison View Performance', () => {
  test('should load multiple comparisons quickly', async ({ page }) => {
    // Start timing before navigation
    const startTime = Date.now()

    // Navigate to comparison view with multiple datasets
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,std/fs/gdn_zh:2022')

    // Wait for the tree table to be visible and data to load
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 60000 })

    // Wait for first data cell to have content (indicates data has loaded)
    await expect(page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 30000 })

    const loadTime = Date.now() - startTime

    // Performance assertion - should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)

    // Verify data is actually loaded by checking for specific financial values
    const firstDataCell = page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')
    await expect(firstDataCell).toContainText('CHF')
  })

  test('should load single comparison very quickly', async ({ page }) => {
    const startTime = Date.now()

    // Navigate with fewer datasets for faster loading
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022')

    // Wait for table and data
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 30000 })

    const loadTime = Date.now() - startTime


    // Should be very fast for 2 datasets - under 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should create comparisons instantly after data is loaded', async ({ page }) => {
    // First load the data
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022')
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 30000 })

    // Now measure how long it takes to create a comparison
    const comparisonStartTime = Date.now()

    // Click to select base column
    await page.locator('.entity-header').first().click()

    // Click to create comparison
    await page.locator('.entity-header').nth(1).click()

    // Wait for comparison indicators to appear
    await expect(page.locator('.comparison-tag').first()).toBeVisible({ timeout: 1000 })

    const comparisonTime = Date.now() - comparisonStartTime


    // Comparison creation should be nearly instant - under 500ms
    expect(comparisonTime).toBeLessThan(500)
  })

  test('should switch scaling factors quickly', async ({ page }) => {
    // Load data first
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022')
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 30000 })

    // Get initial value
    const initialValue = await page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)').textContent()

    // Start timing scaling change
    const scalingStartTime = Date.now()

    // Wait for scaling selector to be available and change to population
    await expect(page.getByRole('combobox')).toBeVisible({ timeout: 10000 })
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Bevölkerung' }).click()

    // Wait for values to update by checking that the value has changed
    await expect(page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')).not.toHaveText(initialValue || '', { timeout: 5000 })

    const scalingTime = Date.now() - scalingStartTime


    // Scaling should be applied quickly - under 2 seconds
    expect(scalingTime).toBeLessThan(2000)
  })

  test('should handle large dataset load performance', async ({ page }) => {
    const startTime = Date.now()

    // Load a larger set of datasets including canton aggregation
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,gdn/fs/010069:2022,std/fs/gdn_zh:2022,std/fs/ktn_zh:2022')

    // Wait for data to load - allow more time for larger dataset
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 45000 })
    await expect(page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 45000 })

    const loadTime = Date.now() - startTime


    // Even large datasets should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)

    // Verify we have multiple columns loaded
    const columnCount = await page.locator('.entity-header').count()
    expect(columnCount).toBeGreaterThan(5)
  })
})
