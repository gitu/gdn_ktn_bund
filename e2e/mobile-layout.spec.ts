import { test, expect, type Page } from '@playwright/test'

/** Wait for the page's heading and web fonts, so the measurement sees the settled layout. */
async function settle(page: Page) {
  await expect(page.locator('h1').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

/** Widest the page may be minus the viewport: anything above 0 means sideways scrolling. */
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

/**
 * Top bar buttons (menu, language, theme) whose content is clipped or that stick out of the screen.
 * Returns their labels; empty when all of them are fully visible.
 */
const clippedTopbarButtons = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.layout-topbar .layout-topbar-action')]
      .filter((button) => button.offsetParent !== null)
      .filter((button) => {
        const box = button.getBoundingClientRect()
        return (
          button.scrollWidth > button.clientWidth + 1 ||
          box.left < 0 ||
          box.right > document.documentElement.clientWidth ||
          box.width < 44 ||
          box.height < 44
        )
      })
      .map((button) => button.getAttribute('aria-label')),
  )

const PHONE_WIDTHS = [320, 360, 390, 430]
const STATIC_ROUTES = ['/', '/about', '/financial-comparison']
const WITH_DATA = '/financial-comparison?datasets=gdn/fs/010261:2022'
const ZURICH = 'gdn/fs/010261:2023,gdn/fs/010261:2024,gdn/fs/010230:2023,gdn/fs/010230:2024'

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

    test('the top bar buttons are whole, on screen and big enough to tap', async ({ page }) => {
      await page.goto('/')
      await settle(page)
      expect(await clippedTopbarButtons(page)).toEqual([])
    })

    test('a loaded comparison does not scroll sideways, as table or as charts', async ({
      page,
    }) => {
      await page.goto(`${WITH_DATA}&view=table`)
      await expect(page.locator('[data-testid="tree-table"]')).toBeVisible({ timeout: 60000 })
      expect(await horizontalOverflow(page)).toBe(0)

      await page.goto(`/financial-comparison?datasets=${ZURICH}&scaling=pop`)
      await expect(page.getByTestId('chart-trend')).toBeVisible({ timeout: 60000 })
      expect(await horizontalOverflow(page)).toBe(0)
    })

    for (const step of ['years', 'scaling']) {
      test(`the ${step} step does not scroll sideways`, async ({ page }) => {
        await page.goto(`/financial-comparison?datasets=${ZURICH}&step=${step}`)
        await expect(page.getByTestId(`step-panel-${step}`)).toBeVisible()
        await settle(page)
        expect(await horizontalOverflow(page)).toBe(0)
      })
    }
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

  test('adds a place and removes it again from the selection', async ({ page }) => {
    await page.goto('/financial-comparison')
    await page
      .locator('.result-item')
      .first()
      .getByRole('button', { name: /hinzufügen/ })
      .click()
    const selected = page.getByTestId('selected-places').locator('li')
    await expect(selected).toHaveCount(1)
    await page.getByTestId('remove-place').click()
    await expect(selected).toHaveCount(0)
  })

  test('keeps the next button in reach above the bottom bar', async ({ page }) => {
    await page.goto('/financial-comparison')
    await page
      .locator('.result-item')
      .first()
      .getByRole('button', { name: /hinzufügen/ })
      .click()
    const next = page.getByTestId('step-next')
    await expect(next).toBeEnabled()
    await expect(next).toBeInViewport()
    const nextBox = await next.boundingBox()
    const navBox = await page.getByTestId('bottom-nav').boundingBox()
    expect(nextBox!.y + nextBox!.height).toBeLessThanOrEqual(navBox!.y)
  })
})

test.describe('desktop navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('has no bottom bar and keeps the drawer button and the place picker', async ({ page }) => {
    await page.goto('/financial-comparison')
    await expect(page.getByTestId('bottom-nav')).toBeHidden()
    await expect(page.locator('.layout-menu-button')).toBeVisible()
    await expect(page.getByTestId('place-picker')).toBeVisible()
    expect(await horizontalOverflow(page)).toBe(0)
    expect(await clippedTopbarButtons(page)).toEqual([])
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
