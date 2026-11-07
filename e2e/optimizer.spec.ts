import { test, expect } from '@playwright/test'

const DATASETS = [
  'gdn/fs/010261:2024',
  'gdn/fs/010230:2024',
  'gdn/fs/010156:2024',
  'gdn/fs/010058:2024',
  'std/fs/gdn_zh:2024',
].join(',')

async function openOptimizer(page) {
  await page.goto(`/financial-comparison?datasets=${DATASETS}`)
  await expect(page.locator('[data-testid="scaling-dropdown"]')).toBeVisible({ timeout: 30000 })
  await page.getByText('Benutzerdefinierte Formel').click()
  await expect(page.locator('#target-accounts-input')).toBeVisible({ timeout: 15000 })
}

test.describe('Scaling optimiser: scenarios and simulations', () => {
  test('finds a formula, compares two scenarios and applies one', async ({ page }) => {
    await openOptimizer(page)
    const run = page.getByRole('button', { name: 'Für Kontencodes optimieren' })

    await run.click()
    const formula = page.locator('[data-testid="optimized-formula"]')
    await expect(formula).toBeVisible({ timeout: 20000 })
    // cross-validated quality and the overfitting rating are always shown
    await expect(page.locator('[data-testid="overfit-risk"]')).toBeVisible()

    // a second scenario, run with another method
    await page.getByTestId('scenario-duplicate').first().click()
    await page.getByRole('button', { name: 'Robust' }).click()
    await run.click()
    await expect(page.locator('[data-testid="scenario-comparison"]')).toBeVisible({
      timeout: 20000,
    })
    await expect(page.locator('[data-testid^="comparison-row-"]')).toHaveCount(2)

    // scenarios are kept in the URL (compact, definitions only)
    await expect
      .poll(() => new URL(page.url()).searchParams.get('opt')?.length ?? 0)
      .toBeGreaterThan(10)
    expect(new URL(page.url()).searchParams.get('opt')!.length).toBeLessThan(400)

    // simulations
    await page.getByTestId('sim-toggle-expected').click()
    await expect(page.locator('[data-testid="sim-expected-rows"] li')).toHaveCount(5)

    // applying sets the custom scaling exactly like the manual button
    const text = (await formula.textContent())!.trim()
    await page.getByTestId('apply-optimized').click()
    await expect
      .poll(() => decodeURIComponent(new URL(page.url()).searchParams.get('scaling') ?? ''))
      .toBe(`custom:${text}`)
  })

  test('has no horizontal scroll on a phone, with result and simulations open', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openOptimizer(page)
    await page.getByRole('button', { name: 'Für Kontencodes optimieren' }).click()
    await expect(page.locator('[data-testid="optimized-formula"]')).toBeVisible({ timeout: 20000 })
    await page.getByTestId('sim-toggle-whatIf').click()
    await expect(page.locator('[data-testid="sim-whatif-rows"]')).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
