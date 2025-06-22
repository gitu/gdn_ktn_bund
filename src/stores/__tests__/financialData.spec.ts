import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFinancialDataStore } from '../financialData'
import { DataLoader } from '@/utils/DataLoader'

// Mock DataLoader
vi.mock('@/utils/DataLoader')
const MockedDataLoader = vi.mocked(DataLoader)

// Mock StatsDataLoader
vi.mock('@/utils/StatsDataLoader', () => ({
  StatsDataLoader: {
    getInstance: vi.fn(() => ({
      getStatsEntry: vi.fn(),
      loadGdnData: vi.fn(),
      loadKtnData: vi.fn(),
      getBundData: vi.fn(),
    })),
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
        loadAndIntegrateFinancialData: vi.fn(),
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadCsvData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
        findNodeByCode: vi.fn(),
        findAccountByCode: vi.fn(),
        getAccountingStandards: vi.fn(),
        getAllAccountCodes: vi.fn(),
        validateAccountCode: vi.fn(),
        getAccountHierarchy: vi.fn(),
        filterDataByDimension: vi.fn(),
        aggregateDataRecords: vi.fn(),
      } as any
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance)

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
        loadAndIntegrateFinancialData: vi.fn(),
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadCsvData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
        findNodeByCode: vi.fn(),
        findAccountByCode: vi.fn(),
        getAccountingStandards: vi.fn(),
        getAllAccountCodes: vi.fn(),
        validateAccountCode: vi.fn(),
        getAccountHierarchy: vi.fn(),
        filterDataByDimension: vi.fn(),
        aggregateDataRecords: vi.fn(),
      } as any
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance)

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

    it('should handle all datasets failing gracefully', async () => {
      const store = useFinancialDataStore()

      // Mock DataLoader instance
      const mockDataLoaderInstance = {
        loadAndIntegrateFinancialData: vi.fn(),
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadCsvData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
        findNodeByCode: vi.fn(),
        findAccountByCode: vi.fn(),
        getAccountingStandards: vi.fn(),
        getAllAccountCodes: vi.fn(),
        validateAccountCode: vi.fn(),
        getAccountHierarchy: vi.fn(),
        filterDataByDimension: vi.fn(),
        aggregateDataRecords: vi.fn(),
      } as any
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance)

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
        loadAndIntegrateFinancialData: vi.fn(),
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadCsvData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
        findNodeByCode: vi.fn(),
        findAccountByCode: vi.fn(),
        getAccountingStandards: vi.fn(),
        getAllAccountCodes: vi.fn(),
        validateAccountCode: vi.fn(),
        getAccountHierarchy: vi.fn(),
        filterDataByDimension: vi.fn(),
        aggregateDataRecords: vi.fn(),
      } as any
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance)

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
        loadAndIntegrateFinancialData: vi.fn(),
        validateGdnData: vi.fn(),
        validateStdData: vi.fn(),
        loadCsvData: vi.fn(),
        loadGdnData: vi.fn(),
        loadStdData: vi.fn(),
        calculateEntitySum: vi.fn(),
        getSumFromNode: vi.fn(),
        hasSumValues: vi.fn(),
        findNodeByCode: vi.fn(),
        findAccountByCode: vi.fn(),
        getAccountingStandards: vi.fn(),
        getAllAccountCodes: vi.fn(),
        validateAccountCode: vi.fn(),
        getAccountHierarchy: vi.fn(),
        filterDataByDimension: vi.fn(),
        aggregateDataRecords: vi.fn(),
      } as any
      MockedDataLoader.mockImplementation(() => mockDataLoaderInstance)

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
})
