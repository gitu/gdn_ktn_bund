import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {TreeAggregator, aggregateGdnData, aggregateStdData} from '../TreeAggregator';
import type {TreeStructure, GdnDataRecord, StdDataRecord} from '../../types/DataStructures';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample tree structure for testing
const mockTreeStructure: TreeStructure = {
  metadata: {
    dimension: 'aufwand',
    model: 'fs',
    source: 'test',
    generatedAt: '2024-01-01T00:00:00.000Z',
    totalNodes: 5,
    maxDepth: 2
  },
  tree: {
    code: 'root',
    labels: {
      de: 'Gesamt',
      fr: 'Total',
      it: 'Totale',
      en: 'Total'
    },
    children: [
      {
        code: '3',
        labels: {
          de: 'Aufwand',
          fr: 'Charges',
          it: 'Spese',
          en: 'Expenses'
        },
        children: [
          {
            code: '30',
            labels: {
              de: 'Personalaufwand',
              fr: 'Charges de personnel',
              it: 'Spese per il personale',
              en: 'Personnel expenses'
            },
            children: [
              {
                code: '300',
                labels: {
                  de: 'Behörden, Kommissionen und Richter',
                  fr: 'Autorités, commissions et juges',
                  it: 'Autorità, commissioni e giudici',
                  en: 'Authorities, commissions and judges'
                },
                children: [],
                level: 3,
                hasValue: false,
                value: null
              },
              {
                code: '301',
                labels: {
                  de: 'Löhne des Verwaltungs- und Betriebspersonals',
                  fr: 'Salaires du personnel administratif et d\'exploitation',
                  it: 'Stipendi del personale amministrativo e d\'esercizio',
                  en: 'Salaries of administrative and operating personnel'
                },
                children: [],
                level: 3,
                hasValue: false,
                value: null
              }
            ],
            level: 2,
            hasValue: false,
            value: null
          },
          {
            code: '31',
            labels: {
              de: 'Sach- und übriger Betriebsaufwand',
              fr: 'Charges de biens et services et autres charges d\'exploitation',
              it: 'Spese per beni e servizi e altre spese d\'esercizio',
              en: 'General, administrative and operating expenses'
            },
            children: [],
            level: 2,
            hasValue: false,
            value: null
          }
        ],
        level: 1,
        hasValue: false,
        value: null
      }
    ],
    level: 0,
    hasValue: false,
    value: null
  }
};

// Sample GDN data for testing
const mockGdnData: GdnDataRecord[] = [
  {
    jahr: '2023',
    nr: '001',
    gemeinde: 'Test Municipality',
    konto: '300',
    betrag: '100000'
  },
  {
    jahr: '2023',
    nr: '001',
    gemeinde: 'Test Municipality',
    konto: '301',
    betrag: '200000'
  },
  {
    jahr: '2023',
    nr: '001',
    gemeinde: 'Test Municipality',
    konto: '31',
    betrag: '50000'
  }
];

// Sample STD data for testing
const mockStdData: StdDataRecord[] = [
  {
    arten: '300',
    funk: '',
    jahr: '2023',
    value: '100000',
    dim: 'aufwand',
    hh: 'test_entity',
    unit: 'CHF',
    model: 'fs'
  },
  {
    arten: '301',
    funk: '',
    jahr: '2023',
    value: '200000',
    dim: 'aufwand',
    hh: 'test_entity',
    unit: 'CHF',
    model: 'fs'
  },
  {
    arten: '31',
    funk: '',
    jahr: '2023',
    value: '50000',
    dim: 'aufwand',
    hh: 'test_entity',
    unit: 'CHF',
    model: 'fs'
  }
];

