/**
 * DatasetSelector on a phone: card list instead of the table, chips for the selection.
 * Mounts the real component with PrimeVue (the sibling spec stubs PrimeVue away).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ToastService from 'primevue/toastservice'
import en from '../../i18n/locales/en.json'
import DatasetSelector from '../DatasetSelector.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

/** Mounts and waits until the catalogue (a dynamic JSON import) has rendered its first cards. */
async function mountSelector(): Promise<{ wrapper: VueWrapper; model: () => string[] }> {
  let current: string[] = []
  const wrapper = mount(DatasetSelector, {
    props: {
      modelValue: current,
      'onUpdate:modelValue': (value: string[]) => {
        current = value
        return wrapper.setProps({ modelValue: value })
      },
    },
    // test-setup.ts stubs these globally; the real ones render labels and aria attributes
    global: {
      plugins: [i18n, ToastService],
      stubs: { Button: false, Select: false, InputText: false },
    },
  })
  await vi.waitFor(() => expect(wrapper.find('.dataset-card').exists()).toBe(true))
  return { wrapper, model: () => current }
}

describe('DatasetSelector (phone)', () => {
  const original = window.matchMedia

  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    window.matchMedia = original
  })

  it('renders a paged card list rather than a table and grows on demand', async () => {
    const { wrapper } = await mountSelector()

    expect(wrapper.find('[data-testid="dataset-cards"]').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.findAll('.dataset-card')).toHaveLength(10)

    const showMore = wrapper.find('.show-more')
    expect(showMore.text()).toMatch(/Show \d+ more/)
    await showMore.trigger('click')
    expect(wrapper.findAll('.dataset-card')).toHaveLength(20)
  })

  it('narrows the list with the search box', async () => {
    const { wrapper } = await mountSelector()

    await wrapper.find('input').setValue('Aarau')
    const names = wrapper.findAll('.card-name').map((n) => n.text())
    expect(names.length).toBeGreaterThan(0)
    expect(names.every((n) => n.toLowerCase().includes('aarau'))).toBe(true)
  })

  it('adds a dataset as a chip and removes it again from the chip', async () => {
    const { wrapper, model } = await mountSelector()

    await wrapper.find('.card-add').trigger('click')
    expect(wrapper.findAll('.selected-chip')).toHaveLength(1)
    expect(model()).toHaveLength(1)

    await wrapper.find('.chip-remove').trigger('click')
    expect(wrapper.findAll('.selected-chip')).toHaveLength(0)
    expect(model()).toEqual([])
  })

  it('gives the chip remove button an accessible name', async () => {
    const { wrapper } = await mountSelector()
    await wrapper.find('.card-add').trigger('click')

    expect(wrapper.find('.chip-remove').attributes('aria-label')).toMatch(/^Remove /)
  })
})
