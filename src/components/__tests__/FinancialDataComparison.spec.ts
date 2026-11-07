/**
 * FinancialDataComparison: the scaling from the URL (`selectedScaling`) must already be applied when
 * the table is rendered for the first time, so that no unscaled (raw CHF) values flash.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { DataLoader } from '@/utils/DataLoader'
import { CUSTOM_SCALING_PREFIX } from '@/utils/CustomScalingFormula'
import { useFinancialDataStore } from '@/stores/financialData'
import FinancialDataComparison from '../FinancialDataComparison.vue'
import type { FinancialData, FinancialDataEntity } from '@/types/FinancialDataStructure'
import type { StatsAvailabilityInfo } from '@/types/StatsData'

// What the (stubbed) table sees every time it is rendered with data
const rendered = vi.hoisted(() => ({
  snapshots: [] as Array<{ loading: boolean; hasData: boolean; unscaled: number; total: number }>,
}))

vi.mock('../FinancialDataDisplay.vue', async () => {
  const { defineComponent, h, watch } = await import('vue')
  return {
    default: defineComponent({
      name: 'FinancialDataDisplay',
      props: {
        financialData: { type: Object, default: null },
        loading: { type: Boolean, default: false },
        error: { type: String, default: null },
        initialExpandedAll: Boolean,
        initialShowCodes: Boolean,
        initialShowZeroValues: Boolean,
        comparisonPairs: { type: Object, default: () => ({}) },
      },
      setup(props) {
        watch(
          () => props.financialData,
          (data) => {
            const entities = Array.from((data as FinancialData | null)?.entities?.values() ?? [])
            rendered.snapshots.push({
              loading: props.loading,
              hasData: !!data,
              unscaled: entities.filter((e) => e.scalingFactor === undefined).length,
              total: entities.length,
            })
          },
          { immediate: true },
        )
        return () => h('div', { 'data-testid': 'display-stub', 'data-loading': props.loading })
      },
    }),
  }
})

vi.mock('../FinancialDataScalingSelector.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      name: 'FinancialDataScalingSelector',
      props: { financialData: { type: Object, default: null }, selectedScaling: String },
      emits: ['scalingChanged', 'error'],
      setup: () => () => h('div', { 'data-testid': 'selector-stub' }),
    }),
  }
})

vi.mock('@/utils/DataLoader')
const MockedDataLoader = vi.mocked(DataLoader)

const statsLoaderMock = vi.hoisted(() => ({
  getStatsEntry: vi.fn(),
  getAvailableStats: vi.fn(),
  loadGdnData: vi.fn(),
  loadKtnData: vi.fn(),
  getBundData: vi.fn(),
}))
vi.mock('@/utils/StatsDataLoader', () => ({
  StatsDataLoader: { getInstance: vi.fn(() => statsLoaderMock) },
}))

vi.mock('@/utils/GeographicalDataLoader', () => ({
  getCantonByAbbreviation: vi.fn(),
  getMunicipalityByGdnId: vi.fn(),
}))

vi.mock('@/utils/EntitySemanticMapper', () => ({
  EntitySemanticMapper: { isCantonSpecific: vi.fn(), getCantonCodeFromEntity: vi.fn() },
}))

vi.mock('@/data/emptyFinancialDataStructure', () => ({
  createEmptyFinancialDataStructure: vi.fn(() => ({
    balanceSheet: { code: 'balance', labels: {}, values: new Map(), children: [] },
    incomeStatement: { code: 'income', labels: {}, values: new Map(), children: [] },
    entities: new Map(),
    metadata: { recordCount: 0 },
  })),
}))

const POPULATION: Record<string, number> = { '010261': 400000, '010230': 100000 }
const TWO = ['gdn/fs/010261:2022', 'gdn/fs/010230:2022']
const THREE = [...TWO, 'gdn/fs/010156:2022']

const popStat: StatsAvailabilityInfo = {
  id: 'pop',
  name: { de: 'Bevölkerung', fr: 'Population', it: 'Popolazione', en: 'Population' },
  unit: { de: 'Personen', fr: 'Personnes', it: 'Persone', en: 'Persons' },
  type: 'scaling',
  description: { de: 'Einwohner', fr: 'Habitants', it: 'Abitanti', en: 'Inhabitants' },
  availableKtnYears: [2022],
  availableGdnYears: [2022],
  source: 'BFS',
  lastUpdate: '2023-01-01',
}

const createEntity = (
  source: string,
  model: string,
  entity: string,
  year: string,
): FinancialDataEntity => ({
  code: `${source}/${model}/${entity}:${year}`,
  name: { de: entity, fr: entity, it: entity, en: entity },
  description: { de: entity, fr: entity, it: entity, en: entity },
  metadata: { source: 'test', loadedAt: '2023-01-01T00:00:00Z', recordCount: 1 },
  year,
  model,
  source,
})

let loader: { loadAndIntegrateFinancialData: ReturnType<typeof vi.fn> }

const factors = (store: ReturnType<typeof useFinancialDataStore>) =>
  Object.fromEntries(
    Array.from(store.combinedFinancialData?.entities.values() ?? []).map((e) => [
      e.code,
      e.scalingFactor,
    ]),
  )

const mountComparison = (props: {
  datasets: string[]
  selectedScaling?: string | null
  comparisonPairs?: Record<string, string[]>
}) => mount(FinancialDataComparison, { props })

const waitForLoaded = async (store: ReturnType<typeof useFinancialDataStore>, count: number) => {
  await vi.waitFor(
    () => {
      expect(store.loading).toBe(false)
      expect(store.combinedFinancialData?.entities.size).toBe(count)
    },
    { timeout: 2000 },
  )
}

/** Snapshots in which a table with data could actually be seen by the user. */
const visibleTables = () => rendered.snapshots.filter((s) => s.hasData && !s.loading)