describe('TreeAggregator', () => {
  let aggregator: TreeAggregator;

  beforeEach(() => {
    aggregator = new TreeAggregator();
    vi.clearAllMocks();
  });

  afterEach(() => {
    aggregator.clearCache();
  });

  describe('loadTreeStructure', () => {
    it('should load tree structure successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTreeStructure)
      });

      const result = await aggregator.loadTreeStructure('aufwand', 'fs');

      expect(mockFetch).toHaveBeenCalledWith('/data/trees/aufwand-fs-tree.json');
      expect(result).toEqual(mockTreeStructure);
    });

    it('should load tree structure without model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTreeStructure)
      });

      await aggregator.loadTreeStructure('aufwand');

      expect(mockFetch).toHaveBeenCalledWith('/data/trees/aufwand-tree.json');
    });

    it('should cache loaded tree structures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTreeStructure)
      });

      // Load twice
      await aggregator.loadTreeStructure('aufwand', 'fs');
      await aggregator.loadTreeStructure('aufwand', 'fs');

      // Should only call fetch once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when tree structure file not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(aggregator.loadTreeStructure('nonexistent')).rejects.toThrow(
        'Failed to load tree structure: 404 Not Found'
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(aggregator.loadTreeStructure('aufwand')).rejects.toThrow(
        'Error loading tree structure for aufwand: Error: Network error'
      );
    });
  });

  describe('aggregateGdnData', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTreeStructure)
      });
    });

    it('should aggregate GDN data correctly', async () => {
      const result = await aggregator.aggregateGdnData(
        mockGdnData,
        'aufwand',
        'test_entity',
        '2023'
      );

      expect(result.aggregatedData).toHaveLength(6); // root, 3, 30, 300, 301, 31

      // Check specific aggregated values
      const rootData = result.aggregatedData.find(d => d.code === 'root');
      expect(rootData?.value).toBe(350000); // Sum of all expenses

      const personalExpenses = result.aggregatedData.find(d => d.code === '30');
      expect(personalExpenses?.value).toBe(300000); // Sum of 300 + 301

      const account300 = result.aggregatedData.find(d => d.code === '300');
      expect(account300?.value).toBe(100000);

      const account301 = result.aggregatedData.find(d => d.code === '301');
      expect(account301?.value).toBe(200000);

      const account31 = result.aggregatedData.find(d => d.code === '31');
      expect(account31?.value).toBe(50000);
    });

    it('should handle numeric values correctly', async () => {
      const dataWithNumbers: GdnDataRecord[] = [
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '300',
          betrag: '150000' // numeric value
        }
      ];

      const result = await aggregator.aggregateGdnData(
        dataWithNumbers,
        'aufwand',
        'test_entity',
        '2023'
      );

      const account300 = result.aggregatedData.find(d => d.code === '300');
      expect(account300?.value).toBe(150000);
    });

    it('should handle formatted string values', async () => {
      const dataWithFormatted: GdnDataRecord[] = [
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '300',
          betrag: "1'500'000.50" // Swiss formatting
        },
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '301',
          betrag: "2,500,000.75" // US formatting
        }
      ];

      const result = await aggregator.aggregateGdnData(
        dataWithFormatted,
        'aufwand',
        'test_entity',
        '2023'
      );

      const account300 = result.aggregatedData.find(d => d.code === '300');
      expect(account300?.value).toBe(1500000.50);

      const account301 = result.aggregatedData.find(d => d.code === '301');
      expect(account301?.value).toBe(2500000.75);
    });

    it('should handle scientific notation', async () => {
      const dataWithScientific: GdnDataRecord[] = [
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '300',
          betrag: '1e+06' // 1,000,000
        }
      ];

      const result = await aggregator.aggregateGdnData(
        dataWithScientific,
        'aufwand',
        'test_entity',
        '2023'
      );

      const account300 = result.aggregatedData.find(d => d.code === '300');
      expect(account300?.value).toBe(1000000);
    });

    it('should skip invalid values and report errors', async () => {
      const dataWithInvalid: GdnDataRecord[] = [
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '300',
          betrag: 'invalid'
        },
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '301',
          betrag: '100000'
        }
      ];

      const result = await aggregator.aggregateGdnData(
        dataWithInvalid,
        'aufwand',
        'test_entity',
        '2023'
      );

      // Should only process the valid record
      expect(result.metadata.totalRecords).toBe(1);

      const account301 = result.aggregatedData.find(d => d.code === '301');
      expect(account301?.value).toBe(100000);

      // Should not have account300 since its value was invalid
      const account300 = result.aggregatedData.find(d => d.code === '300');
      expect(account300).toBeUndefined();
    });

    it('should include metadata in result', async () => {
      const result = await aggregator.aggregateGdnData(
        mockGdnData,
        'aufwand',
        'test_entity',
        '2023'
      );

      expect(result.metadata).toMatchObject({
        treeStructure: mockTreeStructure,
        totalRecords: 3,
        dimension: 'aufwand'
      });
      expect(result.metadata.processedAt).toBeDefined();
    });
  });

  describe('aggregateStdData', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTreeStructure)
      });
    });

    it('should aggregate STD data correctly', async () => {
      const result = await aggregator.aggregateStdData(
        mockStdData,
        'aufwand',
        'test_entity',
        '2023',
        'fs'
      );

      expect(result.aggregatedData).toHaveLength(6);

      const rootData = result.aggregatedData.find(d => d.code === 'root');
      expect(rootData?.value).toBe(350000);

      expect(result.metadata.model).toBe('fs');
    });

    it('should filter data by dimension, model, and year', async () => {
      const mixedData: StdDataRecord[] = [
        ...mockStdData,
        {
          arten: '400',
          funk: '',
          jahr: '2022', // Different year
          value: '999999',
          dim: 'aufwand',
          hh: 'test_entity',
          unit: 'CHF',
          model: 'fs'
        },
        {
          arten: '401',
          funk: '',
          jahr: '2023',
          value: '888888',
          dim: 'ertrag', // Different dimension
          hh: 'test_entity',
          unit: 'CHF',
          model: 'fs'
        }
      ];

      const result = await aggregator.aggregateStdData(
          mixedData,
          'aufwand',
          'test_entity',
          '2023',
          'fs'
        )
      ;

      // Should only process records matching the criteria
      expect(result.metadata.totalRecords).toBe(3);
    });
  });

  describe('convenience functions', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTreeStructure)
      });
    });

    it('should work with aggregateGdnData convenience function', async () => {
      const result = await aggregateGdnData(
        mockGdnData,
        'aufwand',
        'test_entity',
        '2023'
      );

      expect(result.aggregatedData).toHaveLength(6);
      expect(result.metadata.dimension).toBe('aufwand');
    });

    it('should work with aggregateStdData convenience function', async () => {
      const result = await aggregateStdData(
        mockStdData,
        'aufwand',
        'test_entity',
        '2023',
        undefined,
        'fs'
      );

      expect(result.aggregatedData).toHaveLength(6);
      expect(result.metadata.model).toBe('fs');
    });

    it('should accept custom configuration', async () => {
      const result = await aggregateGdnData(
        mockGdnData,
        'aufwand',
        'test_entity',
        '2023',
        {language: 'en', includeZeroValues: true}
      );

      // Check that English labels are used
      const rootData = result.aggregatedData.find(d => d.code === 'root');
      expect(rootData?.label).toBe('Total');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTreeStructure)
      });
    });

    it('should handle empty data arrays', async () => {
      const result = await aggregator.aggregateGdnData(
        [],
        'aufwand',
        'test_entity',
        '2023'
      );

      expect(result.aggregatedData).toHaveLength(0);
      expect(result.metadata.totalRecords).toBe(0);
    });

    it('should handle data with no matching tree nodes', async () => {
      const unmatchedData: GdnDataRecord[] = [
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '999', // Not in tree structure
          betrag: '100000'
        }
      ];

      const result = await aggregator.aggregateGdnData(
        unmatchedData,
        'aufwand',
        'test_entity',
        '2023'
      );

      // Should still process the record but not find matching tree nodes
      expect(result.metadata.totalRecords).toBe(1);
      expect(result.aggregatedData).toHaveLength(0);
    });

    it('should clear cache correctly', async () => {
      // Load a tree structure
      await aggregator.loadTreeStructure('aufwand', 'fs');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      aggregator.clearCache();

      // Load again - should fetch again
      await aggregator.loadTreeStructure('aufwand', 'fs');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle malformed tree structure', async () => {
      const malformedTree = {
        metadata: {
          dimension: 'test',
          source: 'test',
          generatedAt: '2024-01-01T00:00:00.000Z',
          totalNodes: 1,
          maxDepth: 0
        },
        tree: null // Malformed tree
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(malformedTree)
      });

      await expect(aggregator.aggregateGdnData(
        mockGdnData,
        'test',
        'test_entity',
        '2023'
      )).rejects.toThrow();
    });

    it('should handle zero and negative values', async () => {
      const dataWithZeros: GdnDataRecord[] = [
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '300',
          betrag: '0'
        },
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '301',
          betrag: '-50000'
        }
      ];

      const result = await aggregator.aggregateGdnData(
        dataWithZeros,
        'aufwand',
        'test_entity',
        '2023'
      );

      const account301 = result.aggregatedData.find(d => d.code === '301');
      expect(account301?.value).toBe(-50000);
    });

    it('should handle function codes in GDN data', async () => {
      const dataWithFunction: GdnDataRecord[] = [
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '300',
          funktion: '0100',
          betrag: '75000'
        },
        {
          jahr: '2023',
          nr: '001',
          gemeinde: 'Test',
          konto: '300',
          funktion: '0200',
          betrag: '25000'
        }
      ];

      const result = await aggregator.aggregateGdnData(
        dataWithFunction,
        'aufwand',
        'test_entity',
        '2023'
      );

      // Should aggregate by konto-funktion combination
      expect(result.metadata.totalRecords).toBe(2);
    });

    it('should respect includeZeroValues configuration', async () => {
      const aggregatorWithZeros = new TreeAggregator({includeZeroValues: true});

      const result = await aggregatorWithZeros.aggregateGdnData(
        [], // Empty data should result in zero values
        'aufwand',
        'test_entity',
        '2023'
      );

      // With includeZeroValues: true, should include nodes with zero values
      expect(result.aggregatedData.length).toBeGreaterThan(0);

      aggregatorWithZeros.clearCache();
    });

    it('should handle different languages', async () => {
      const aggregatorFrench = new TreeAggregator({language: 'fr'});

      const result = await aggregatorFrench.aggregateGdnData(
        mockGdnData,
        'aufwand',
        'test_entity',
        '2023'
      );

      const rootData = result.aggregatedData.find(d => d.code === 'root');
      expect(rootData?.label).toBe('Total'); // French label

      aggregatorFrench.clearCache();
    });
  });

  describe('getAvailableTreeStructures', () => {
    it('should parse available tree structures from directory listing', async () => {
      const mockHtml = `
        <html>
          <body>
            <a href="aufwand-fs-tree.json">aufwand-fs-tree.json</a>
            <a href="ertrag-gfs-tree.json">ertrag-gfs-tree.json</a>
            <a href="bilanz-tree.json">bilanz-tree.json</a>
            <a href="other-file.txt">other-file.txt</a>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      });

      const result = await aggregator.getAvailableTreeStructures();

      expect(result).toEqual(['aufwand-fs', 'ertrag-gfs', 'bilanz']);
    });

    it('should handle empty directory listing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body></body></html>')
      });

      const result = await aggregator.getAvailableTreeStructures();

      expect(result).toEqual([]);
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await aggregator.getAvailableTreeStructures();

      expect(result).toEqual([]);
    });
  });
});
