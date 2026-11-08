import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '../../../i18n/locales/en.json'
import FinancialCharts from '../FinancialCharts.vue'
import type {
  FinancialData,
  FinancialDataEntity,
  FinancialDataNode,
} from '@/types/FinancialDataStructure'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const labels = (text: string) => ({ de: text, fr: text, it: text, en: text })

function node(code: string, values: Record<string, number>, children: FinancialDataNode[] = []) {
  return {
    code,
    labels: labels(`Account ${code}`),
    values: new Map(Object.entries(values).map(([id, value]) => [id, { value, unit: 'CHF' }])),
    children,
  }
}

function entity(id: string, name: string, scalingFactor?: number): FinancialDataEntity {
  return {
    code: id,
    name: labels(name),
    description: labels(name),
    metadata: { source: 'test', loadedAt: '', recordCount: 0 },
    year: id.split(':')[1],
    model: 'fs',
    source: id.split('/')[0],
    scalingFactor,
    scalingMode: scalingFactor ? 'divide' : undefined,
  }
}

/** Columns: name, id, revenue, expenses, divisor */
function data(columns: [string, string, number, number, number?][]): FinancialData {
  const values = (pick: (c: (typeof columns)[number]) => number) =>
    Object.fromEntries(columns.map((c) => [c[1], pick(c)]))
  return {
    balanceSheet: node('root', {}, []),
    incomeStatement: node(
      'root',
      values((c) => c[2] - c[3]),
      [
        node(
          '3',
          values((c) => c[3]),
          [
            node(
              '30',
              values((c) => c[3]),
            ),
          ],
        ),
        node(
          '4',
          values((c) => c[2]),
          [
            node(
              '40',
              values((c) => c[2]),
            ),
          ],
        ),
      ],
    ),
    entities: new Map(columns.map((c) => [c[1], entity(c[1], c[0], c[4])])),
    metadata: { source: 'test', loadedAt: '', recordCount: 0 },
  }
}

const mountCharts = (financialData: FinancialData, scaled = false) =>
  mount(FinancialCharts, {
    props: { data: financialData, unitLabel: 'in francs', scaled },
    global: { plugins: [i18n], stubs: { Button: false } },
  })

describe('FinancialCharts', () => {
  it('shows one year: the snapshot charts and the account comparison, no trend', () => {
    const wrapper = mountCharts(
      data([
        ['Aarau', 'gdn/fs/004001:2024', 100, 90],
        ['Baden', 'gdn/fs/004021:2024', 200, 210],
      ]),
    )
    expect(wrapper.find('[data-testid="chart-trend"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="focus-year"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="chart-measure"]').exists()).toBe(true)

    const result = wrapper.find('[data-testid="chart-result"]')
    expect(result.find('[data-testid="bar-group-gdn/fs/004021"] .bar').classes()).toContain(
      'is-negative',
    )
    expect(wrapper.find('[data-testid="chart-revenue-expenses"]').text()).toContain('2024')
  })

  it('shows several years as a trend, one line per place, and snapshots for one year', async () => {
    const wrapper = mountCharts(
      data([
        ['Aarau', 'gdn/fs/004001:2023', 100, 90],
        ['Aarau', 'gdn/fs/004001:2024', 110, 95],
        ['Baden', 'gdn/fs/004021:2023', 200, 210],
        ['Baden', 'gdn/fs/004021:2024', 220, 215],
      ]),
    )
    const trend = wrapper.find('[data-testid="chart-trend"]')
    expect(trend.exists()).toBe(true)
    expect(trend.text()).toContain('2023 to 2024')
    expect(trend.findAll('.series-line')).toHaveLength(2)

    // The snapshot charts follow the focus year, the newest by default
    const revenueExpenses = () => wrapper.find('[data-testid="chart-revenue-expenses"]')
    expect(revenueExpenses().text()).toContain('2024')
    await wrapper
      .find('[data-testid="focus-year"] button[aria-label="Previous year"]')
      .trigger('click')
    expect(revenueExpenses().text()).toContain('2023')

    // Switching the figure redraws the trend
    await trend.find('[data-testid="measure-4"]').trigger('click')
    expect(wrapper.find('[data-testid="chart-trend"] h3').text()).toContain('Revenue')
  })

  it('leaves columns without a divisor out of scaled charts and says so', () => {
    const wrapper = mountCharts(
      data([
        ['Aarau', 'gdn/fs/004001:2024', 100, 90, 10],
        ['Social insurance', 'std/fs/sv_ahv:2024', 500, 450],
      ]),
      true,
    )
    expect(wrapper.find('[data-testid="charts-skipped"]').text()).toContain('Social insurance 2024')
    expect(wrapper.findAll('[data-testid="chart-revenue-expenses"] .bar-group')).toHaveLength(1)
  })
})
