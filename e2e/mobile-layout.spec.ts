import { test, expect, type Page } from '@playwright/test'

/** Wait for the page's heading and web fonts, so the measurement sees the settled layout. */
async function settle(page: Page) {
  await expect(page.locator('h1').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

/** Widest the page may be minus the viewport: anything above 0 means sideways scrolling. */
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

const PHONE_WIDTHS = [320, 360, 390, 430]
const STATIC_ROUTES = ['/', '/about', '/financial-comparison']
const WITH_DATA = '/financial-comparison?datasets=gdn/fs/010261:2022'

for (const width of PHONE_WIDTHS) {
  test.describe(`phone ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, hasTouch: true })

    for (const route of STATIC_ROUTES) {
      test(`${route} does not scroll sideways`, async ({ page }) => {
        await page.goto(route)
        await settle(page)
        expect(await horizontalOverflow(page)).toBe(0)
      })
    }

    test('a loaded comparison does not scroll sideways', async ({ page }) => {
      await page.goto(WITH_DATA)
      await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 60000 })
      expect(await horizontalOverflow(page)).toBe(0)
    })
  })
}

test.describe('phone navigation', () => {
  test.use({ viewport: { width: 390, height: 800 }, hasTouch: true })

  test('uses the bottom bar instead of the drawer button', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByTestId('bottom-nav')
    await expect(nav).toBeVisible()
    await expect(page.locator('.layout-menu-button')).toBeHidden()

    await nav.getByRole('link', { name: 'Über' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1)
  })

  test('lists datasets as cards, not as a table', async ({ page }) => {
    await page.goto('/financial-comparison')
    await expect(page.getByTestId('dataset-cards')).toBeVisible()
    await expect(page.locator('.datasets-table')).toHaveCount(0)
  })

  test('an added dataset can be removed again from its chip', async ({ page }) => {
    await page.goto('/financial-comparison')
    await page
      .locator('.dataset-card')
      .first()
      .getByRole('button', { name: /Hinzufügen/ })
      .click()
    const chips = page.getByTestId('selected-chips').locator('.selected-chip')
    await expect(chips).toHaveCount(1)
    await chips.first().getByRole('button').click()
    await expect(chips).toHaveCount(0)
  })
})

test.describe('desktop navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('has no bottom bar and keeps the drawer button and table', async ({ page }) => {
    await page.goto('/financial-comparison')
    await expect(page.getByTestId('bottom-nav')).toBeHidden()
    await expect(page.locator('.layout-menu-button')).toBeVisible()
    await expect(page.locator('.datasets-table')).toBeVisible()
    expect(await horizontalOverflow(page)).toBe(0)
  })
})

test.describe('theme', () => {
  test('follows the OS and remembers an explicit choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/app-dark/)

    await page.getByRole('button', { name: 'Hell/Dunkel umschalten' }).click()
    await expect(page.locator('html')).not.toHaveClass(/app-dark/)

    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/app-dark/)
  })

  test('keeps <html lang> in step with the language selector', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    await page.getByTestId('language-selector-trigger').click()
    await page.getByText('Français').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })
})
