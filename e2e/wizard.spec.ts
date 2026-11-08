import { test, expect } from '@playwright/test'

const ZURICH_2024 = 'gdn/fs/010261:2024,gdn/fs/010230:2024,std/fs/gdn_zh:2024'

const datasetsParam = (url: string) => new URL(url).searchParams.get('datasets') ?? ''
const scalingParam = (url: string) =>
  decodeURIComponent(new URL(url).searchParams.get('scaling') ?? '')

test.describe('comparison wizard', () => {
  test('starts from one place and suggests similar-sized municipalities in its canton', async ({
    page,
  }) => {
    await page.goto('/financial-comparison')
    await expect(page.getByText('Womit möchten Sie beginnen?')).toBeVisible()
    await page.getByTestId('place-search').fill('Winterthur')
    await page.getByRole('button', { name: 'Mit Winterthur beginnen' }).click()

    const similar = page.getByTestId('suggestions-similarInCanton')
    await expect(similar).toContainText('Ähnlich grosse Gemeinden im Kanton Zürich', {
      timeout: 15000,
    })
    await expect(similar.locator('.suggestion')).toHaveCount(5)
    await expect(similar).toContainText('Einw.')
    await expect(page.getByTestId('suggestions-similarElsewhere')).toBeVisible()
    await expect(page.getByTestId('suggestions-sameCanton')).toContainText('Kanton Zürich')

    await page.getByTestId('suggestions-similarInCanton-all').click()
    await expect(page.getByTestId('selected-places').locator('li')).toHaveCount(6)
    await expect(page.getByTestId('selected-places').locator('li').first()).toContainText(
      'Winterthur',
    )

    // or search freely, keeping what is chosen
    await page.getByTestId('place-mode-custom').click()
    await page.getByTestId('place-search').fill('Basel-Stadt')
    await page.getByRole('button', { name: 'Kanton Basel-Stadt hinzufügen', exact: true }).click()
    await expect(page.getByTestId('selected-places').locator('li')).toHaveCount(7)

    await page.getByTestId('step-next').click()
    await expect(page.getByTestId('step-panel-years')).toBeVisible()
    expect(datasetsParam(page.url()).split(',')[0]).toBe('gdn/fs/010230:2024')
  })

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

  test('a conversion chosen while the next year is still loading is the one applied', async ({
    page,
  }) => {
    const D = 'gdn/fs/010261:2024,gdn/fs/010230:2024'
    await page.goto(`/financial-comparison?datasets=${D}&scaling=workplaces`)
    const bar = page.getByTestId('chart-revenue-expenses').getByTestId('bar').first()
    await expect(bar).toHaveAttribute('aria-label', /Zürich, Ertrag/, { timeout: 60000 })

    // From now on the financial data takes a while to arrive
    await page.route(/\/data\/(gdn|std)\/fs\/.*\.csv/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.continue()
    })
    await page.getByTestId('year-previous').click()
    await page.getByTestId('scaling-dropdown').click()
    await page.getByRole('option', { name: 'Bevölkerung', exact: true }).click()

    const chart = page.getByTestId('chart-revenue-expenses')
    await expect(chart).toContainText('2023, in Franken pro Einwohner', { timeout: 30000 })
    // Zürich 2023: revenue 6,108,040,720 CHF / 433,989 inhabitants, not / its 546,000 jobs
    await expect(bar).toHaveAttribute('aria-label', /^Zürich, Ertrag, 14'074\sCHF$/)
  })

  test('a statistic that never arrives does not block switching to another conversion', async ({
    page,
  }) => {
    await page.goto(
      '/financial-comparison?datasets=gdn/fs/010261:2024,gdn/fs/010230:2024&scaling=pop',
    )
    const chart = page.getByTestId('chart-revenue-expenses')
    await expect(chart.getByTestId('bar').first()).toBeVisible({ timeout: 60000 })

    // The jobs statistic never answers (a stalled connection)
    await page.route(/\/data\/stats\/workplaces\//, () => {})
    await page.getByTestId('scaling-dropdown').click()
    await page.getByRole('option', { name: 'Arbeitsplätze', exact: true }).click()
    await expect(page.getByTestId('financial-charts')).toHaveClass(/is-recalculating/)

    // The next choice applies at once instead of waiting behind the stalled one
    await page.getByTestId('scaling-dropdown').click()
    await page.getByRole('option', { name: 'Nicht umrechnen', exact: true }).click()
    await expect(chart.locator('.chart-subtitle')).toHaveText('2024, in Franken')
    await expect(page.getByTestId('financial-charts')).not.toHaveClass(/is-recalculating/)
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

  test('the trend tooltip of the last year is complete and inside the chart', async ({ page }) => {
    const D = ['gdn/fs/010261', 'gdn/fs/010230', 'std/fs/gdn_zh']
      .flatMap((place) => ['2022', '2023', '2024'].map((year) => `${place}:${year}`))
      .join(',')
    await page.goto(`/financial-comparison?datasets=${D}&scaling=pop`)
    const chart = page.getByTestId('chart-trend').getByTestId('line-chart')
    await expect(chart).toBeVisible({ timeout: 60000 })
    await chart.scrollIntoViewIfNeeded()
    const box = (await chart.boundingBox())!
    await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2)

    const tooltip = chart.getByTestId('chart-tooltip')
    await expect(tooltip.locator('.tooltip-title')).toHaveText('2024')
    await expect(tooltip.locator('li')).toHaveCount(3)
    await expect(tooltip).toContainText('Alle Gemeinden des Kantons Zürich')
    const tip = (await tooltip.boundingBox())!
    expect(tip.x).toBeGreaterThanOrEqual(box.x)
    expect(tip.x + tip.width).toBeLessThanOrEqual(box.x + box.width + 1)
    // nothing inside is cut off
    expect(
      await tooltip.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true)
  })

  test('shows amounts the Swiss way and rounds them to thousands or millions on request', async ({
    page,
  }) => {
    await page.goto('/financial-comparison?datasets=gdn/fs/010261:2024&view=table')
    const cell = page.getByRole('cell', { name: /Finanzieller Wert für Zürich/ }).first()
    await expect(cell).toContainText(/^\s*\d{1,3}('\d{3})+\sCHF\s*$/, { timeout: 60000 })
    // no conversion is named, not left blank
    await expect(page.getByTestId('scaling-dropdown')).toContainText('Nicht umrechnen')

    await page.getByTestId('amount-unit-thousand').click()
    await expect(cell).toContainText(/^\s*\d{1,3}('\d{3})*\sTsd\. CHF\s*$/)
    await page.getByTestId('amount-unit-million').click()
    await expect(cell).toContainText(/^\s*[\d'.]+\sMio\. CHF\s*$/)

    // the charts round alike, and the choice is kept
    await page.getByTestId('view-charts').click()
    const bar = page.getByTestId('chart-revenue-expenses').getByTestId('bar').first()
    await expect(bar).toHaveAttribute('aria-label', /Mio\. CHF$/)
    await page.reload()
    await expect(page.getByTestId('amount-unit-million')).toHaveAttribute('aria-pressed', 'true')
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