describe('FinancialDataComparison scaling on first render', () => {
  let store: ReturnType<typeof useFinancialDataStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useFinancialDataStore()
    vi.clearAllMocks()
    rendered.snapshots.length = 0

    statsLoaderMock.getStatsEntry.mockReset()
    statsLoaderMock.getAvailableStats.mockReset()
    statsLoaderMock.loadGdnData.mockReset()
    statsLoaderMock.getStatsEntry.mockImplementation(async (id: string) =>
      id === 'pop' ? { id: 'pop', name: popStat.name, unit: popStat.unit } : null,
    )
    statsLoaderMock.getAvailableStats.mockResolvedValue([popStat])
    statsLoaderMock.loadGdnData.mockImplementation(
      async (_id: string, _year: number, options: { geoIds: string[] }) => ({
        data: options.geoIds.map((key) => ({ key, value: POPULATION[key] ?? 5000 })),
      }),
    )

    loader = {
      loadAndIntegrateFinancialData: vi.fn(
        async (
          entity: string,
          model: string,
          year: string,
          data: FinancialData,
          source: string,
        ) => {
          data.entities.set(
            `${source}/${model}/${entity}:${year}`,
            createEntity(source, model, entity, year),
          )
        },
      ),
    }
    MockedDataLoader.mockImplementation(() => loader as unknown as DataLoader)
  })

  it('shows a loading placeholder first, then a table that is already scaled', async () => {
    const wrapper = mountComparison({ datasets: TWO, selectedScaling: 'pop' })

    // Before the (debounced) load has even started the skeleton is shown, never a stale table
    expect(wrapper.find('[data-testid="display-stub"]').attributes('data-loading')).toBe('true')

    await waitForLoaded(store, 2)
    await wrapper.vm.$nextTick()

    expect(visibleTables().length).toBeGreaterThan(0)
    expect(visibleTables().every((s) => s.unscaled === 0)).toBe(true)
    expect(factors(store)).toEqual({
      'gdn/fs/010261:2022': 400000,
      'gdn/fs/010230:2022': 100000,
    })
    expect(wrapper.find('[data-testid="display-stub"]').attributes('data-loading')).toBe('false')
    expect(wrapper.find('[data-testid="selector-stub"]').exists()).toBe(true)
  })

  it('applies a custom formula from the URL before the table is shown', async () => {
    const wrapper = mountComparison({
      datasets: TWO,
      selectedScaling: `${CUSTOM_SCALING_PREFIX}pop/1000`,
    })

    await waitForLoaded(store, 2)
    await wrapper.vm.$nextTick()

    expect(visibleTables().length).toBeGreaterThan(0)
    expect(visibleTables().every((s) => s.unscaled === 0)).toBe(true)
    expect(factors(store)).toEqual({ 'gdn/fs/010261:2022': 400, 'gdn/fs/010230:2022': 100 })
  })

  it('renders raw values when the URL has no scaling', async () => {
    const wrapper = mountComparison({ datasets: TWO, selectedScaling: null })

    await waitForLoaded(store, 2)
    await wrapper.vm.$nextTick()

    expect(visibleTables().every((s) => s.unscaled === s.total)).toBe(true)
    expect(statsLoaderMock.getStatsEntry).not.toHaveBeenCalled()
  })

  it('does not leak a scaling that a previous visit left in the store', async () => {
    store.currentScalingId = 'pop'

    const wrapper = mountComparison({ datasets: TWO, selectedScaling: null })
    await waitForLoaded(store, 2)
    await wrapper.vm.$nextTick()

    expect(store.currentScalingId).toBeNull()
    expect(visibleTables().every((s) => s.unscaled === s.total)).toBe(true)
  })

  it('keeps the scaling when the selected datasets change', async () => {
    const wrapper = mountComparison({ datasets: TWO, selectedScaling: 'pop' })
    await waitForLoaded(store, 2)

    await wrapper.setProps({ datasets: THREE })
    await waitForLoaded(store, 3)
    await wrapper.vm.$nextTick()

    expect(factors(store)).toEqual({
      'gdn/fs/010261:2022': 400000,
      'gdn/fs/010230:2022': 100000,
      'gdn/fs/010156:2022': 5000,
    })
    expect(visibleTables().every((s) => s.unscaled === 0)).toBe(true)
  })

  it('applies a scaling chosen in the selector and reports it to the parent', async () => {
    const wrapper = mountComparison({ datasets: TWO, selectedScaling: null })
    await waitForLoaded(store, 2)
    await wrapper.vm.$nextTick()

    const selector = wrapper.findComponent({ name: 'FinancialDataScalingSelector' })
    selector.vm.$emit('scalingChanged', 'pop')
    await vi.waitFor(() => expect(factors(store)['gdn/fs/010261:2022']).toBe(400000))

    expect(wrapper.emitted('scalingChanged')).toContainEqual(['pop'])

    // ... and removing it again
    selector.vm.$emit('scalingChanged', null)
    await vi.waitFor(() => expect(factors(store)['gdn/fs/010261:2022']).toBeUndefined())
    expect(store.currentScalingId).toBeNull()
  })

  it('removes the scaling when the parent drops it (browser back)', async () => {
    const wrapper = mountComparison({ datasets: TWO, selectedScaling: 'pop' })
    await waitForLoaded(store, 2)
    expect(factors(store)['gdn/fs/010261:2022']).toBe(400000)

    await wrapper.setProps({ selectedScaling: null })

    await vi.waitFor(() => expect(factors(store)['gdn/fs/010261:2022']).toBeUndefined())
    expect(store.currentScalingId).toBeNull()
    await vi.waitFor(() => expect(wrapper.emitted('scalingChanged')).toContainEqual([null]))
  })

  it('emits dataLoaded once the data is there', async () => {
    const wrapper = mountComparison({ datasets: TWO, selectedScaling: 'pop' })
    await waitForLoaded(store, 2)
    await vi.waitFor(() => expect(wrapper.emitted('dataLoaded')).toBeTruthy())
    expect(wrapper.emitted('dataLoaded')![0]).toEqual([2])
  })

  it('does not load anything when it is unmounted during the debounce', async () => {
    const wrapper = mountComparison({ datasets: TWO, selectedScaling: 'pop' })
    wrapper.unmount()

    await new Promise((resolve) => setTimeout(resolve, 120))

    expect(loader.loadAndIntegrateFinancialData).not.toHaveBeenCalled()
  })
})
