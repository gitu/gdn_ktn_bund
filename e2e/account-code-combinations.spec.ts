import { test, expect } from '@playwright/test'

test.describe('Account Code Combinations in Optimization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the financial comparison page
    await page.goto('/financial-comparison')
    await expect(page.locator('h1')).toContainText('Finanzdaten zum Vergleich auswählen')
  })

  test('should accept account codes with + separator in UI', async ({ page }) => {
    // Add some datasets to work with
    await page.getByRole('textbox', { name: 'Nach Datensätzen suchen...' }).fill('aargau')
    await page.getByRole('row', { name: 'Alle Gemeinden des Kantons' }).getByLabel('Hinzufügen (2022)').click()
    
    // Wait for the scaling selector to appear
    await page.waitForSelector('[data-testid="scaling-dropdown"]', { timeout: 10000 })
    
    // Click on custom formula option - this should be visible now
    await page.getByText('Benutzerdefinierte Formel').click()
    
    // Enter account codes with + separator
    const targetAccountsInput = page.locator('#target-accounts-input')
    await targetAccountsInput.fill('400+401,46')
    
    // Verify no validation error appears
    await expect(page.getByText('Invalid account codes')).toBeHidden()
    
    // The optimize button should be enabled
    const optimizeButton = page.getByRole('button', { name: 'Für Kontencodes optimieren' })
    await expect(optimizeButton).toBeEnabled()
  })

  test('should validate account code format', async ({ page }) => {
    // Add some datasets to work with
    await page.getByRole('textbox', { name: 'Nach Datensätzen suchen...' }).fill('aargau')
    await page.getByRole('row', { name: 'Alle Gemeinden des Kantons' }).getByLabel('Hinzufügen (2022)').click()
    
    // Wait for the scaling selector to appear and click custom formula
    await page.waitForSelector('[data-testid="scaling-dropdown"]', { timeout: 10000 })
    await page.getByText('Benutzerdefinierte Formel').click()
    
    // Test invalid format
    const targetAccountsInput = page.locator('#target-accounts-input')
    await targetAccountsInput.fill('abc+123')
    
    // Should show validation error
    await expect(page.getByText(/Invalid account codes.*Use numeric codes only/)).toBeVisible()
    
    // Test valid format
    await targetAccountsInput.clear()
    await targetAccountsInput.fill('400+401')
    
    // Error should disappear
    await expect(page.getByText(/Invalid account codes/)).toBeHidden()
  })

  test('should handle multiple account combinations in input', async ({ page }) => {
    // Add some datasets to work with
    await page.getByRole('textbox', { name: 'Nach Datensätzen suchen...' }).fill('aargau')
    await page.getByRole('row', { name: 'Alle Gemeinden des Kantons' }).getByLabel('Hinzufügen (2022)').click()
    
    // Wait for the scaling selector to appear and click custom formula
    await page.waitForSelector('[data-testid="scaling-dropdown"]', { timeout: 10000 })
    await page.getByText('Benutzerdefinierte Formel').click()
    
    // Enter multiple combinations
    const targetAccountsInput = page.locator('#target-accounts-input')
    await targetAccountsInput.fill('400+401,36+46,30')
    
    // Should not show validation error
    await expect(page.getByText(/Invalid account codes/)).toBeHidden()
    
    // The optimize button should be enabled
    const optimizeButton = page.getByRole('button', { name: 'Für Kontencodes optimieren' })
    await expect(optimizeButton).toBeEnabled()
  })

  test('should show proper placeholder text', async ({ page }) => {
    // Add some datasets to work with
    await page.getByRole('textbox', { name: 'Nach Datensätzen suchen...' }).fill('aargau')
    await page.getByRole('row', { name: 'Alle Gemeinden des Kantons' }).getByLabel('Hinzufügen (2022)').click()
    
    // Wait for the scaling selector to appear and click custom formula
    await page.waitForSelector('[data-testid="scaling-dropdown"]', { timeout: 10000 })
    await page.getByText('Benutzerdefinierte Formel').click()
    
    // Check that the target accounts input field is visible and has the expected default value
    const targetAccountsInput = page.locator('#target-accounts-input')
    await expect(targetAccountsInput).toBeVisible()
    // The input should have a default value showing the expected format
    await expect(targetAccountsInput).toHaveValue('36,46')
  })
})