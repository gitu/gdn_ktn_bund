import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataLoader } from '../DataLoader'
import type { FinancialData } from '@/types/FinancialDataStructure.ts'
import type { GdnDataInfo } from '@/types/DataStructures.ts'
import { createEmptyFinancialDataStructure } from '@/data/emptyFinancialDataStructure.ts'

/* eslint @typescript-eslint/no-explicit-any: 0 */

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
  parse: vi.fn(),
}))

import * as Papa from 'papaparse'

// Mock fetch with proper Response-like objects
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockPapaParse = vi.mocked(Papa.parse)

describe('DataLoader', () => {
  let dataLoader: DataLoader
  let mockFinancialData: FinancialData

  beforeEach(() => {
    dataLoader = new DataLoader()
    mockFinancialData = createEmptyFinancialDataStructure()
    vi.clearAllMocks()
    mockPapaParse.mockClear()
  })

  describe('validateGdnData', () => {
    it('should validate existing GDN data successfully', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [
            {
              model: 'fs',
              jahre: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGdnInfo),
        text: vi.fn().mockResolvedValue(''),
        status: 200,
        statusText: 'OK',
      })

      const result = await dataLoader.validateGdnData('010002', '2022', 'fs')

      expect(result.isValid).toBe(true)
      expect(result.dataPath).toBe('/data/gdn/fs/010002/2022.csv')
    })

    it('should return error for non-existent entity', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGdnInfo),
        text: vi.fn().mockResolvedValue(''),
        status: 200,
        statusText: 'OK',
      })

      const result = await dataLoader.validateGdnData('999999', '2022', 'fs')

      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toContain("GDN entity '999999' not found")
    })

    it('should return error for unavailable year', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGdnInfo),
        text: vi.fn().mockResolvedValue(''),
        status: 200,
        statusText: 'OK',
      })

      const result = await dataLoader.validateGdnData('010002', '2023', 'fs')

      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toContain("Year '2023' not available")
    })
  })

  describe('validateStdData', () => {
    it('should validate existing STD data successfully', async () => {
      const mockStdInfo = [
        {
          hh: 'gdn_zh',
          models: [
            {
              model: 'fs',
              jahre: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
            },
          ],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockStdInfo),
        text: vi.fn().mockResolvedValue(''),
        status: 200,
        statusText: 'OK',
      })

      const result = await dataLoader.validateStdData('gdn_zh', '2022', 'fs')

      expect(result.isValid).toBe(true)
      expect(result.dataPath).toBe('/data/std/fs/gdn_zh/2022.csv')
    })
  })

  describe('loadGdnData', () => {
    it('should load and parse GDN CSV data successfully', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }],
        },
      ]

      const mockCsvData = `arten,funk,jahr,value,dim,unit
100,,2022,1000000,bilanz,CHF
101,,2022,500000,bilanz,CHF
400,,2022,2000000,ertrag,CHF`

      const mockParsedData = [
        { arten: '100', funk: '', jahr: '2022', value: '1000000', dim: 'bilanz', unit: 'CHF' },
        { arten: '101', funk: '', jahr: '2022', value: '500000', dim: 'bilanz', unit: 'CHF' },
        { arten: '400', funk: '', jahr: '2022', value: '2000000', dim: 'ertrag', unit: 'CHF' },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockGdnInfo),
          text: vi.fn().mockResolvedValue(''),
          status: 200,
          statusText: 'OK',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({}),
          text: vi.fn().mockResolvedValue(mockCsvData),
          status: 200,
          statusText: 'OK',
        })

      mockPapaParse.mockReturnValueOnce({
        data: mockParsedData,
        errors: [],
        meta: {
          fields: ['arten', 'funk', 'jahr', 'value', 'dim', 'unit'],
        },
      } as any)

      const result = await dataLoader.loadGdnData('010002', '2022', 'fs')

      expect(result.data).toHaveLength(3)
      expect(result.data[0]).toEqual({
        arten: '100',
        funk: '',
        jahr: '2022',
        value: '1000000',
        dim: 'bilanz',
        unit: 'CHF',
      })
      expect(result.metadata.source).toBe('GDN/fs/010002/2022')
      expect(result.metadata.recordCount).toBe(3)
    })

    it('should throw error for invalid entity', async () => {
      const mockGdnInfo: GdnDataInfo[] = []

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGdnInfo),
        text: vi.fn().mockResolvedValue(''),
        status: 200,
        statusText: 'OK',
      })

      await expect(dataLoader.loadGdnData('999999', '2022', 'fs')).rejects.toThrow(
        "GDN entity '999999' not found",
      )
    })
  })

  describe('loadAndIntegrateFinancialData', () => {
    it('should integrate GDN data into financial tree structure', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }],
        },
      ]

      const mockCsvData = `arten,funk,jahr,value,dim,unit
100,,2022,1000000,bilanz,CHF
400,,2022,2000000,ertrag,CHF`

      const mockParsedData = [
        { arten: '100', funk: '', jahr: '2022', value: '1000000', dim: 'bilanz', unit: 'CHF' },
        { arten: '400', funk: '', jahr: '2022', value: '2000000', dim: 'ertrag', unit: 'CHF' },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockGdnInfo),
          text: vi.fn().mockResolvedValue(''),
          status: 200,
          statusText: 'OK',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({}),
          text: vi.fn().mockResolvedValue(mockCsvData),
          status: 200,
          statusText: 'OK',
        })

      mockPapaParse.mockReturnValueOnce({
        data: mockParsedData,
        errors: [],
        meta: {
          fields: ['arten', 'funk', 'jahr', 'value', 'dim', 'unit'],
        },
      } as any)

      const result = await dataLoader.loadAndIntegrateFinancialData(
        '010002',
        'fs',
        '2022',
        mockFinancialData,
        'gdn',
      )

      expect(result.entities.size).toBe(1)
      expect(result.entities.has('gdn/fs/010002:2022')).toBe(true)

      const entity = result.entities.get('gdn/fs/010002:2022')
      expect(entity?.code).toBe('gdn/fs/010002:2022')
      expect(entity?.metadata.recordCount).toBe(2)

      // Verify that entity name uses municipality name from gemeinde field
      expect(entity?.name.de).toBe('Affoltern a.A.')
      expect(entity?.name.fr).toBe('Affoltern a.A.')
      expect(entity?.name.it).toBe('Affoltern a.A.')
      expect(entity?.name.en).toBe('Affoltern a.A.')

      // Verify new fields are populated correctly
      expect(entity?.year).toBe('2022')
      expect(entity?.model).toBe('fs')
      expect(entity?.source).toBe('gdn')
      expect(entity?.description.de).toBe('Gemeinde Affoltern a.A. (010002)')
      expect(entity?.description.fr).toBe('Commune Affoltern a.A. (010002)')
      expect(entity?.description.it).toBe('Comune Affoltern a.A. (010002)')
      expect(entity?.description.en).toBe('Municipality Affoltern a.A. (010002)')
    })

    it('should throw error for non-existent account codes', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }],
        },
      ]

      const mockCsvData = `arten,funk,jahr,value,dim,unit
999999,,2022,1000000,bilanz,CHF`

      const mockParsedData = [
        { arten: '999999', funk: '', jahr: '2022', value: '1000000', dim: 'bilanz', unit: 'CHF' },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockGdnInfo),
          text: vi.fn().mockResolvedValue(''),
          status: 200,
          statusText: 'OK',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({}),
          text: vi.fn().mockResolvedValue(mockCsvData),
          status: 200,
          statusText: 'OK',
        })

      mockPapaParse.mockReturnValueOnce({
        data: mockParsedData,
        errors: [],
        meta: {
          fields: ['arten', 'funk', 'jahr', 'value', 'dim', 'unit'],
        },
      } as any)

      await expect(
        dataLoader.loadAndIntegrateFinancialData('010002', 'fs', '2022', mockFinancialData, 'gdn'),
      ).rejects.toThrow("Account code '999999' not found in tree structure")
    })

    it('should use EntitySemanticMapper for STD entity names', async () => {
      const mockStdInfo = [
        {
          hh: 'gdn_ag',
          models: [{ model: 'fs', jahre: ['2022'] }],
        },
      ]

      const mockCsvData = `arten,funk,jahr,value,dim,unit
100,,2022,1000000,bilanz,CHF`

      const mockParsedData = [
        { arten: '100', funk: '', jahr: '2022', value: '1000000', dim: 'bilanz', unit: 'CHF' },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockStdInfo),
          text: vi.fn().mockResolvedValue(''),
          status: 200,
          statusText: 'OK',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({}),
          text: vi.fn().mockResolvedValue(mockCsvData),
          status: 200,
          statusText: 'OK',
        })

      mockPapaParse.mockReturnValueOnce({
        data: mockParsedData,
        errors: [],
        meta: {
          fields: ['arten', 'funk', 'jahr', 'value', 'dim', 'unit'],
        },
      } as any)

      const result = await dataLoader.loadAndIntegrateFinancialData(
        'gdn_ag',
        'fs',
        '2022',
        mockFinancialData,
        'std',
      )

      expect(result.entities.size).toBe(1)
      expect(result.entities.has('std/fs/gdn_ag:2022')).toBe(true)

      const entity = result.entities.get('std/fs/gdn_ag:2022')
      expect(entity?.code).toBe('std/fs/gdn_ag:2022')

      // Verify that entity name uses EntitySemanticMapper for semantic labels
      expect(entity?.name.de).toBe('Gemeinden Aargau')
      expect(entity?.name.fr).toBe('Communes Argovie')
      expect(entity?.name.it).toBe('Comuni Argovia')
      expect(entity?.name.en).toBe('Municipalities Aargau')

      // Verify new fields are populated correctly
      expect(entity?.year).toBe('2022')
      expect(entity?.model).toBe('fs')
      expect(entity?.source).toBe('std')
      expect(entity?.description.de).toBe('Gemeinden Aargau (gdn_ag)')
      expect(entity?.description.fr).toBe('Communes Argovie (gdn_ag)')
      expect(entity?.description.it).toBe('Comuni Argovia (gdn_ag)')
      expect(entity?.description.en).toBe('Municipalities Aargau (gdn_ag)')
    })
  })

  describe('calculateEntitySum', () => {
    it('should calculate sum of all financial values for an entity and add them to tree', () => {
      // Create a mock financial data structure with some test values
      const testFinancialData = createEmptyFinancialDataStructure()
      const entityCode = 'gdn/fs/010002:2022'

      // Add some test values to balance sheet nodes
      const balanceNode100 = dataLoader['findNodeByCode'](testFinancialData.balanceSheet, '100')
      const balanceNode101 = dataLoader['findNodeByCode'](testFinancialData.balanceSheet, '101')

      if (balanceNode100) {
        balanceNode100.values.set(entityCode, { value: 1000000, unit: 'CHF' })
      }
      if (balanceNode101) {
        balanceNode101.values.set(entityCode, { value: 500000, unit: 'CHF' })
      }

      // Add some test values to income statement nodes
      const incomeNode400 = dataLoader['findNodeByCode'](testFinancialData.incomeStatement, '400')
      const incomeNode300 = dataLoader['findNodeByCode'](testFinancialData.incomeStatement, '300')

      if (incomeNode400) {
        incomeNode400.values.set(entityCode, { value: 2000000, unit: 'CHF' })
      }
      if (incomeNode300) {
        incomeNode300.values.set(entityCode, { value: 800000, unit: 'CHF' })
      }

      // Calculate the sum
      dataLoader.calculateEntitySum(testFinancialData, entityCode)

      // Verify that sums are added directly to the tree nodes
      // Check that parent nodes have sum values
      const balanceRootNode = testFinancialData.balanceSheet
      const incomeRootNode = testFinancialData.incomeStatement

      expect(balanceRootNode.values.has(entityCode)).toBe(true)
      expect(incomeRootNode.values.has(entityCode)).toBe(true)

      const balanceRootSum = balanceRootNode.values.get(entityCode)
      const incomeRootSum = incomeRootNode.values.get(entityCode)

      expect(balanceRootSum?.value).toBe(1500000)
      expect(incomeRootSum?.value).toBe(1200000) // 2000000 + 800000 but with factor adjustments
    })

    it('should handle mixed positive and negative values', () => {
      const testFinancialData = createEmptyFinancialDataStructure()
      const entityCode = 'gdn/fs/010002:2022'

      // Add positive and negative values
      const balanceNode100 = dataLoader['findNodeByCode'](testFinancialData.balanceSheet, '100')
      const incomeNode400 = dataLoader['findNodeByCode'](testFinancialData.incomeStatement, '400')
      const incomeNode300 = dataLoader['findNodeByCode'](testFinancialData.incomeStatement, '300')

      if (balanceNode100) {
        balanceNode100.values.set(entityCode, { value: 1000000, unit: 'CHF' })
      }
      if (incomeNode400) {
        incomeNode400.values.set(entityCode, { value: 2000000, unit: 'CHF' })
      }
      if (incomeNode300) {
        incomeNode300.values.set(entityCode, { value: -500000, unit: 'CHF' }) // Negative value
      }

      dataLoader.calculateEntitySum(testFinancialData, entityCode)

      expect(testFinancialData.balanceSheet.values.get(`${entityCode}`)?.value).toBe(1000000)
      expect(testFinancialData.incomeStatement.values.get(`${entityCode}`)?.value).toBe(2500000) // 2000000 + (-500000) but with factor adjustments
    })

    it('should provide utility methods to work with calculated sums', () => {
      const testFinancialData = createEmptyFinancialDataStructure()
      const entityCode = 'gdn/fs/010002:2022'

      // Add test values and calculate sums
      const balanceNode100 = dataLoader['findNodeByCode'](testFinancialData.balanceSheet, '100')
      if (balanceNode100) {
        balanceNode100.values.set(entityCode, { value: 1000000, unit: 'CHF' })
      }

      dataLoader.calculateEntitySum(testFinancialData, entityCode)

      // Test that values are stored directly in the tree
      const balanceRootNode = testFinancialData.balanceSheet
      const directValue = balanceRootNode.values.get(entityCode)
      expect(directValue).not.toBeNull()
      expect(directValue?.value).toBe(1000000)
      expect(directValue?.unit).toBe('CHF')

      // Test getSumFromNode method (which looks for :sum suffix)
      const sumValue = dataLoader.getSumFromNode(balanceRootNode, entityCode)
      expect(sumValue).toBeNull() // Should be null since we don't use :sum suffix anymore

      // Test hasSumValues method
      expect(dataLoader.hasSumValues(balanceRootNode)).toBe(false) // Should be false since we don't use :sum suffix
    })
  })
})
