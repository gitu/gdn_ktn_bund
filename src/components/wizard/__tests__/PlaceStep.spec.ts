import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '../../../i18n/locales/en.json'
import PlaceStep from '../PlaceStep.vue'
import type { AvailableDataEntry } from '@/types/DataStructures'
import type { SuggestionContext } from '@/utils/PlaceSuggestions'

const labels = (text: string) => ({ de: text, fr: text, it: text, en: text })
const entry = (type: 'gdn' | 'std', entityCode: string, name: string): AvailableDataEntry => ({
  id: `${type}_${entityCode}`,
  type,
  entityCode,
  displayName: labels(name),
  description: labels(name),
  availableYears: ['2024'],
})
const CATALOG = [
  entry('gdn', '010261', 'Zürich'),
  entry('gdn', '010230', 'Winterthur'),
  entry('gdn', '010066', 'Uster'),
  entry('std', 'ktn_zh', 'Canton of Zurich'),
  entry('std', 'gdn', 'All municipalities'),
]

vi.mock('@/utils/PlaceSuggestions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/PlaceSuggestions')>()),
  loadSuggestionContext: vi.fn(
    async (catalog: AvailableDataEntry[]): Promise<SuggestionContext> => ({
      catalog,
      municipalities: new Map([
        ['010261', { canton: 'zh', population: 440000 }],
        ['010230', { canton: 'zh', population: 120000 }],
        ['010066', { canton: 'zh', population: 36000 }],
      ]),
      cantons: new Map([['zh', 1600000]]),
      rests: new Map(),
    }),
  ),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function mountStep(initial: string[] = []) {
  let model = initial
  const wrapper = mount(PlaceStep, {
    props: {
      catalog: CATALOG,
      modelValue: model,
      'onUpdate:modelValue': (value: string[]) => {
        model = value
        return wrapper.setProps({ modelValue: value })
      },
    },
    global: { plugins: [i18n], stubs: { Button: false, InputText: false } },
  })
  return { wrapper, model: () => model }
}

describe('PlaceStep', () => {
  it('starts by asking for a starting place, then suggests comparisons for it', async () => {
    const { wrapper, model } = mountStep()
    expect(wrapper.text()).toContain('Where do you want to start?')

    await wrapper.find('button[aria-label="Start with Winterthur"]').trigger('click')
    await flushPromises()
    expect(model()).toEqual(['gdn/fs/010230'])
    expect(wrapper.find('[data-testid="start-bar"]').text()).toContain('Winterthur')

    const similar = wrapper.find('[data-testid="suggestions-similarInCanton"]')
    expect(similar.find('h4').text()).toBe('Similar-sized municipalities – Canton of Zurich')
    // Uster (36,000) is closer in size to Winterthur (120,000) than Zürich (440,000)
    expect(similar.findAll('.suggestion-name').map((n) => n.text())).toEqual(['Uster', 'Zürich'])

    await wrapper.find('[data-testid="suggestions-similarInCanton-all"]').trigger('click')
    expect(model()).toEqual(['gdn/fs/010230', 'gdn/fs/010066', 'gdn/fs/010261'])
    await wrapper.find('[data-testid="suggestions-similarInCanton-all"]').trigger('click')
    expect(model()).toEqual(['gdn/fs/010230'])
  })

  it('switches to a free search and keeps the selection', async () => {
    const { wrapper, model } = mountStep(['gdn/fs/010230'])
    await wrapper.find('[data-testid="place-mode-custom"]').trigger('click')
    await wrapper.find('button[aria-label="Add Canton of Zurich"]').trigger('click')
    expect(model()).toEqual(['gdn/fs/010230', 'std/fs/ktn_zh'])
  })

  it('a new starting place replaces the old one and keeps the others', async () => {
    const { wrapper, model } = mountStep(['gdn/fs/010230', 'std/fs/ktn_zh'])
    await wrapper.find('[data-testid="change-start"]').trigger('click')
    await wrapper.find('button[aria-label="Start with Uster"]').trigger('click')
    expect(model()).toEqual(['gdn/fs/010066', 'std/fs/ktn_zh'])
  })

  it('lets the user skip the starting place and choose everything', async () => {
    const { wrapper } = mountStep()
    await wrapper.find('[data-testid="custom-mode"]').trigger('click')
    expect(wrapper.find('[data-testid="place-mode-custom"]').attributes('aria-selected')).toBe(
      'true',
    )
    expect(wrapper.find('button[aria-label="Add Zürich"]').exists()).toBe(true)
  })
})
