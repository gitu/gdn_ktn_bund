import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '../../../i18n/locales/en.json'
import YearPicker, { type YearMode } from '../YearPicker.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const YEARS: Record<string, string[]> = {
  'gdn/fs/010261': ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
  'gdn/fs/010230': ['2022', '2023', '2024'],
}

function mountPicker(years: string[], mode: YearMode) {
  const state = { years, mode }
  const wrapper = mount(YearPicker, {
    props: {
      places: Object.keys(YEARS),
      available: (place: string) => YEARS[place],
      years,
      mode,
      'onUpdate:years': (value: string[]) => {
        state.years = value
        return wrapper.setProps({ years: value })
      },
      'onUpdate:mode': (value: YearMode) => {
        state.mode = value
        return wrapper.setProps({ mode: value })
      },
    },
    global: { plugins: [i18n], stubs: { Button: false } },
  })
  return { wrapper, state }
}

describe('YearPicker', () => {
  it('shows every year with how many places have it, newest first', () => {
    const { wrapper } = mountPicker(['2024'], 'single')
    const chips = wrapper.findAll('.year-chip')
    expect(chips.map((c) => c.find('.year-value').text())).toEqual([
      '2024',
      '2023',
      '2022',
      '2021',
      '2020',
      '2019',
      '2018',
    ])
    expect(chips[0].text()).toContain('all places')
    expect(chips[3].text()).toContain('1 of 2')
    expect(chips[3].classes()).toContain('is-partial')
  })

  it('picks exactly one year in single mode', async () => {
    const { wrapper, state } = mountPicker(['2024'], 'single')
    await wrapper.find('[data-testid="year-2022"]').trigger('click')
    expect(state.years).toEqual(['2022'])
    expect(wrapper.find('[data-testid="year-2022"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-testid="year-summary"]').text()).toContain('2 columns')
  })

  it('toggles years in multi mode and offers presets', async () => {
    const { wrapper, state } = mountPicker(['2023', '2024'], 'multi')
    await wrapper.find('[data-testid="year-2020"]').trigger('click')
    expect(state.years).toEqual(['2020', '2023', '2024'])
    await wrapper.find('[data-testid="year-2023"]').trigger('click')
    expect(state.years).toEqual(['2020', '2024'])

    const all = wrapper.findAll('.preset').find((b) => b.text().startsWith('All'))!
    await all.trigger('click')
    expect(state.years).toEqual(['2018', '2019', '2020', '2021', '2022', '2023', '2024'])
    expect(wrapper.find('[data-testid="year-summary"]').text()).toContain('2018–2024')
  })

  it('starts several years with the last five and goes back to the newest one', async () => {
    const { wrapper, state } = mountPicker(['2024'], 'single')
    await wrapper.find('[data-testid="year-mode-multi"] input').setValue(true)
    expect(state.mode).toBe('multi')
    expect(state.years).toEqual(['2020', '2021', '2022', '2023', '2024'])

    await wrapper.find('[data-testid="year-mode-single"] input').setValue(true)
    expect(state.years).toEqual(['2024'])
  })
})
