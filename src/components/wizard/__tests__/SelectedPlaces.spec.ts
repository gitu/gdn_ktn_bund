import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '../../../i18n/locales/en.json'
import SelectedPlaces from '../SelectedPlaces.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const NAMES: Record<string, string> = {
  'gdn/fs/010261': 'Zürich',
  'std/fs/ktn_zh': 'Canton of Zurich',
  'std/fs/bund': 'Federal government',
}

function mountSelection(initial: string[]) {
  let model = initial
  const wrapper = mount(SelectedPlaces, {
    props: {
      placeName: (place: string) => NAMES[place] ?? place,
      markStart: true,
      modelValue: model,
      'onUpdate:modelValue': (value: string[]) => {
        model = value
        return wrapper.setProps({ modelValue: value })
      },
    },
    global: { plugins: [i18n], stubs: { Button: false } },
  })
  return { wrapper, model: () => model }
}

describe('SelectedPlaces', () => {
  it('lists the places in order and marks the starting place', () => {
    const { wrapper } = mountSelection(['gdn/fs/010261', 'std/fs/ktn_zh', 'std/fs/bund'])
    const items = wrapper.findAll('[data-testid="selected-places"] li')
    expect(items.map((item) => item.find('.selection-name').text())).toEqual([
      'Zürich Start',
      'Canton of Zurich',
      'Federal government',
    ])
  })

  it('moves and removes places', async () => {
    const { wrapper, model } = mountSelection(['gdn/fs/010261', 'std/fs/ktn_zh', 'std/fs/bund'])
    await wrapper.find('button[aria-label="Move Federal government up"]').trigger('click')
    expect(model()).toEqual(['gdn/fs/010261', 'std/fs/bund', 'std/fs/ktn_zh'])

    await wrapper.findAll('[data-testid="remove-place"]')[0].trigger('click')
    expect(model()).toEqual(['std/fs/bund', 'std/fs/ktn_zh'])
  })

  it('first and last places cannot move further', () => {
    const { wrapper } = mountSelection(['gdn/fs/010261', 'std/fs/ktn_zh'])
    expect(wrapper.find('button[aria-label="Move Zürich up"]').attributes('disabled')).toBeDefined()
    expect(
      wrapper.find('button[aria-label="Move Canton of Zurich down"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('says when nothing is chosen yet', () => {
    const { wrapper } = mountSelection([])
    expect(wrapper.find('.selection').classes()).toContain('is-empty')
    expect(wrapper.text()).toContain('Nothing chosen yet')
  })
})
