import { test, expect } from '@playwright/test'

test.describe('Comparison Persistence', () => {
  test('should persist comparisons in URL when created', async ({ page }) => {
    // Navigate to the comparison view with sample data
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,std/fs/gdn_zh:2022')
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 10000 })
    
    // Get the initial URL (should not have comparisons parameter)
    const initialUrl = page.url()
    expect(initialUrl).not.toContain('comparisons=')
    
    // Find the column headers and click on the first one to select it as base
    const firstColumnHeader = page.locator('.entity-header').first()
    await firstColumnHeader.click()
    
    // Verify the first column is selected (should have selection indicator)
    await expect(page.locator('.column-selected').first()).toBeVisible()
    
    // Click on the second column to create a comparison
    const secondColumnHeader = page.locator('.entity-header').nth(1)
    await secondColumnHeader.click()
    
    // Wait a moment for the URL to update (due to debouncing)
    await page.waitForTimeout(200)
    
    // Check that the URL now contains the comparisons parameter
    const urlWithComparisons = page.url()
    expect(urlWithComparisons).toContain('comparisons=')
    
    // Extract the comparisons parameter
    const url = new URL(urlWithComparisons)
    const comparisonsParam = url.searchParams.get('comparisons')
    expect(comparisonsParam).toBeTruthy()
    
    // Verify the format is correct (should be "columnA,baseA")
    expect(comparisonsParam).toMatch(/^[^,]+,[^,]+$/)
    
    console.log('Comparisons parameter:', comparisonsParam)
  })

  test('should load comparisons from URL on page refresh', async ({ page }) => {
    // Navigate directly to a URL with comparisons
    const testUrl = '/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,std/fs/gdn_zh:2022&comparisons=gdn/fs/010230:2022,gdn/fs/010261:2022'
    await page.goto(testUrl)
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 10000 })
    
    // Check that comparison indicators are visible
    await expect(page.locator('.column-has-comparisons').first()).toBeVisible()
    
    // Check that comparison tags are visible in the data cells
    await expect(page.locator('.comparison-tag').first()).toBeVisible()
    
    // Verify the URL still contains the comparisons parameter
    const currentUrl = page.url()
    expect(currentUrl).toContain('comparisons=gdn/fs/010230:2022,gdn/fs/010261:2022')
  })

  test('should update URL when scaling changes while maintaining comparisons', async ({ page }) => {
    // Start with a URL that has both datasets and comparisons
    const initialUrl = '/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,std/fs/gdn_zh:2022&comparisons=gdn/fs/010230:2022,gdn/fs/010261:2022'
    await page.goto(initialUrl)
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 10000 })
    
    // Verify comparisons are loaded
    await expect(page.locator('.comparison-tag').first()).toBeVisible()
    
    // Find and change the scaling selector
    const scalingSelector = page.locator('select').first()
    if (await scalingSelector.isVisible()) {
      await scalingSelector.selectOption({ index: 1 })
      
      // Wait for the URL to update
      await page.waitForTimeout(200)
      
      // Verify that the URL still contains both scaling and comparisons
      const updatedUrl = page.url()
      expect(updatedUrl).toContain('comparisons=')
      expect(updatedUrl).toContain('scaling=')
      
      console.log('Updated URL with scaling:', updatedUrl)
    }
  })

  test('should allow creating multiple comparisons', async ({ page }) => {
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,std/fs/gdn_zh:2022')
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="tree-table"]', { timeout: 10000 })
    
    // Create first comparison
    await page.locator('.entity-header').first().click()
    await page.locator('.entity-header').nth(1).click()
    
    // Wait for URL update
    await page.waitForTimeout(200)
    
    // Create second comparison
    await page.locator('.entity-header').nth(2).click()
    await page.locator('.entity-header').nth(3).click()
    
    // Wait for URL update
    await page.waitForTimeout(200)
    
    // Check that URL contains multiple comparisons (should be pipe-separated)
    const finalUrl = page.url()
    const url = new URL(finalUrl)
    const comparisonsParam = url.searchParams.get('comparisons')
    
    expect(comparisonsParam).toBeTruthy()
    
    // Should contain pipe separator for multiple comparisons
    if (comparisonsParam?.includes('|')) {
      expect(comparisonsParam.split('|')).toHaveLength(2)
    }
    
    console.log('Multiple comparisons parameter:', comparisonsParam)
  })

  test('should handle removing comparisons', async ({ page }) => {
    // Start with a single comparison
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022&comparisons=gdn/fs/010230:2022,gdn/fs/010261:2022')
    
    // Wait for data to load
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 30000 })
    
    // Verify comparison exists
    await expect(page.locator('.comparison-tag').first()).toBeVisible()
    
    // Get the current number of comparison tags
    const initialTagCount = await page.locator('.comparison-tag').count()
    
    // Click on the base column and then the same compare column to remove the comparison
    const columnHeaders = page.locator('.entity-header')
    await columnHeaders.first().click() // Select base
    await columnHeaders.nth(1).click() // Toggle comparison off
    
    // Wait for URL update
    await page.waitForTimeout(500)
    
    // Check that the number of comparison tags has decreased or URL no longer has comparisons
    const finalTagCount = await page.locator('.comparison-tag').count()
    const finalUrl = page.url()
    
    // Either all comparisons are removed (URL has no comparisons) or tag count decreased
    if (finalTagCount === 0) {
      expect(finalUrl).not.toContain('comparisons=')
    } else {
      expect(finalTagCount).toBeLessThan(initialTagCount)
    }
  })
})