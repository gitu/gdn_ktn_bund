/**
 * The optimiser panel with the real PrimeVue components (test-setup stubs them globally):
 * scenarios list, editor, result, comparison and simulations.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import en from '../../i18n/locales/en.json'
import OptimizerPanel from '../optimization/OptimizerPanel.vue'
import { useOptimizerStore } from '@/stores/optimizer'
import { constellationFixture } from '@/utils/optimization/__tests__/testData'
import type { StatsAvailabilityInfo } from '@/types/StatsData'

const replace = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace, resolve: () => ({ href: '/financial-comparison' }) }),
}))
vi.mock('@/utils/optimization/scalingFactors', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/optimization/scalingFactors')>()
  // the factor table comes from the fixture instead of the network
  const { constellationFixture } = await import('@/utils/optimization/__tests__/testData')
  const table = constellationFixture({
    n: 8,
    truth: { pop: 1, workplaces: 0.5, total_area: 20 },
    noise: 0.05,
    seed: 3,
    accounts: { '36': 4000, '46': 250 },
  }).factors
  return { ...original, loadFactorValues: vi.fn().mockResolvedValue(table) }
})
vi.mock('@/utils/GeographicalDataLoader', () => ({
  getMunicipalityByGdnId: vi.fn().mockResolvedValue(undefined),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const fixture = constellationFixture({
  n: 8,
  truth: { pop: 1, workplaces: 0.5, total_area: 20 },
  noise: 0.05,
  seed: 3,
  accounts: { '36': 4000, '46': 250 },
})
const label = (id: string) => ({ de: id, fr: id, it: id, en: id })
const stats = fixture.allFactorIds.map(
  (id) =>
    ({
      id,
      name: label(id),
      unit: label('u'),
      availableGdnYears: [2024],
      availableKtnYears: [2024],
      source: '',
      lastUpdate: '',
      type: 'scaling',
      description: label(id),
    }) as StatsAvailabilityInfo,
)

const mounted: { unmount: () => void }[] = []

function mountPanel() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useOptimizerStore()
  const wrapper = mount(OptimizerPanel, {
    props: { financialData: fixture.data, stats },
    global: {
      plugins: [i18n, pinia],
      stubs: {
        Button: false,
        Select: false,
        InputText: false,
        InputNumber: false,
        Message: false,
        FloatLabel: false,
      },
    },
  })
  mounted.push(wrapper)
  return { wrapper, store }
}

async function runSelected(wrapper: ReturnType<typeof mountPanel>['wrapper']) {
  await wrapper.get('.action-button').trigger('click')
  await vi.waitFor(() =>
    expect(wrapper.find('[data-testid="optimization-result"]').exists()).toBe(true),
  )
}

describe('OptimizerPanel', () => {
  // pending (debounced) URL writes of one test must not leak into the next
  afterEach(() => mounted.splice(0).forEach((w) => w.unmount()))

  beforeEach(() => {
    replace.mockClear()
    // PrimeVue's select overlay asks for it; jsdom has none
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('starts with one default scenario and the e2e hooks in place', () => {
    const { wrapper } = mountPanel()
    expect(wrapper.findAll('[data-testid="scenario-list"] li')).toHaveLength(1)
    const input = wrapper.get('#target-accounts-input')
    expect((input.element as HTMLInputElement).value).toBe('36,46')
    expect(wrapper.get('.action-button').text()).toBe('Optimize for Account Codes')
    expect(wrapper.find('[data-testid="optimization-result"]').exists()).toBe(false)
  })

  it('shows the English validation message and blocks the run for bad codes', async () => {
    const { wrapper } = mountPanel()
    await wrapper.get('#target-accounts-input').setValue('abc+123')
    expect(wrapper.text()).toMatch(/Invalid account codes: abc\+123\. Use numeric codes only/)
    expect(wrapper.get('.action-button').attributes('disabled')).toBeDefined()
    await wrapper.get('#target-accounts-input').setValue('400+401')
    expect(wrapper.text()).not.toMatch(/Invalid account codes/)
  })

  it('runs a scenario, shows formula and honest metrics, and applies the formula on request', async () => {
    const { wrapper } = mountPanel()
    await runSelected(wrapper)
    const formula = wrapper.get('[data-testid="optimized-formula"]').text()
    expect(formula).toMatch(/pop/)
    expect(wrapper.find('[data-testid="overfit-risk"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('cross-validated')

    await wrapper.get('[data-testid="apply-optimized"]').trigger('click')
    expect(wrapper.emitted('apply')?.[0]).toEqual([formula])
  })

  it('adds, duplicates and removes scenarios and compares the results side by side', async () => {
    const { wrapper, store } = mountPanel()
    await runSelected(wrapper)

    await wrapper.get('[data-testid="scenario-duplicate"]').trigger('click')
    expect(store.scenarios).toHaveLength(2)
    // the copy has to be run on its own; it is selected and has no result yet
    expect(store.selected.run).toBeNull()
    await wrapper.get('[data-testid="scenario-add"]').trigger('click')
    expect(store.scenarios).toHaveLength(3)

    await wrapper.get('[data-testid="scenario-run-all"]').trigger('click')
    await vi.waitFor(() => expect(store.scenarios.every((s) => s.status === 'done')).toBe(true))
    await flushPromises()
    expect(wrapper.find('[data-testid="scenario-comparison"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid^="comparison-row-"]')).toHaveLength(3)

    await wrapper.findAll('[data-testid="scenario-remove"]')[2].trigger('click')
    expect(store.scenarios).toHaveLength(2)
  })

  it('keeps the scenario definitions out of the URL while untouched and writes them once edited', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = mountPanel()
      await vi.advanceTimersByTimeAsync(500)
      expect(replace).not.toHaveBeenCalled()
      await wrapper.get('[data-testid="scenario-add"]').trigger('click')
      await vi.advanceTimersByTimeAsync(500)
      expect(replace).toHaveBeenCalledTimes(1)
      expect(Object.keys(replace.mock.calls[0][0].query)).toContain('opt')
    } finally {
      vi.useRealTimers()
    }
  })

  it('offers the three simulations for a result', async () => {
    const { wrapper } = mountPanel()
    await runSelected(wrapper)
    for (const key of ['whatIf', 'expected', 'sensitivity']) {
      await wrapper.get(`[data-testid="sim-toggle-${key}"]`).trigger('click')
    }
    expect(wrapper.find('[data-testid="sim-whatif-rows"]').exists()).toBe(false) // only one is open
    expect(wrapper.find('[data-testid="sim-sensitivity-baseline"]').exists()).toBe(true)
    await wrapper.get('[data-testid="sim-toggle-whatIf"]').trigger('click')
    expect(wrapper.find('[data-testid="sim-whatif-rows"]').exists()).toBe(true)
  })
})
