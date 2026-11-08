import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '../../../i18n/locales/en.json'
import ScalingStep from '../ScalingStep.vue'
import type { StatsAvailabilityInfo } from '@/types/StatsData'

const calculate = vi.hoisted(() => vi.fn())
vi.mock('@/utils/ScalingCalculator', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/ScalingCalculator')>()),
  ScalingCalculator: class {
    calculate = calculate
  },
}))
// The optimiser is not part of these tests
vi.mock('../../optimization/OptimizerPanel.vue', () => ({
  default: { name: 'OptimizerPanel', template: '<div data-testid="optimizer-panel" />' },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const stat = (id: string, unit = 'inhabitants'): StatsAvailabilityInfo => ({
  id,
  name: { de: id, fr: id, it: id, en: id },
  unit: { de: unit, fr: unit, it: unit, en: unit },
  type: 'scaling',
  description: { de: id, fr: id, it: id, en: id },
  availableKtnYears: [],
  availableGdnYears: [],
  source: 'BFS',
  lastUpdate: '2026-01-01',
})
const STATS = ['pop', 'workplaces', 'total_area', 'pop_65plus'].map((id) => stat(id))
const DATASETS = ['gdn/fs/010261:2023', 'gdn/fs/010261:2024', 'std/fs/ktn_zh:2024']

function mountStep(scaling: string | null) {
  const state = { scaling }
  const wrapper = mount(ScalingStep, {
    props: {
      datasets: DATASETS,
      stats: STATS,
      financialData: null,
      placeName: (place: string) => ({ 'gdn/fs/010261': 'Zürich' })[place] ?? 'Canton',
      modelValue: scaling,
      'onUpdate:modelValue': (value: string | null) => {
        state.scaling = value
        return wrapper.setProps({ modelValue: value })
      },
    },
    global: { plugins: [i18n], stubs: { Button: false, InputText: false } },
  })
  return { wrapper, state }
}

describe('ScalingStep', () => {
  beforeEach(() => {
    calculate.mockReset()
    calculate.mockImplementation(async (_id: string, ids: string[]) => ({
      ok: true,
      label: { de: '', fr: '', it: '', en: '' },
      outcomes: new Map(
        ids.map((id) => [
          id,
          {
            datasetId: id,
            factor: id.startsWith('std') ? null : 440000,
            // The 2023 column uses statistics from 2024
            inputs: [{ statId: 'pop', value: 440000, year: 2024 }],
          },
        ]),
      ),
    }))
  })

  it('sets a statistic with one tap and shows what each column is divided by', async () => {
    const { wrapper, state } = mountStep(null)
    expect(wrapper.find('[data-testid="scaling-preview"]').exists()).toBe(false)

    await wrapper.find('[data-testid="scaling-choice-pop"] input').trigger('change')
    expect(state.scaling).toBe('pop')
    await flushPromises()

    expect(calculate).toHaveBeenCalledWith('pop', DATASETS)
    const preview = wrapper.find('[data-testid="scaling-preview"]')
    const rows = preview.findAll('tbody tr').map((row) => row.text())
    expect(rows[0]).toContain('Zürich')
    expect(rows[0]).toContain('440,000')
    // The statistics year is marked where it differs from the year of the finances
    expect(preview.find('.year-mark').text()).toBe('2024')
    expect(rows[1]).toContain('missing')
    expect(preview.text()).toContain('nearest year')
  })

  it('builds a formula from buttons and applies it only when it is valid', async () => {
    const { wrapper, state } = mountStep(null)
    await wrapper.find('[data-testid="scaling-choice-custom"] input').trigger('change')
    // Choosing the card alone does not change the numbers yet
    expect(state.scaling).toBeNull()

    const input = wrapper.find('[data-testid="custom-formula-input"]')
    await input.setValue('pop+')
    expect(wrapper.find('[data-testid="formula-status"]').classes()).toContain('is-invalid')
    expect(wrapper.find('[data-testid="apply-formula"]').attributes('disabled')).toBeDefined()

    await wrapper
      .findAll('.token')
      .find((token) => token.text() === 'Workplaces')!
      .trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('pop+workplaces')
    expect(wrapper.find('[data-testid="formula-status"]').classes()).toContain('is-valid')

    await wrapper.find('[data-testid="apply-formula"]').trigger('click')
    expect(state.scaling).toBe('custom:pop+workplaces')
    expect(wrapper.find('[data-testid="scaling-choice-custom"]').classes()).toContain('is-active')
  })

  it('opens the optimiser as its own choice', async () => {
    const { wrapper } = mountStep('pop')
    await wrapper.find('[data-testid="scaling-choice-optimize"] input').trigger('change')
    expect(wrapper.find('[data-testid="optimizer-step"]').exists()).toBe(true)
    // Without loaded finances it says it is waiting for them
    expect(wrapper.find('[data-testid="optimizer-step"]').text()).toContain('Loading')
  })

  it('goes back to francs', async () => {
    const { wrapper, state } = mountStep('pop')
    await wrapper.find('[data-testid="scaling-choice-none"] input').trigger('change')
    expect(state.scaling).toBeNull()
    expect(wrapper.find('[data-testid="scaling-preview"]').exists()).toBe(false)
  })
})
