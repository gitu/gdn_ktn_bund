import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { config, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createI18n } from 'vue-i18n'
import AppBottomNav from '../AppBottomNav.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      navigation: {
        main: 'Hauptnavigation',
        home: 'Startseite',
        compare: 'Vergleich',
        about: 'Über',
      },
    },
  },
})

async function mountAt(path: string) {
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/financial-comparison', component: stub },
      { path: '/about', component: stub },
    ],
  })
  router.push(path)
  await router.isReady()
  return mount(AppBottomNav, { global: { plugins: [i18n, router] } })
}

describe('AppBottomNav', () => {
  // test-setup.ts installs its own router globally; this spec needs one with the /about route.
  const globalPlugins = config.global.plugins

  beforeEach(() => {
    config.global.plugins = []
  })

  afterEach(() => {
    config.global.plugins = globalPlugins
  })

  it('is a labelled navigation landmark with the three destinations', async () => {
    const wrapper = await mountAt('/')
    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('Hauptnavigation')
    expect(nav.findAll('a').map((a) => a.attributes('href'))).toEqual([
      '/',
      '/financial-comparison',
      '/about',
    ])
  })

  it.each([
    ['/', 0],
    ['/financial-comparison', 1],
    ['/about', 2],
  ])('marks only the current page on %s (aria-current)', async (path, index) => {
    const wrapper = await mountAt(path)
    const current = wrapper.findAll('a').map((a) => a.attributes('aria-current') === 'page')
    expect(current.filter(Boolean)).toHaveLength(1)
    expect(current[index]).toBe(true)
  })
})
