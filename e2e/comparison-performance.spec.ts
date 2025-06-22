import { test, expect } from '@playwright/test'

test.describe('Comparison View Performance', () => {
  test('should load multiple comparisons quickly', async ({ page }) => {
    // Start timing before navigation
    const startTime = Date.now()
    
    // Navigate to comparison view with multiple datasets
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,std/fs/gdn_zh:2022')
    
    // Debug: Wait for page to load and check what's available
    await page.waitForLoadState('networkidle')
    
    // Wait for the main content to be mounted
    await page.waitForSelector('.min-h-screen', { timeout: 10000 })
    
    // Check if there's an error message
    const errorMessage = await page.locator('[severity="error"]').count()
    if (errorMessage > 0) {
      const errorText = await page.locator('[severity="error"]').textContent()
      console.log('Error found on page:', errorText)
    }
    
    // Wait for the tree table to be visible and data to load
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 60000 })
    
    // Wait for first data cell to have content (indicates data has loaded)
    await expect(page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 30000 })
    
    const loadTime = Date.now() - startTime
    
    console.log(`Comparison view loaded in ${loadTime}ms`)
    
    // Performance assertion - should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
    
    // Verify data is actually loaded by checking for specific financial values
    const firstDataCell = page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')
    await expect(firstDataCell).toContainText('CHF')
  })

  test('should load single comparison very quickly', async ({ page }) => {
    const startTime = Date.now()
    
    // Navigate with fewer datasets for faster loading
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022')
    
    // Wait for page load
    await page.waitForLoadState('networkidle')
    
    // Wait for table and data
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 30000 })
    await expect(page.locator('[data-testid="tree-table"] tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 30000 })
    
    const loadTime = Date.now() - startTime
    
    console.log(`Simple comparison loaded in ${loadTime}ms`)
    
    // Should be very fast for 2 datasets - under 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should create comparisons instantly after data is loaded', async ({ page }) => {
    // First load the data
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022')
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 30000 })
    await expect(page.locator('.tree-table tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 30000 })
    
    // Now measure how long it takes to create a comparison
    const comparisonStartTime = Date.now()
    
    // Click to select base column
    await page.locator('.entity-header').first().click()
    
    // Click to create comparison
    await page.locator('.entity-header').nth(1).click()
    
    // Wait for comparison indicators to appear
    await expect(page.locator('.comparison-tag').first()).toBeVisible({ timeout: 1000 })
    
    const comparisonTime = Date.now() - comparisonStartTime
    
    console.log(`Comparison created in ${comparisonTime}ms`)
    
    // Comparison creation should be nearly instant - under 500ms
    expect(comparisonTime).toBeLessThan(500)
  })

  test('should switch scaling factors quickly', async ({ page }) => {
    // Load data first
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022')
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 30000 })
    await expect(page.locator('.tree-table tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 30000 })
    
    // Get initial value
    const initialValue = await page.locator('.tree-table tbody tr:first-child td:nth-child(2)').textContent()
    
    // Start timing scaling change
    const scalingStartTime = Date.now()
    
    // Change scaling to population
    const scalingSelector = page.locator('select').first()
    if (await scalingSelector.isVisible()) {
      await scalingSelector.selectOption({ value: 'pop' })
      
      // Wait for values to update by checking that the value has changed
      await expect(page.locator('.tree-table tbody tr:first-child td:nth-child(2)')).not.toHaveText(initialValue || '', { timeout: 5000 })
      
      const scalingTime = Date.now() - scalingStartTime
      
      console.log(`Scaling change applied in ${scalingTime}ms`)
      
      // Scaling should be applied quickly - under 2 seconds
      expect(scalingTime).toBeLessThan(2000)
    }
  })

  test('should handle large dataset load performance', async ({ page }) => {
    const startTime = Date.now()
    
    // Load a larger set of datasets including canton aggregation
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,gdn/fs/010069:2022,std/fs/gdn_zh:2022,std/fs/ktn_zh:2022')
    
    // Wait for data to load - allow more time for larger dataset
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 45000 })
    await expect(page.locator('.tree-table tbody tr:first-child td:nth-child(2)')).not.toHaveText('', { timeout: 45000 })
    
    const loadTime = Date.now() - startTime
    
    console.log(`Large dataset comparison loaded in ${loadTime}ms`)
    
    // Even large datasets should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
    
    // Verify we have multiple columns loaded
    const columnCount = await page.locator('.entity-header').count()
    expect(columnCount).toBeGreaterThan(5)
  })
})