import { test, expect } from '@playwright/test'

const URL = '/financial-comparison?datasets=gdn/fs/010261:2024,std/fs/ktn_zh:2024,std/fs/bund:2024'

test.describe('plain-language explainers', () => {
  test('the "how to read" help opens and explains the rows', async ({ page }) => {
    await page.goto(URL)
    const help = page.getByTestId('how-to-read')
    await expect(help).toBeVisible({ timeout: 60000 })
    await expect(help).not.toHaveAttribute('open', '')
    await help.locator('summary').click()
    await expect(help).toHaveAttribute('open', '')
    await expect(help).toContainText('Aktiven')
    await expect(help).toContainText('Ertrag')
    await expect(help).toContainText('pro Einwohner')
  })

  test('places at a glance say what each column is, with numbers from the statistics', async ({
    page,
  }) => {
    await page.goto(URL)
    const facts = page.getByTestId('place-facts')
    await expect(facts).toBeVisible({ timeout: 60000 })

    const city = page.getByTestId('place-gdn/fs/010261:2024')
    await expect(city).toContainText('Zürich')
    await expect(city).toContainText('Gemeinde')
    await expect(city).toContainText('Einwohner/innen')

    const canton = page.getByTestId('place-std/fs/ktn_zh:2024')
    await expect(canton).toContainText('Kanton')
    await expect(canton).toContainText('ohne seine Gemeinden')

    // The federal level counts all inhabitants once, and shows no (unreliable) country-wide area
    const federal = page.getByTestId('place-std/fs/bund:2024')
    await expect(federal).toContainText('Bund')
    await expect(federal).not.toContainText('Fläche')
  })

  test('canton names are spelled in German, not English', async ({ page }) => {
    await page.goto('/financial-comparison?datasets=std/fs/gdn_zh:2024,std/fs/gdn_ge:2024')
    const facts = page.getByTestId('place-facts')
    await expect(facts).toContainText('Alle Gemeinden des Kantons Zürich', { timeout: 60000 })
    await expect(facts).toContainText('Alle Gemeinden des Kantons Genf')
  })

  test('a calculated "rest of canton" column is labelled and comes with a warning', async ({
    page,
  }) => {
    await page.goto(
      '/financial-comparison?datasets=std/fs/gdn_zh_rest:2024,gdn/fs/010261:2024&scaling=pop',
    )

    const notice = page.getByTestId('rest-notice')
    await expect(notice).toBeVisible({ timeout: 60000 })
    await expect(notice).toContainText('Berechnete Werte')
    await expect(notice).toContainText('Näherung')

    await expect(page.locator('[data-testid="tree-table"] thead')).toContainText(
      'Übrige Gemeinden ZH (berechnet)',
    )
    // scaled with the population of the rest itself, not of the whole country: CHF per inhabitant, not billions
    await expect(
      page.getByRole('cell', { name: /Finanzieller Wert für Übrige Gemeinden/ }).first(),
    ).toContainText(/^\s*\d{1,3}\.\d{3}\sCHF/)

    const place = page.getByTestId('place-std/fs/gdn_zh_rest:2024')
    await expect(place).toContainText('Berechnet')
    await expect(place).toContainText('Einwohner/innen')
  })

  test('no warning when no calculated column is selected', async ({ page }) => {
    await page.goto('/financial-comparison?datasets=gdn/fs/010261:2024')
    await expect(page.getByTestId('place-facts')).toBeVisible({ timeout: 60000 })
    await expect(page.getByTestId('rest-notice')).toHaveCount(0)
  })
})
