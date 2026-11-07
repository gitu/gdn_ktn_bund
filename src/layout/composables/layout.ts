import { computed, reactive } from 'vue'

interface LayoutConfig {
  preset: string
  primary: string
  surface: string | null
  darkTheme: boolean
  menuMode: 'static' | 'overlay'
}

interface LayoutState {
  staticMenuDesktopInactive: boolean
  overlayMenuActive: boolean
  profileSidebarVisible: boolean
  configSidebarVisible: boolean
  staticMenuMobileActive: boolean
  menuHoverActive: boolean
  activeMenuItem: string | null
}

export const THEME_STORAGE_KEY = 'gk-theme'
const THEME_COLORS = { light: '#f3f5f8', dark: '#0a0f18' } as const

function readStoredTheme(): 'light' | 'dark' | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    // Storage can be blocked (private mode, embedded views); fall back to the OS preference.
    return null
  }
}

function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
  )
}

/** Stored choice wins; otherwise follow the OS. */
export function resolveInitialDarkTheme(): boolean {
  const stored = readStoredTheme()
  return stored ? stored === 'dark' : prefersDark()
}

function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('app-dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light)
}

const layoutConfig = reactive<LayoutConfig>({
  preset: 'Lara',
  primary: 'emerald',
  surface: null,
  darkTheme: resolveInitialDarkTheme(),
  menuMode: 'static',
})

if (typeof document !== 'undefined') {
  applyTheme(layoutConfig.darkTheme)
  // Until the user picks a theme explicitly, track the OS setting live.
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', (event) => {
    if (readStoredTheme() === null) {
      layoutConfig.darkTheme = event.matches
      applyTheme(event.matches)
    }
  })
}

const layoutState = reactive<LayoutState>({
  staticMenuDesktopInactive: true,
  overlayMenuActive: false,
  profileSidebarVisible: false,
  configSidebarVisible: false,
  staticMenuMobileActive: false,
  menuHoverActive: false,
  activeMenuItem: null,
})

export function useLayout() {
  const setActiveMenuItem = (item: string | { value: string }): void => {
    layoutState.activeMenuItem = typeof item === 'string' ? item : item.value
  }

  const toggleDarkMode = (): void => {
    if (!document.startViewTransition) {
      executeDarkModeToggle()
      return
    }

    document.startViewTransition(() => executeDarkModeToggle())
  }

  const executeDarkModeToggle = (): void => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme
    applyTheme(layoutConfig.darkTheme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, layoutConfig.darkTheme ? 'dark' : 'light')
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
  }

  const toggleMenu = (): void => {
    if (layoutConfig.menuMode === 'overlay') {
      layoutState.overlayMenuActive = !layoutState.overlayMenuActive
    }

    if (window.innerWidth > 991) {
      layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive
    } else {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive
    }
  }

  const isSidebarActive = computed(
    () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive,
  )

  const isDarkTheme = computed(() => layoutConfig.darkTheme)

  const getPrimary = computed(() => layoutConfig.primary)

  const getSurface = computed(() => layoutConfig.surface)

  return {
    layoutConfig,
    layoutState,
    toggleMenu,
    isSidebarActive,
    isDarkTheme,
    getPrimary,
    getSurface,
    setActiveMenuItem,
    toggleDarkMode,
  }
}
