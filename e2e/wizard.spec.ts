import { test, expect } from '@playwright/test'

const ZURICH_2024 = 'gdn/fs/010261:2024,gdn/fs/010230:2024,std/fs/gdn_zh:2024'

const datasetsParam = (url: string) => new URL(url).searchParams.get('datasets') ?? ''
const scalingParam = (url: string) =>
  decodeURIComponent(new URL(url).searchParams.get('scaling') ?? '')

test.describe('comparison wizard', () => {
  test('a link with data opens the result as charts', async ({ page }) => {
    await page.goto(`/financial-comparison?datasets=${ZURICH_2024}&scaling=pop`)
    await expect(page.getByTestId('step-result')).toHaveAttribute('aria-current', 'step')
    await expect(page.getByTestId('chart-revenue-expenses')).toBeVisible({ timeout: 60000 })
    await expect(page.getByTestId('chart-result')).toBeVisible()
    await expect(page.getByTestId('chart-revenue-structure')).toBeVisible()
    await expect(page.getByTestId('chart-expense-structure')).toBeVisible()
    await expect(page.getByTestId('chart-revenue-expenses')).toContainText('pro Einwohner')
    await expect(page.getByTestId('chart-revenue-expenses').getByTestId('bar')).toHaveCount(6)

    // every chart has a table twin
    await page.getByTestId('chart-result').getByTestId('chart-table-toggle').click()
    await expect(page.getByTestId('chart-result').getByTestId('chart-table')).toContainText(
      'Winterthur',
    )
  })

  test('browses to other years with the same conversion', async ({ page }) => {
    await page.goto(`/financial-comparison?datasets=${ZURICH_2024}&scaling=pop`)
    await expect(page.getByTestId('chart-revenue-expenses')).toBeVisible({ timeout: 60000 })

    await page.getByTestId('year-previous').click()
    await expect.poll(() => datasetsParam(page.url())).toBe(ZURICH_2024.replaceAll('2024', '2023'))
    expect(scalingParam(page.url())).toBe('pop')
    await expect(page.getByTestId('chart-revenue-expenses')).toContainText('2023', {
      timeout: 60000,
    })
    await expect(page.getByTestId('chart-revenue-expenses')).toContainText('pro Einwohner')

    await page.getByTestId('year-next').click()
    await expect.poll(() => datasetsParam(page.url())).toBe(ZURICH_2024)
  })

  test('several years show the development, calculated with the same formula each year', async ({
    page,
  }) => {
    await page.goto(
      `/financial-comparison?datasets=${ZURICH_2024}&scaling=${encodeURIComponent('custom:pop+workplaces/2')}&step=years`,
    )
    await page.getByTestId('year-mode-multi').click()
    await page.getByRole('button', { name: 'Letzte 3 Jahre' }).click()
    await expect(page.getByTestId('year-summary')).toContainText('9 Spalten')

    await page.getByTestId('step-next').click()
    // the formula step shows the divisor of every place and year before any account
    const preview = page.getByTestId('scaling-preview')
    await expect(preview).toContainText('Winterthur')
    await expect(preview.locator('thead th')).toHaveText(['Ort', '2022', '2023', '2024'])
    await expect(preview.locator('tbody td').first()).toContainText(/\d{3}/, { timeout: 30000 })

    await page.getByTestId('step-next').click()
    const trend = page.getByTestId('chart-trend')
    await expect(trend).toBeVisible({ timeout: 60000 })
    await expect(trend).toContainText('2022 bis 2024')
    await expect(trend.locator('.series-line')).toHaveCount(3)
    expect(scalingParam(page.url())).toBe('custom:pop+workplaces/2')

    // the snapshot charts below show one of the years
    await page.getByTestId('focus-year').getByRole('button', { name: 'Vorheriges Jahr' }).click()
    await expect(page.getByTestId('chart-result')).toContainText('2023')

    // keyboard readout of the trend
    await trend.getByTestId('line-chart').focus()
    await page.keyboard.press('End')
    await expect(trend.getByTestId('chart-tooltip')).toContainText('2024')
  })

  test('the browser back button returns to the previous step', async ({ page }) => {
    await page.goto(`/financial-comparison?datasets=${ZURICH_2024}&step=years`)
    await page.getByTestId('step-next').click()
    await expect(page.getByTestId('step-panel-scaling')).toBeVisible()
    await page.goBack()
    await expect(page.getByTestId('step-panel-years')).toBeVisible()
  })

  test('a step is reachable from the result and keeps the choice', async ({ page }) => {
    await page.goto(`/financial-comparison?datasets=${ZURICH_2024}&scaling=pop`)
    await page.getByTestId('edit-scaling').click()
    await expect(page.getByTestId('scaling-choice-pop')).toHaveClass(/is-active/)
    await page.getByTestId('scaling-choice-workplaces').click()
    await page.getByTestId('step-next').click()
    await expect(page.getByTestId('chart-revenue-expenses')).toContainText('pro Berufstätige', {
      timeout: 60000,
    })
    expect(scalingParam(page.url())).toBe('workplaces')
  })

  test('a row expands when its name is clicked, not only on the caret', async ({ page }) => {
    await page.goto(`/financial-comparison?datasets=${ZURICH_2024}&view=table`)
    const table = page.getByTestId('tree-table')
    await expect(table).toBeVisible({ timeout: 60000 })
    await expect(table).not.toContainText('Finanzvermögen')
    await table.getByTestId('account-cell').filter({ hasText: 'Aktiven' }).click()
    await expect(table).toContainText('Finanzvermögen')
    await table.getByTestId('account-cell').filter({ hasText: 'Aktiven' }).click()
    await expect(table).not.toContainText('Finanzvermögen')
  })
})
