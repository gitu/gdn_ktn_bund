import { describe, it, expect, vi, beforeEach } from 'vitest'
import { watch } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useFinancialDataStore } from '../financialData'
import { DataLoader } from '@/utils/DataLoader'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { getCantonByAbbreviation } from '@/utils/GeographicalDataLoader'
import { CUSTOM_SCALING_PREFIX } from '@/utils/CustomScalingFormula'
import type { FinancialData, FinancialDataEntity } from '@/types/FinancialDataStructure'
import type { StatsAvailabilityInfo } from '@/types/StatsData'

// Create a mock type for DataLoader that allows partial implementation
type MockDataLoader = Partial<DataLoader> & {
  loadAndIntegrateFinancialData: ReturnType<typeof vi.fn>
}

// Mock DataLoader
vi.mock('@/utils/DataLoader')
const MockedDataLoader = vi.mocked(DataLoader)

// Mock StatsDataLoader: one shared instance so that individual tests can program it
const statsLoaderMock = vi.hoisted(() => ({
  getStatsEntry: vi.fn(),
  getAvailableStats: vi.fn(),
  loadGdnData: vi.fn(),
  loadKtnData: vi.fn(),
  getBundData: vi.fn(),
}))
vi.mock('@/utils/StatsDataLoader', () => ({
  StatsDataLoader: {
    getInstance: vi.fn(() => statsLoaderMock),
  },
}))

// Mock geographical data loaders
vi.mock('@/utils/GeographicalDataLoader', () => ({
  getCantonByAbbreviation: vi.fn(),
  getMunicipalityByGdnId: vi.fn(),
}))

// Mock EntitySemanticMapper
vi.mock('@/utils/EntitySemanticMapper', () => ({
  EntitySemanticMapper: {
    isCantonSpecific: vi.fn(),
    isRestOfCanton: vi.fn(),
    getCantonCodeFromEntity: vi.fn(),
  },
}))

// Mock createEmptyFinancialDataStructure
vi.mock('@/data/emptyFinancialDataStructure', () => ({
  createEmptyFinancialDataStructure: vi.fn(() => ({
    balanceSheet: { code: 'balance', labels: {}, values: new Map(), children: [] },
    incomeStatement: { code: 'income', labels: {}, values: new Map(), children: [] },
    entities: new Map(),
    metadata: { recordCount: 0 },
  })),
}))

