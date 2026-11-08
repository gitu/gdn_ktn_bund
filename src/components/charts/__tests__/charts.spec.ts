import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '../../../i18n/locales/en.json'
import BarChart from '../BarChart.vue'
import ShareBarChart from '../ShareBarChart.vue'
import LineChart from '../LineChart.vue'
import ChartCard from '../ChartCard.vue'
import { seriesColor, tooltipStyle } from '../chartTypes'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const global = { plugins: [i18n] }
const format = (value: number) => `${value} CHF`
const tick = (value: number) => String(value)

const PLACES = [
  { key: 'a', label: 'Aarau' },
  { key: 'b', label: 'Baden' },
]

describe('BarChart', () => {
  const mountBars = (values: Record<string, Record<string, number | undefined>>, extra = {}) =>
    mount(BarChart, {
      props: {
        categories: PLACES,
        series: [
          { key: 'rev', label: 'Revenue', ...seriesColor(0) },
          { key: 'exp', label: 'Expenses', ...seriesColor(1) },
        ],
        values,
        formatLabel: tick,
        formatValue: format,
        formatTick: tick,
        ...extra,
      },
      global,
    })

  it('draws one bar per place and series, from zero, with the value at the tip', () => {
    const wrapper = mountBars({ a: { rev: 500, exp: 250 }, b: { rev: 1000, exp: undefined } })
    const bars = wrapper.findAll('[data-testid="bar"]')
    expect(bars).toHaveLength(3)
    expect(bars[0].attributes('style')).toContain('left: 0%')
    expect(bars[0].attributes('style')).toContain('width: max(2px, 50%)')
    expect(bars[0].attributes('aria-label')).toBe('Aarau, Revenue, 500 CHF')
    expect(wrapper.findAll('.bar-value').map((v) => v.text())).toEqual([
      '500',
      '250',
      '1000',
      'no figure',
    ])
  })

  it('grows negative values to the left in the "negative" colour', () => {
    const wrapper = mountBars(
      { a: { rev: -200 }, b: { rev: 600 } },
      {
        series: [{ key: 'rev', label: 'Result', ...seriesColor(0) }],
        colorBySign: true,
        signLabels: ['Surplus', 'Deficit'],
      },
    )
    const [negative, positive] = wrapper.findAll('[data-testid="bar"]')
    expect(negative.classes()).toContain('is-negative')
    expect(negative.attributes('style')).toContain('var(--gk-chart-neg)')
    expect(negative.attributes('aria-label')).toContain('Deficit')
    expect(positive.attributes('style')).toContain('var(--gk-chart-pos)')
  })

  it('shows a tooltip on focus and hides it on blur', async () => {
    const wrapper = mountBars({ a: { rev: 500, exp: 250 }, b: { rev: 1000, exp: 900 } })
    const bar = wrapper.findAll('[data-testid="bar"]')[3]
    await bar.trigger('focus')
    const tooltip = wrapper.find('[data-testid="chart-tooltip"]')
    expect(tooltip.text()).toContain('Baden')
    expect(tooltip.text()).toContain('900 CHF')
    expect(tooltip.text()).toContain('Expenses')
    await bar.trigger('blur')
    expect(wrapper.find('[data-testid="chart-tooltip"]').exists()).toBe(false)
  })
})

describe('ShareBarChart', () => {
  it('sizes the segments by share and labels only those wide enough', async () => {
    const wrapper = mount(ShareBarChart, {
      props: {
        categories: PLACES.slice(0, 1),
        groups: [
          { key: 'tax', label: 'Taxes', ...seriesColor(0) },
          { key: 'fee', label: 'Fees', ...seriesColor(1) },
          { key: 'other', label: 'Other', ...seriesColor(2) },
        ],
        shares: {
          a: [
            { key: 'tax', value: 900, share: 0.9 },
            { key: 'fee', value: 100, share: 0.1 },
            { key: 'other', value: 0, share: 0 },
          ],
        },
        formatShare: (share: number) => `${Math.round(share * 100)}%`,
        formatValue: format,
      },
      global,
    })
    const segments = wrapper.findAll('[data-testid="share-segment"]')
    // Empty groups take no room
    expect(segments).toHaveLength(2)
    expect(segments[0].attributes('style')).toContain('flex-grow: 0.9')
    expect(segments[0].text()).toBe('90%')
    expect(segments[1].text()).toBe('')
    expect(segments[1].attributes('aria-label')).toBe('Aarau, Fees, 10%, 100 CHF')

    await segments[1].trigger('focus')
    expect(wrapper.find('[data-testid="chart-tooltip"]').text()).toContain('10% · 100 CHF')
  })
})

