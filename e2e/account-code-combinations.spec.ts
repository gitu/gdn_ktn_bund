import { test, expect } from '@playwright/test'

test.describe('Account Code Combinations in Optimization', () => {
  // The optimiser is a choice of its own in the conversion step of the wizard
  async function setupDatasetAndOpenCustomFormula(page) {
    await page.goto('/financial-comparison?datasets=std/fs/gdn_ag:2024&step=scaling')
    await page.getByTestId('scaling-choice-optimize').click()
    await expect(page.locator('#target-accounts-input')).toBeVisible({ timeout: 20000 })
  }

  test('should accept account codes with + separator in UI', async ({ page }) => {
    await setupDatasetAndOpenCustomFormula(page)

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
    await setupDatasetAndOpenCustomFormula(page)

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
    await setupDatasetAndOpenCustomFormula(page)

    // Enter multiple combinations
    const targetAccountsInput = page.locator('#target-accounts-input')
    await targetAccountsInput.fill('400+401,36+46,30')

    // Should not show validation error
    await expect(page.getByText(/Invalid account codes/)).toBeHidden()

    // The optimize button should be enabled
    const optimizeButton = page.getByRole('button', { name: 'Für Kontencodes optimieren' })
    await expect(optimizeButton).toBeEnabled()
  })

  test('picks several accounts from the list instead of typing codes', async ({ page }) => {
    await setupDatasetAndOpenCustomFormula(page)
    const input = page.locator('#target-accounts-input')
    const chips = page.getByTestId('account-chips').locator('li')
    await expect(chips).toHaveCount(2)

    // a common account with one tap, any other one by searching its name
    await page.locator('.quick-chip', { hasText: '40 ' }).click()
    await page.getByTestId('account-add').click()
    await page.locator('.p-select-filter').fill('Personalaufwand')
    await page.getByRole('option', { name: /^30 Personalaufwand/ }).click()
    await expect(input).toHaveValue('36,46,40,30')
    await expect(chips).toHaveCount(4)

    // removing a chip removes its code
    await page.getByRole('button', { name: /^36 .* entfernen$/ }).click()
    await expect(input).toHaveValue('46,40,30')
    await expect(page.getByRole('button', { name: 'Für Kontencodes optimieren' })).toBeEnabled()
  })

  test('should show proper placeholder text', async ({ page }) => {
    await setupDatasetAndOpenCustomFormula(page)

    // Check that the target accounts input field is visible and has the expected default value
    const targetAccountsInput = page.locator('#target-accounts-input')
    await expect(targetAccountsInput).toBeVisible()
    // The input should have a default value showing the expected format
    await expect(targetAccountsInput).toHaveValue('36,46')
  })
})
