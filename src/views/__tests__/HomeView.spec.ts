import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { config, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createI18n } from 'vue-i18n'
import de from '../../i18n/locales/de.json'
import catalog from '../../data/available-data.json'
import { getCatalogSummary } from '../../utils/AvailableDataLoader'
import type { AvailableDataCatalog } from '../../types/DataStructures'
import { SAMPLE_COMPARISONS } from '../../data/sampleComparisons'
import HomeView from '../HomeView.vue'

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })

async function mountHome() {
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/financial-comparison', name: 'financial-comparison', component: stub },
      { path: '/about', component: stub },
    ],
  })
  router.push('/')
  await router.isReady()
  const wrapper = mount(HomeView, { global: { plugins: [i18n, router] } })
  await expect.poll(() => wrapper.find('[data-testid="home-stats"]').exists()).toBe(true)
  return wrapper
}

describe('HomeView', () => {
  // test-setup.ts installs its own router globally; this spec brings one with the named route
  const globalPlugins = config.global.plugins

  beforeEach(() => {
    config.global.plugins = []
  })

  afterEach(() => {
    config.global.plugins = globalPlugins
  })

  it('keeps the headline and the hooks the e2e tests use', async () => {
    const wrapper = await mountHome()
    expect(wrapper.find('h1[data-testid="home-title"]').text()).toBe(de.homeView.title)
    for (const id of [
      'home-subtitle',
      'home-description-card',
      'home-description-title',
      'home-cta-card',
      'home-cta-title',
    ]) {
      expect(wrapper.find(`[data-testid="${id}"]`).exists(), id).toBe(true)
    }
  })

  it('shows entity counts and year ranges taken from the catalogue', async () => {
    const wrapper = await mountHome()
    const summary = getCatalogSummary(catalog as AvailableDataCatalog)
    const chips = wrapper.findAll('[data-testid="home-stats"] li')

    expect(chips).toHaveLength(3)
    expect(chips[0].text()).toContain(String(summary.gdn.count))
    expect(chips[0].text()).toContain(`${summary.gdn.firstYear}–${summary.gdn.lastYear}`)
    expect(chips[1].text()).toContain(String(summary.std.count))
    expect(chips[1].text()).toContain(`${summary.std.firstYear}–${summary.std.lastYear}`)
  })

  it('links the ready-made comparisons straight into the comparison page', async () => {
    const wrapper = await mountHome()

    const levels = wrapper.get('[data-testid="home-sample-governmentalLevels"]').attributes('href')
    expect(levels).toContain('/financial-comparison?datasets=')
    for (const id of SAMPLE_COMPARISONS.governmentalLevels.datasets) {
      expect(decodeURIComponent(levels ?? '')).toContain(id)
    }
    expect(levels).not.toContain('scaling=')

    const zurich = wrapper
      .get('[data-testid="home-sample-zurichMunicipalities"]')
      .attributes('href')
    expect(zurich).toContain('scaling=pop')
  })

  it('names the scaling of a sample with a translated label, not a raw key', async () => {
    const wrapper = await mountHome()
    const card = wrapper.get('[data-testid="home-sample-zurichMunicipalities"]')
    expect(card.text()).toContain(de.financialDataScalingSelector.options.pop)
    expect(card.text()).not.toContain('financialDataScaling')
  })
})
