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
    
    // Open the scaling selector
    await page.getByRole('button', { name: 'Skalierung' }).click()
    
    // Click on custom formula option
    await page.getByText('Benutzerdefinierte Formel').click()
    
    // Enter account codes with + separator
    const targetAccountsInput = page.getByPlaceholder('36,46 or 400+401,46')
    await targetAccountsInput.fill('400+401,46')
    
    // Verify no validation error appears
    await expect(page.getByText('Invalid account codes')).toBeHidden()
    
    // The optimize button should be enabled
    const optimizeButton = page.getByRole('button', { name: 'Formel optimieren' })
    await expect(optimizeButton).toBeEnabled()
  })

  test('should validate account code format', async ({ page }) => {
    // Add some datasets to work with
    await page.getByRole('textbox', { name: 'Nach Datensätzen suchen...' }).fill('aargau')
    await page.getByRole('row', { name: 'Alle Gemeinden des Kantons' }).getByLabel('Hinzufügen (2022)').click()
    
    // Open scaling selector
    await page.getByRole('button', { name: 'Skalierung' }).click()
    await page.getByText('Benutzerdefinierte Formel').click()
    
    // Test invalid format
    const targetAccountsInput = page.getByPlaceholder('36,46 or 400+401,46')
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
    
    // Open scaling selector
    await page.getByRole('button', { name: 'Skalierung' }).click()
    await page.getByText('Benutzerdefinierte Formel').click()
    
    // Enter multiple combinations
    const targetAccountsInput = page.getByPlaceholder('36,46 or 400+401,46')
    await targetAccountsInput.fill('400+401,36+46,30')
    
    // Should not show validation error
    await expect(page.getByText(/Invalid account codes/)).toBeHidden()
    
    // The optimize button should be enabled
    const optimizeButton = page.getByRole('button', { name: 'Formel optimieren' })
    await expect(optimizeButton).toBeEnabled()
  })

  test('should show proper placeholder text', async ({ page }) => {
    // Add some datasets to work with
    await page.getByRole('textbox', { name: 'Nach Datensätzen suchen...' }).fill('aargau')
    await page.getByRole('row', { name: 'Alle Gemeinden des Kantons' }).getByLabel('Hinzufügen (2022)').click()
    
    // Open scaling selector
    await page.getByRole('button', { name: 'Skalierung' }).click()
    await page.getByText('Benutzerdefinierte Formel').click()
    
    // Check that placeholder shows the + syntax example
    const targetAccountsInput = page.getByPlaceholder('36,46 or 400+401,46')
    await expect(targetAccountsInput).toBeVisible()
    await expect(targetAccountsInput).toHaveAttribute('placeholder', '36,46 or 400+401,46')
  })
})