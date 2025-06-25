import { test, expect } from '@playwright/test'

test.describe('Recursive Update Bug', () => {
  test('should reproduce and verify fix for recursive updates when creating comparisons', async ({ page }) => {
    // Navigate to the full view with test data
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,std/fs/gdn_zh:2022')
    
    // Wait for data to load
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 10000 })
    
    // Listen for console errors to detect recursive update errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Listen for unhandled promise rejections
    const promiseErrors: string[] = []
    page.on('pageerror', (error) => {
      promiseErrors.push(error.message)
    })
    
    
    // Step 1: Click first column to select it as base
    const firstColumnHeader = page.locator('.entity-header').first()
    await firstColumnHeader.click()
    
    // Wait for reactive updates to complete
    await expect(page.locator('.column-selected').first()).toBeVisible({ timeout: 500 })
    
    // Verify first column is selected
    await expect(page.locator('.column-selected').first()).toBeVisible()
    
    // Step 2: Click second column to create comparison - this should trigger the recursive error
    const secondColumnHeader = page.locator('.entity-header').nth(1)
    await secondColumnHeader.click()
    
    // Wait for comparison to be created
    await expect(async () => {
      const url = page.url()
      expect(url).toContain('comparisons=')
    }).toPass({ timeout: 2000 })
    
    // Check for recursive update errors
    const hasRecursiveError = promiseErrors.some(error => 
      error.includes('Maximum recursive updates exceeded') ||
      error.includes('recursive')
    )
    
    const hasConsoleErrors = consoleErrors.some(error => 
      error.includes('Maximum recursive updates exceeded') ||
      error.includes('recursive')
    )
    
    
    // The test should pass if NO recursive errors occur
    expect(hasRecursiveError).toBe(false)
    expect(hasConsoleErrors).toBe(false)
    
    // Verify that the comparison was actually created despite any errors
    const currentUrl = page.url()
    expect(currentUrl).toContain('comparisons=')
    
    // Verify comparison tags are visible
    await expect(page.locator('.comparison-tag').first()).toBeVisible()
  })

  test('should handle rapid column clicks without errors', async ({ page }) => {
    await page.goto('/c?datasets=gdn/fs/010261:2022,gdn/fs/010230:2022,gdn/fs/010156:2022,gdn/fs/010058:2022,std/fs/gdn_zh:2022')
    await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 10000 })
    
    const promiseErrors: string[] = []
    page.on('pageerror', (error) => {
      promiseErrors.push(error.message)
    })
    
    // Rapid clicks to stress test the system
    const columnHeaders = page.locator('.entity-header')
    
    // Click first column
    await columnHeaders.first().click()
    
    // Click second column
    await columnHeaders.nth(1).click()
    
    // Click third column immediately to select it
    await columnHeaders.nth(2).click()
    
    // Click fourth column to create another comparison
    await columnHeaders.nth(3).click()
    // Wait for comparisons to be created
    await expect(async () => {
      const url = page.url()
      expect(url).toContain('comparisons=')
    }).toPass({ timeout: 1000 })
    
    // Should not have any recursive errors
    const hasErrors = promiseErrors.some(error => 
      error.includes('Maximum recursive updates') || 
      error.includes('recursive')
    )
    
    expect(hasErrors).toBe(false)
    
    // Should have multiple comparisons in URL
    const url = page.url()
    expect(url).toContain('comparisons=')
  })
})