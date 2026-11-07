import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The composable keeps module-level state, so every test imports a fresh copy.
async function loadLayout() {
  vi.resetModules()
  return await import('../layout')
}

function stubOsDark(dark: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: dark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
}

describe('layout theme', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    document.documentElement.classList.remove('app-dark')
    document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#f3f5f8">')
    vi.mocked(window.localStorage.getItem).mockReset()
    vi.mocked(window.localStorage.setItem).mockReset()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    document.querySelector('meta[name="theme-color"]')?.remove()
  })

  it('follows the OS when nothing is stored', async () => {
    stubOsDark(true)
    const { resolveInitialDarkTheme } = await loadLayout()
    expect(resolveInitialDarkTheme()).toBe(true)
  })

  it('prefers a stored choice over the OS', async () => {
    stubOsDark(true)
    vi.mocked(window.localStorage.getItem).mockReturnValue('light')
    const { resolveInitialDarkTheme } = await loadLayout()
    expect(resolveInitialDarkTheme()).toBe(false)
  })

  it('ignores unknown stored values', async () => {
    stubOsDark(false)
    vi.mocked(window.localStorage.getItem).mockReturnValue('purple')
    const { resolveInitialDarkTheme } = await loadLayout()
    expect(resolveInitialDarkTheme()).toBe(false)
  })

  it('falls back to the OS when storage is blocked', async () => {
    stubOsDark(true)
    vi.mocked(window.localStorage.getItem).mockImplementation(() => {
      throw new Error('blocked')
    })
    const { resolveInitialDarkTheme } = await loadLayout()
    expect(resolveInitialDarkTheme()).toBe(true)
  })

  it('applies the initial theme to <html> and the theme-color meta', async () => {
    stubOsDark(true)
    await loadLayout()
    expect(document.documentElement.classList.contains('app-dark')).toBe(true)
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#0a0f18',
    )
  })

  it('toggling switches the class and remembers the choice', async () => {
    stubOsDark(false)
    const { useLayout, THEME_STORAGE_KEY } = await loadLayout()
    const { toggleDarkMode, isDarkTheme } = useLayout()

    toggleDarkMode()
    expect(isDarkTheme.value).toBe(true)
    expect(document.documentElement.classList.contains('app-dark')).toBe(true)
    expect(window.localStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark')

    toggleDarkMode()
    expect(isDarkTheme.value).toBe(false)
    expect(document.documentElement.classList.contains('app-dark')).toBe(false)
    expect(window.localStorage.setItem).toHaveBeenLastCalledWith(THEME_STORAGE_KEY, 'light')
  })

  it('still toggles when storage throws', async () => {
    stubOsDark(false)
    vi.mocked(window.localStorage.setItem).mockImplementation(() => {
      throw new Error('quota')
    })
    const { useLayout } = await loadLayout()
    const { toggleDarkMode, isDarkTheme } = useLayout()

    expect(() => toggleDarkMode()).not.toThrow()
    expect(isDarkTheme.value).toBe(true)
  })
})
