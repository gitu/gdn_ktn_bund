import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '../../../i18n/locales/en.json'
import PlacePicker from '../PlacePicker.vue'
import type { AvailableDataEntry } from '@/types/DataStructures'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const labels = (text: string) => ({ de: text, fr: text, it: text, en: text })
const entry = (type: 'gdn' | 'std', entityCode: string, name: string): AvailableDataEntry => ({
  id: `${type}_${entityCode}`,
  type,
  entityCode,
  displayName: labels(name),
  description: labels(name),
  availableYears: ['2022', '2023', '2024'],
})

const CATALOG = [
  entry('gdn', '010261', 'Zürich'),
  entry('gdn', '010230', 'Winterthur'),
  entry('std', 'ktn_zh', 'Canton of Zurich'),
  entry('std', 'bund', 'Federal government'),
  entry('std', 'sv_ahv', 'Old-age insurance'),
]

function mountPicker(initial: string[] = []) {
  let model = initial
  const wrapper = mount(PlacePicker, {
    props: {
      catalog: CATALOG,
      modelValue: model,
      'onUpdate:modelValue': (value: string[]) => {
        model = value
        return wrapper.setProps({ modelValue: value })
      },
    },
    // test-setup.ts stubs these globally; the real ones render labels and aria attributes
    global: { plugins: [i18n], stubs: { Button: false, InputText: false } },
  })
  return { wrapper, model: () => model }
}

const names = (wrapper: ReturnType<typeof mountPicker>['wrapper']) =>
  wrapper.findAll('.result-name').map((n) => n.text())

describe('PlacePicker', () => {
  it('lists every place with its kind and years', () => {
    const { wrapper } = mountPicker()
    expect(names(wrapper)).toEqual([
      'Zürich',
      'Winterthur',
      'Canton of Zurich',
      'Federal government',
      'Old-age insurance',
    ])
    expect(wrapper.find('[data-testid="place-option-std_ktn_zh"]').text()).toContain('Canton')
    expect(wrapper.text()).toContain('2022–2024')
  })

  it('filters by search text and by kind', async () => {
    const { wrapper } = mountPicker()
    await wrapper.find('[data-testid="place-search"]').setValue('winter')
    expect(names(wrapper)).toEqual(['Winterthur'])

    await wrapper.find('[data-testid="place-search"]').setValue('')
    const chip = wrapper.findAll('.kind-chip').find((c) => c.text() === 'Social insurance')!
    await chip.trigger('click')
    expect(chip.attributes('aria-pressed')).toBe('true')
    expect(names(wrapper)).toEqual(['Old-age insurance'])
  })

  it('adds and removes places with the same button', async () => {
    const { wrapper, model } = mountPicker()
    const button = () => wrapper.find('[data-testid="place-option-gdn_010230"] button')

    await button().trigger('click')
    expect(model()).toEqual(['gdn/fs/010230'])
    expect(button().attributes('aria-pressed')).toBe('true')
    expect(button().attributes('aria-label')).toBe('Remove Winterthur')

    await button().trigger('click')
    expect(model()).toEqual([])
  })

  it('keeps the chosen order and lets the user change it', async () => {
    const { wrapper, model } = mountPicker(['gdn/fs/010261', 'std/fs/ktn_zh', 'std/fs/bund'])
    const selected = () =>
      wrapper.findAll('[data-testid="selected-places"] .selection-name').map((n) => n.text())
    expect(selected()).toEqual(['Zürich', 'Canton of Zurich', 'Federal government'])

    await wrapper.find('button[aria-label="Move Federal government up"]').trigger('click')
    expect(model()).toEqual(['gdn/fs/010261', 'std/fs/bund', 'std/fs/ktn_zh'])

    await wrapper.findAll('[data-testid="remove-place"]')[0].trigger('click')
    expect(model()).toEqual(['std/fs/bund', 'std/fs/ktn_zh'])
  })

  it('first and last places cannot move further', () => {
    const { wrapper } = mountPicker(['gdn/fs/010261', 'std/fs/ktn_zh'])
    expect(wrapper.find('button[aria-label="Move Zürich up"]').attributes('disabled')).toBeDefined()
    expect(
      wrapper.find('button[aria-label="Move Canton of Zurich down"]').attributes('disabled'),
    ).toBeDefined()
  })
})
