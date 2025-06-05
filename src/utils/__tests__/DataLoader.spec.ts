import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataLoader } from '../DataLoader';
import type { FinancialData } from '../../types/FinancialDataStructure';
import type { GdnDataInfo } from '../../types/DataStructures';
import { createEmptyFinancialDataStructure } from '../../data/emptyFinancialDataStructure';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DataLoader', () => {
  let dataLoader: DataLoader;
  let mockFinancialData: FinancialData;

  beforeEach(() => {
    dataLoader = new DataLoader();
    mockFinancialData = createEmptyFinancialDataStructure();
    vi.clearAllMocks();
  });

  describe('validateGdnData', () => {
    it('should validate existing GDN data successfully', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [
            {
              model: 'fs',
              jahre: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
            }
          ]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGdnInfo
      });

      const result = await dataLoader.validateGdnData('010002', '2022', 'fs');

      expect(result.isValid).toBe(true);
      expect(result.dataPath).toBe('/data/gdn/fs/010002/2022.csv');
    });

    it('should return error for non-existent entity', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGdnInfo
      });

      const result = await dataLoader.validateGdnData('999999', '2022', 'fs');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('GDN entity \'999999\' not found');
    });

    it('should return error for unavailable year', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGdnInfo
      });

      const result = await dataLoader.validateGdnData('010002', '2023', 'fs');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Year \'2023\' not available');
    });
  });

  describe('validateStdData', () => {
    it('should validate existing STD data successfully', async () => {
      const mockStdInfo = [
        {
          hh: 'gdn_zh',
          models: [
            {
              model: 'fs',
              jahre: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
            }
          ]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStdInfo
      });

      const result = await dataLoader.validateStdData('gdn_zh', '2022', 'fs');

      expect(result.isValid).toBe(true);
      expect(result.dataPath).toBe('/data/std/fs/gdn_zh/2022.csv');
    });
  });

  describe('loadGdnData', () => {
    it('should load and parse GDN CSV data successfully', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }]
        }
      ];

      const mockCsvData = `"arten","funk","jahr","value","dim","unit"
"100","","2022","1000000","bilanz","CHF"
"101","","2022","500000","bilanz","CHF"
"400","","2022","2000000","ertrag","CHF"`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGdnInfo
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockCsvData
        });

      const result = await dataLoader.loadGdnData('010002', '2022', 'fs');

      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        arten: '100',
        funk: '',
        jahr: '2022',
        value: '1000000',
        dim: 'bilanz',
        unit: 'CHF'
      });
      expect(result.metadata.source).toBe('GDN/fs/010002/2022');
      expect(result.metadata.recordCount).toBe(3);
    });

    it('should throw error for invalid entity', async () => {
      const mockGdnInfo: GdnDataInfo[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGdnInfo
      });

      await expect(dataLoader.loadGdnData('999999', '2022', 'fs'))
        .rejects.toThrow('GDN entity \'999999\' not found');
    });
  });

  describe('loadAndIntegrateFinancialData', () => {
    it('should integrate GDN data into financial tree structure', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }]
        }
      ];

      const mockCsvData = `"arten","funk","jahr","value","dim","unit"
"100","","2022","1000000","bilanz","CHF"
"400","","2022","2000000","ertrag","CHF"`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGdnInfo
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockCsvData
        });

      const result = await dataLoader.loadAndIntegrateFinancialData(
        '010002',
        'fs',
        '2022',
        mockFinancialData,
        'gdn'
      );

      expect(result.entities.size).toBe(1);
      expect(result.entities.has('gdn/fs/010002:2022')).toBe(true);
      
      const entity = result.entities.get('gdn/fs/010002:2022');
      expect(entity?.code).toBe('gdn/fs/010002:2022');
      expect(entity?.metadata.recordCount).toBe(2);
    });

    it('should throw error for non-existent account codes', async () => {
      const mockGdnInfo = [
        {
          nr: '010002',
          gemeinde: 'Affoltern a.A.',
          models: [{ model: 'fs', jahre: ['2022'] }]
        }
      ];

      const mockCsvData = `"arten","funk","jahr","value","dim","unit"
"999999","","2022","1000000","bilanz","CHF"`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGdnInfo
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockCsvData
        });

      await expect(dataLoader.loadAndIntegrateFinancialData(
        '010002',
        'fs',
        '2022',
        mockFinancialData,
        'gdn'
      )).rejects.toThrow('Account code \'999999\' not found in tree structure');
    });
  });
});