describe('financialData store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Parallel Dataset Loading', () => {
    it('should handle mixed success and failure scenarios correctly', async () => {
      const store = useFinancialDataStore()

      // Mock DataLoader instance
      const mockDataLoaderInstance = {
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        fillEntityMetadata: vi.fn(),
        loadDataIntoTree: vi.fn(),
        loadAndIntegrateFinancialData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
      } as MockDataLoader
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance as unknown as DataLoader)

      // Set up datasets
      const datasets = ['gdn/fs/010002:2022', 'gdn/fs/010003:2022', 'gdn/fs/010004:2022']
      store.setDatasets(datasets)

      // Mock first dataset to succeed, second to fail, third to succeed
      mockDataLoaderInstance.loadAndIntegrateFinancialData
        .mockResolvedValueOnce(undefined) // Success
        .mockRejectedValueOnce(new Error('Network error')) // Failure
        .mockResolvedValueOnce(undefined) // Success

      // Attempt to load datasets
      await store.loadDatasets()

      // Should have error from the failed dataset
      expect(store.error).toContain('Dataset gdn/fs/010003:2022: Network error')
      expect(store.combinedFinancialData).toBeNull()
      expect(store.loadedDatasetCount).toBe(0)
    })

    it('should count successful loads correctly when some datasets fail', async () => {
      const store = useFinancialDataStore()

      // Mock DataLoader instance
      const mockDataLoaderInstance = {
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        fillEntityMetadata: vi.fn(),
        loadDataIntoTree: vi.fn(),
        loadAndIntegrateFinancialData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
      } as MockDataLoader
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance as unknown as DataLoader)

      // Set up datasets
      const datasets = ['gdn/fs/010002:2022', 'gdn/fs/010003:2022']
      store.setDatasets(datasets)

      // Mock first dataset to succeed, second to fail
      mockDataLoaderInstance.loadAndIntegrateFinancialData
        .mockResolvedValueOnce(undefined) // Success
        .mockRejectedValueOnce(new Error('Validation error')) // Failure

      // Attempt to load datasets
      await store.loadDatasets()

      // Should report the first error encountered
      expect(store.error).toContain('Dataset gdn/fs/010003:2022: Validation error')
      expect(store.combinedFinancialData).toBeNull()
    })

    it('keeps the columns in the order the datasets were selected, whatever finishes first', async () => {
      const store = useFinancialDataStore()
      const datasets = ['gdn/fs/010002:2022', 'std/fs/bund:2022', 'gdn/fs/010003:2022']

      // The first dataset is the slowest, so completion order is the reverse of selection order
      const delays: Record<string, number> = {
        'gdn/fs/010002:2022': 30,
        'std/fs/bund:2022': 15,
        'gdn/fs/010003:2022': 1,
      }
      const loadAndIntegrateFinancialData = vi.fn(
        (entity: string, model: string, year: string, data: FinancialData, source: string) =>
          new Promise<void>((resolve) => {
            const code = `${source}/${model}/${entity}:${year}`
            setTimeout(() => {
              data.entities.set(code, { code } as unknown as FinancialDataEntity)
              resolve()
            }, delays[code])
          }),
      )
      MockedDataLoader.mockImplementation(
        () => ({ loadAndIntegrateFinancialData }) as unknown as DataLoader,
      )

      store.setDatasets(datasets)
      await store.loadDatasets()

      expect(store.error).toBeNull()
      expect([...store.combinedFinancialData!.entities.keys()]).toEqual(datasets)
    })

    it('should handle all datasets failing gracefully', async () => {
      const store = useFinancialDataStore()

      // Mock DataLoader instance
      const mockDataLoaderInstance = {
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        fillEntityMetadata: vi.fn(),
        loadDataIntoTree: vi.fn(),
        loadAndIntegrateFinancialData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
      } as MockDataLoader
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance as unknown as DataLoader)

      // Set up datasets
      const datasets = ['gdn/fs/010002:2022', 'gdn/fs/010003:2022']
      store.setDatasets(datasets)

      // Mock all datasets to fail
      mockDataLoaderInstance.loadAndIntegrateFinancialData.mockRejectedValue(
        new Error('Server error'),
      )

      // Attempt to load datasets
      await store.loadDatasets()

      // Should report error and have no loaded data
      expect(store.error).toContain('Dataset gdn/fs/010002:2022: Server error')
      expect(store.combinedFinancialData).toBeNull()
      expect(store.loadedDatasetCount).toBe(0)
      expect(store.loading).toBe(false)
    })

    it('should handle malformed dataset identifiers', async () => {
      const store = useFinancialDataStore()

      // Set up malformed datasets
      const datasets = ['invalid-format', 'gdn/fs', 'gdn/fs/010002'] // Missing parts
      store.setDatasets(datasets)

      // Attempt to load datasets
      await store.loadDatasets()

      // Should report error about invalid format
      expect(store.error).toContain('Invalid dataset identifier format')
      expect(store.combinedFinancialData).toBeNull()
      expect(store.loadedDatasetCount).toBe(0)
    })

    it('should handle empty entity or year in dataset identifier', async () => {
      const store = useFinancialDataStore()

      // Set up datasets with empty entity/year
      const datasets = ['gdn/fs/:2022', 'gdn/fs/010002:'] // Empty entity and year
      store.setDatasets(datasets)

      // Attempt to load datasets
      await store.loadDatasets()

      // Should report error about invalid entity:year format
      expect(store.error).toContain('Invalid entity:year format')
      expect(store.combinedFinancialData).toBeNull()
      expect(store.loadedDatasetCount).toBe(0)
    })

    it('should handle parallel loading without race conditions', async () => {
      const store = useFinancialDataStore()

      // Mock DataLoader instance
      const mockDataLoaderInstance = {
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        fillEntityMetadata: vi.fn(),
        loadDataIntoTree: vi.fn(),
        loadAndIntegrateFinancialData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
      } as MockDataLoader
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance as unknown as DataLoader)

      // Set up datasets
      const datasets = ['gdn/fs/010002:2022', 'gdn/fs/010003:2022', 'gdn/fs/010004:2022']
      store.setDatasets(datasets)

      // Mock datasets to succeed with different delays
      mockDataLoaderInstance.loadAndIntegrateFinancialData.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100))
        return undefined
      })

      // Start multiple concurrent loads
      const loadPromise1 = store.loadDatasets()
      const loadPromise2 = store.loadDatasets()

      await Promise.all([loadPromise1, loadPromise2])

      // Should not have errors and should handle concurrency properly
      expect(store.loading).toBe(false)
      // One of the calls should have been effective
      expect(mockDataLoaderInstance.loadAndIntegrateFinancialData).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle unknown errors gracefully', async () => {
      const store = useFinancialDataStore()

      // Mock DataLoader instance
      const mockDataLoaderInstance = {
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        fillEntityMetadata: vi.fn(),
        loadDataIntoTree: vi.fn(),
        loadAndIntegrateFinancialData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
      } as MockDataLoader
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance as unknown as DataLoader)

      // Set up datasets
      const datasets = ['gdn/fs/010002:2022']
      store.setDatasets(datasets)

      // Mock dataset to throw non-Error object
      mockDataLoaderInstance.loadAndIntegrateFinancialData.mockRejectedValue('String error')

      // Attempt to load datasets
      await store.loadDatasets()

      // Should handle non-Error objects gracefully
      expect(store.error).toContain('Dataset gdn/fs/010002:2022: Unknown error')
      expect(store.combinedFinancialData).toBeNull()
    })
  })

  describe('Scaling on load', () => {
    const POPULATION: Record<string, number> = { '010261': 400000, '010230': 100000 }
    const FIRST_DATASETS = ['gdn/fs/010261:2022', 'gdn/fs/010230:2022']
    const OTHER_DATASETS = ['gdn/fs/010261:2022', 'gdn/fs/010230:2022', 'gdn/fs/010156:2022']

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

    // DataLoader mock that registers one entity per dataset, like the real loader does
    const mockLoaderAddingEntities = () => {
      const loader = {
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
      return loader
    }

    const entitiesOf = (store: ReturnType<typeof useFinancialDataStore>) =>
      Array.from(store.combinedFinancialData?.entities.values() ?? [])

    const scalingFactorsOf = (store: ReturnType<typeof useFinancialDataStore>) =>
      Object.fromEntries(entitiesOf(store).map((e) => [e.code, e.scalingFactor]))

    beforeEach(() => {
      statsLoaderMock.getStatsEntry.mockReset()
      statsLoaderMock.getAvailableStats.mockReset()
      statsLoaderMock.loadGdnData.mockReset()
      statsLoaderMock.loadKtnData.mockReset()
      statsLoaderMock.getBundData.mockReset()

      statsLoaderMock.getStatsEntry.mockImplementation(async (id: string) =>
        id === 'pop' ? { id: 'pop', name: popStat.name, unit: popStat.unit } : null,
      )
      statsLoaderMock.getAvailableStats.mockResolvedValue([popStat])
      statsLoaderMock.loadGdnData.mockImplementation(
        async (_id: string, _year: number, options: { geoIds: string[] }) => ({
          data: options.geoIds.map((key) => ({ key, value: POPULATION[key] ?? 5000 })),
        }),
      )
      mockLoaderAddingEntities()
    })

    it('applies the scaling given to loadDatasets before loading finishes', async () => {
      const store = useFinancialDataStore()
      store.setDatasets(FIRST_DATASETS)

      // Record every state in which the table could be rendered (data present, not loading)
      const renderable: boolean[] = []
      const stop = watch(
        () => {
          const entities = entitiesOf(store)
          return {
            loading: store.loading,
            hasData: store.combinedFinancialData !== null,
            unscaled: entities.filter((e) => e.scalingFactor === undefined).length,
          }
        },
        (state) => {
          if (!state.loading && state.hasData) renderable.push(state.unscaled === 0)
        },
        { flush: 'sync' },
      )

      await store.loadDatasets('pop')
      stop()

      expect(store.currentScalingId).toBe('pop')
      expect(scalingFactorsOf(store)).toEqual({
        'gdn/fs/010261:2022': 400000,
        'gdn/fs/010230:2022': 100000,
      })
      expect(entitiesOf(store).every((e) => e.scalingMode === 'divide')).toBe(true)
      // Never a render with raw values: the only renderable state is the scaled one
      expect(renderable.length).toBeGreaterThan(0)
      expect(renderable.every(Boolean)).toBe(true)
    })

    it('scales cantons, the calculated rest of a canton and the federal level with their own records', async () => {
      // "rest of canton" belongs to a canton but has its own population (the canton minus the listed
      // municipalities), stored with the municipalities as rest_<cantonId>. It must not fall back to the country.
      vi.mocked(EntitySemanticMapper.isCantonSpecific).mockImplementation(
        (code: string) => code === 'ktn_zh' || code === 'gdn_zh_rest',
      )
      vi.mocked(EntitySemanticMapper.isRestOfCanton).mockImplementation(
        (code: string) => code === 'gdn_zh_rest',
      )
      vi.mocked(EntitySemanticMapper.getCantonCodeFromEntity).mockReturnValue('zh')
      vi.mocked(getCantonByAbbreviation).mockResolvedValue({
        cantonId: '1',
        cantonAbbreviation: 'ZH',
        cantonLongName: 'Zürich',
      })
      statsLoaderMock.loadGdnData.mockImplementation(
        async (_id: string, _year: number, options: { geoIds: string[] }) => ({
          data: options.geoIds.map((key) => ({ key, value: key === 'rest_1' ? 200000 : 5000 })),
        }),
      )
      statsLoaderMock.loadKtnData.mockImplementation(
        async (_id: string, _year: number, options: { geoIds: string[] }) => ({
          data: options.geoIds.map((key) => ({ key, value: 1600000 })),
        }),
      )
      statsLoaderMock.getBundData.mockResolvedValue({ totalValue: 9000000 })

      const store = useFinancialDataStore()
      store.setDatasets(['std/fs/ktn_zh:2024', 'std/fs/gdn_zh_rest:2024', 'std/fs/bund:2024'])
      await store.loadDatasets('pop')

      expect(scalingFactorsOf(store)).toEqual({
        'std/fs/ktn_zh:2024': 1600000,
        'std/fs/gdn_zh_rest:2024': 200000,
        'std/fs/bund:2024': 9000000,
      })
      expect(statsLoaderMock.loadGdnData).toHaveBeenCalledWith('pop', 2024, { geoIds: ['rest_1'] })
      expect(statsLoaderMock.loadKtnData).toHaveBeenCalledWith('pop', 2024, { geoIds: ['1'] })
    })

    it('looks the scaling up while the store is still loading', async () => {
      const store = useFinancialDataStore()
      store.setDatasets(FIRST_DATASETS)
      const loadingDuringLookup: boolean[] = []
      statsLoaderMock.getStatsEntry.mockImplementation(async (id: string) => {
        loadingDuringLookup.push(store.loading)
        return id === 'pop' ? { id: 'pop', name: popStat.name, unit: popStat.unit } : null
      })

      await store.loadDatasets('pop')

      expect(loadingDuringLookup).toEqual([true])
      expect(store.loading).toBe(false)
    })

    it('does not re-apply when setScaling is later called with the same id', async () => {
      const store = useFinancialDataStore()
      store.setDatasets(FIRST_DATASETS)
      await store.loadDatasets('pop')
      statsLoaderMock.getStatsEntry.mockClear()
      statsLoaderMock.loadGdnData.mockClear()

      // This is what the scaling selector emits after the table is shown
      await store.setScaling('pop')

      expect(statsLoaderMock.getStatsEntry).not.toHaveBeenCalled()
      expect(statsLoaderMock.loadGdnData).not.toHaveBeenCalled()
      expect(store.currentScalingId).toBe('pop')
      expect(scalingFactorsOf(store)['gdn/fs/010261:2022']).toBe(400000)
    })

    it('loads without scaling when null is given and never queries the stats', async () => {
      const store = useFinancialDataStore()
      store.setDatasets(FIRST_DATASETS)

      await store.loadDatasets(null)

      expect(store.currentScalingId).toBeNull()
      expect(entitiesOf(store)).toHaveLength(2)
      expect(entitiesOf(store).every((e) => e.scalingFactor === undefined)).toBe(true)
      expect(statsLoaderMock.getStatsEntry).not.toHaveBeenCalled()
    })

    it('keeps working without an argument (no scaling by default)', async () => {
      const store = useFinancialDataStore()
      store.setDatasets(FIRST_DATASETS)

      await store.loadDatasets()

      expect(store.currentScalingId).toBeNull()
      expect(entitiesOf(store).every((e) => e.scalingFactor === undefined)).toBe(true)
    })

    it('drops a stale scaling when the next load asks for none', async () => {
      const store = useFinancialDataStore()
      store.setDatasets(FIRST_DATASETS)
      await store.loadDatasets('pop')
      expect(store.currentScalingId).toBe('pop')

      await store.loadDatasets(null)

      expect(store.currentScalingId).toBeNull()
      expect(entitiesOf(store).every((e) => e.scalingFactor === undefined)).toBe(true)
    })

    it('keeps the active scaling when the datasets change and no argument is given', async () => {
      const store = useFinancialDataStore()
      store.setDatasets(FIRST_DATASETS)
      await store.loadDatasets('pop')

      store.setDatasets(OTHER_DATASETS)
      await store.loadDatasets()

      expect(store.currentScalingId).toBe('pop')
      expect(scalingFactorsOf(store)).toEqual({
        'gdn/fs/010261:2022': 400000,
        'gdn/fs/010230:2022': 100000,
        'gdn/fs/010156:2022': 5000,
      })
    })

    it('shows the data unscaled and forgets the id when the scaling is unknown', async () => {
      const store = useFinancialDataStore()
      store.setDatasets(FIRST_DATASETS)

      await store.loadDatasets('does-not-exist')

      expect(store.error).toBeNull()
      expect(store.combinedFinancialData).not.toBeNull()
      expect(store.currentScalingId).toBeNull()
      expect(entitiesOf(store).every((e) => e.scalingFactor === undefined)).toBe(true)
    })

    it('resets the scaling together with the data when there are no datasets', async () => {
      const store = useFinancialDataStore()
      store.setDatasets([])

      await store.loadDatasets('pop')

      expect(store.currentScalingId).toBeNull()
      expect(store.combinedFinancialData).toBeNull()
    })

    describe('custom formulas', () => {
      const FORMULA_ID = `${CUSTOM_SCALING_PREFIX}pop/1000`

      it('applies a custom formula on load, before loading finishes', async () => {
        const store = useFinancialDataStore()
        store.setDatasets(FIRST_DATASETS)
        const loadingDuringLoad: boolean[] = []
        statsLoaderMock.loadGdnData.mockImplementation(
          async (_id: string, _year: number, options: { geoIds: string[] }) => {
            loadingDuringLoad.push(store.loading)
            return { data: options.geoIds.map((key) => ({ key, value: POPULATION[key] ?? 5000 })) }
          },
        )

        await store.loadDatasets(FORMULA_ID)

        expect(store.error).toBeNull()
        expect(store.currentScalingId).toBe(FORMULA_ID)
        expect(scalingFactorsOf(store)).toEqual({
          'gdn/fs/010261:2022': 400,
          'gdn/fs/010230:2022': 100,
        })
        expect(entitiesOf(store).every((e) => e.scalingMode === 'divide')).toBe(true)
        expect(loadingDuringLoad.length).toBeGreaterThan(0)
        expect(loadingDuringLoad.every(Boolean)).toBe(true)
      })

      it('does not apply the same custom formula twice via setScaling', async () => {
        const store = useFinancialDataStore()
        store.setDatasets(FIRST_DATASETS)
        await store.loadDatasets(FORMULA_ID)
        statsLoaderMock.loadGdnData.mockClear()

        await store.setScaling(FORMULA_ID)

        expect(statsLoaderMock.loadGdnData).not.toHaveBeenCalled()
        expect(scalingFactorsOf(store)['gdn/fs/010261:2022']).toBe(400)
      })

      it('keeps a custom formula applied when the datasets change', async () => {
        const store = useFinancialDataStore()
        store.setDatasets(FIRST_DATASETS)
        await store.loadDatasets(FORMULA_ID)

        store.setDatasets(OTHER_DATASETS)
        await store.loadDatasets()

        expect(store.currentScalingId).toBe(FORMULA_ID)
        expect(scalingFactorsOf(store)).toEqual({
          'gdn/fs/010261:2022': 400,
          'gdn/fs/010230:2022': 100,
          'gdn/fs/010156:2022': 5,
        })
      })

      it('applies a custom formula chosen after an unscaled load', async () => {
        const store = useFinancialDataStore()
        store.setDatasets(FIRST_DATASETS)
        await store.loadDatasets(null)
        expect(entitiesOf(store).every((e) => e.scalingFactor === undefined)).toBe(true)

        await store.setScaling(FORMULA_ID)

        expect(store.currentScalingId).toBe(FORMULA_ID)
        expect(scalingFactorsOf(store)['gdn/fs/010261:2022']).toBe(400)
      })
    })

    describe('changing the scaling after the data is shown', () => {
      it('switches from a traditional scaling to a custom formula', async () => {
        const store = useFinancialDataStore()
        store.setDatasets(FIRST_DATASETS)
        await store.loadDatasets('pop')

        await store.setScaling(`${CUSTOM_SCALING_PREFIX}pop/1000`)

        expect(scalingFactorsOf(store)['gdn/fs/010261:2022']).toBe(400)
      })

      it('removes the scaling again with null', async () => {
        const store = useFinancialDataStore()
        store.setDatasets(FIRST_DATASETS)
        await store.loadDatasets('pop')
        expect(scalingFactorsOf(store)['gdn/fs/010261:2022']).toBe(400000)

        await store.setScaling(null)

        expect(store.currentScalingId).toBeNull()
        expect(entitiesOf(store).every((e) => e.scalingFactor === undefined)).toBe(true)
        expect(entitiesOf(store).every((e) => e.scalingMode === undefined)).toBe(true)
      })

      it('applies a scaling on top of an unscaled load', async () => {
        const store = useFinancialDataStore()
        store.setDatasets(FIRST_DATASETS)
        await store.loadDatasets(null)

        await store.setScaling('pop')

        expect(store.currentScalingId).toBe('pop')
        expect(scalingFactorsOf(store)['gdn/fs/010230:2022']).toBe(100000)
      })
    })
  })
})