describe('LineChart', () => {
  const mountLines = () =>
    mount(LineChart, {
      props: {
        x: ['2021', '2022', '2023', '2024'],
        series: [
          { key: 'a', label: 'Aarau', ...seriesColor(0), values: [10, 12, undefined, 14] },
          { key: 'b', label: 'Baden', ...seriesColor(1), values: [20, 18, 17, 16] },
        ],
        formatValue: format,
        formatTick: tick,
        label: 'Expenses',
      },
      global,
      attachTo: document.body,
    })

  it('breaks a line where a year is missing', () => {
    const wrapper = mountLines()
    const path = wrapper.find('[data-testid="line-a"] path').attributes('d')!
    // Two pieces: 2021-2022, then 2024 on its own (drawn as a dot)
    expect(path.match(/M/g)).toHaveLength(2)
    expect(wrapper.findAll('[data-testid="line-a"] circle')).toHaveLength(1)
    wrapper.unmount()
  })

  it('reads all series of a year with the keyboard, largest first', async () => {
    const wrapper = mountLines()
    const chart = wrapper.find('[data-testid="line-chart"]')
    expect(chart.attributes('aria-label')).toContain('arrow keys')

    await chart.trigger('keydown', { key: 'ArrowRight' })
    let tooltip = wrapper.find('[data-testid="chart-tooltip"]')
    expect(tooltip.find('.tooltip-title').text()).toBe('2021')
    expect(tooltip.findAll('.tooltip-value').map((v) => v.text())).toEqual(['20 CHF', '10 CHF'])

    await chart.trigger('keydown', { key: 'End' })
    await chart.trigger('keydown', { key: 'ArrowLeft' })
    tooltip = wrapper.find('[data-testid="chart-tooltip"]')
    expect(tooltip.find('.tooltip-title').text()).toBe('2023')
    // Aarau has no value in 2023
    expect(tooltip.findAll('.tooltip-value').map((v) => v.text())).toEqual(['17 CHF'])

    await chart.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[data-testid="chart-tooltip"]').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('ChartCard', () => {
  it('switches between the chart and its table twin', async () => {
    const wrapper = mount(ChartCard, {
      props: {
        title: 'Revenue',
        legend: [
          { key: 'a', label: 'One', color: 'red' },
          { key: 'b', label: 'Two', color: 'blue' },
        ],
        table: { head: ['Place', 'Value'], rows: [{ key: 'a', label: 'Aarau', cells: ['5'] }] },
      },
      slots: { default: '<div class="the-chart">chart</div>' },
      global,
    })
    expect(wrapper.findAll('.chart-legend li')).toHaveLength(2)
    const toggle = wrapper.find('[data-testid="chart-table-toggle"]')
    expect(toggle.attributes('aria-pressed')).toBe('false')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-testid="chart-table"]').text()).toContain('Aarau')
    expect(wrapper.find('.chart-body').attributes('style')).toContain('display: none')
  })

  it('needs no legend for a single series', () => {
    const wrapper = mount(ChartCard, {
      props: { title: 'Result', legend: [{ key: 'a', label: 'One', color: 'red' }] },
      global,
    })
    expect(wrapper.find('.chart-legend').exists()).toBe(false)
  })
})

describe('tooltipStyle', () => {
  const base = { y: 40, width: 400, title: '2024', rows: [] }

  it('anchors a tooltip near the right edge to that edge, so it is never squeezed', () => {
    const style = tooltipStyle({ ...base, x: 395, side: 'end' })
    expect(style.right).toBe('0px')
    expect(style.left).toBeUndefined()
    expect(style.maxWidth).toBe('min(18rem, 400px)')
  })

  it('anchors a tooltip near the left edge to the left', () => {
    const style = tooltipStyle({ ...base, x: 5, side: 'start' })
    expect(style.left).toBe('0px')
    expect(style.right).toBeUndefined()
  })

  it('puts a line chart tooltip beside the crosshair, on the side with more room', () => {
    const right = tooltipStyle({ ...base, x: 380, side: 'end', beside: true })
    expect(right.right).toBe('32px')
    expect(right.maxWidth).toBe('min(18rem, 368px)')
    expect(right.transform).toBeUndefined()

    const left = tooltipStyle({ ...base, x: 20, side: 'start', beside: true, valign: 'bottom' })
    expect(left.left).toBe('32px')
    // grows upwards from the bottom of the plot
    expect(left.transform).toBe('translateY(-100%)')
  })
})
