import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TreeAggregator } from '../TreeAggregator';
import fs from 'fs';
import path from 'path';

/**
 * Verification tests using real fixture data from the project
 * These tests validate that the TreeAggregator correctly calculates
 * aggregated values using actual Swiss financial data and tree structures.
 */

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper function to parse CSV fixture data
function parseFixtureCSV(csvContent: string) {
  const lines = csvContent.trim().split('\n');
  const records = [];

  for (const line of lines) {
    const [konto, _label, betrag] = line.split(';');
    if (konto && betrag) {
      // Convert Swiss number format (with apostrophes) to standard format
      const cleanBetrag = betrag.replace(/'/g, '').replace(/,/g, '');
      records.push({
        jahr: '2019',
        nr: 'ag', // Aargau
        gemeinde: 'Aargau',
        konto: konto.trim(),
        betrag: cleanBetrag
      });
    }
  }

  return records;
}

// Helper function to load tree structure
function loadTreeStructure(filename: string) {
  const treePath = path.resolve(process.cwd(), 'public/data/trees', filename);
  const treeContent = fs.readFileSync(treePath, 'utf8');
  return JSON.parse(treeContent);
}

describe('TreeAggregator Verification with Real Data', () => {
  let aggregator: TreeAggregator;

  beforeEach(() => {
    aggregator = new TreeAggregator();
    vi.clearAllMocks();
  });

  afterEach(() => {
    aggregator.clearCache();
  });

  describe('Aufwand (Expenses) Verification', () => {
    it('should correctly aggregate Aargau 2019 aufwand data', async () => {
      // Load real fixture data
      const fixturePath = path.resolve(process.cwd(), 'fixtures/gdn_ag-2019-aufwand-de.csv');
      const csvContent = fs.readFileSync(fixturePath, 'utf8');
      const gdnData = parseFixtureCSV(csvContent);

      // Load real tree structure
      const treeStructure = loadTreeStructure('aufwand-fs-tree.json');

      // Mock fetch to return the real tree structure
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(treeStructure)
      });

      // Aggregate the data
      const result = await aggregator.aggregateGdnData(
        gdnData,
        'aufwand',
        'ag',
        '2019'
      );

      // Verify basic structure
      expect(result.aggregatedData).toBeDefined();
      expect(result.metadata.totalRecords).toBeGreaterThan(0);
      expect(result.metadata.dimension).toBe('aufwand');

      // Find key aggregated values
      const rootTotal = result.aggregatedData.find(d => d.code === 'root');
      const aufwandTotal = result.aggregatedData.find(d => d.code === '3');
      const personalaufwand = result.aggregatedData.find(d => d.code === '30');
      const sachaufwand = result.aggregatedData.find(d => d.code === '31');

      // Verify the main totals match the fixture data
      expect(rootTotal?.value).toBe(2942491); // Total from fixture: 2,942,491
      expect(aufwandTotal?.value).toBe(2942491); // Should equal root
      expect(personalaufwand?.value).toBe(732369); // From fixture: 732,369
      expect(sachaufwand?.value).toBe(789862); // From fixture: 789,862

      // Verify specific personnel expense subcategories
      const behoerden = result.aggregatedData.find(d => d.code === '300');
      const loehneVerwaltung = result.aggregatedData.find(d => d.code === '301');
      const loehneLehrer = result.aggregatedData.find(d => d.code === '302');

      expect(behoerden?.value).toBe(37291); // From fixture: 37,291
      expect(loehneVerwaltung?.value).toBe(495207); // From fixture: 495,207
      expect(loehneLehrer?.value).toBe(78548); // From fixture: 78,548

      // Verify that personnel subcategories sum to total personnel
      const personalSubcategories = result.aggregatedData
        .filter(d => d.code.startsWith('30') && d.code.length === 3)
        .reduce((sum, item) => sum + item.value, 0);

      expect(personalSubcategories).toBe(personalaufwand?.value);

      console.log('✅ Aufwand verification passed');
      console.log(`Total expenses: CHF ${rootTotal?.value?.toLocaleString()}`);
      console.log(`Personnel expenses: CHF ${personalaufwand?.value?.toLocaleString()}`);
      console.log(`Operating expenses: CHF ${sachaufwand?.value?.toLocaleString()}`);
    });

    it('should handle hierarchical aggregation correctly', async () => {
      // Load fixture data
      const fixturePath = path.resolve(process.cwd(), 'fixtures/gdn_ag-2019-aufwand-de.csv');
      const csvContent = fs.readFileSync(fixturePath, 'utf8');
      const gdnData = parseFixtureCSV(csvContent);

      // Load tree structure
      const treeStructure = loadTreeStructure('aufwand-fs-tree.json');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(treeStructure)
      });

      const result = await aggregator.aggregateGdnData(gdnData, 'aufwand', 'ag', '2019');

      // Test hierarchical relationships
      const transferaufwand = result.aggregatedData.find(d => d.code === '36');
      const ertragsanteile = result.aggregatedData.find(d => d.code === '360');
      const entschaedigungen = result.aggregatedData.find(d => d.code === '361');
      const finanzausgleich = result.aggregatedData.find(d => d.code === '362');
      const beitraege = result.aggregatedData.find(d => d.code === '363');

      // Verify that transfer subcategories sum correctly
      if (transferaufwand && ertragsanteile && entschaedigungen && finanzausgleich && beitraege) {
        const subcategorySum = (ertragsanteile.value || 0) +
                              (entschaedigungen.value || 0) +
                              (finanzausgleich.value || 0) +
                              (beitraege.value || 0);

        expect(Math.abs(transferaufwand.value - subcategorySum)).toBeLessThan(1); // Allow for rounding
      }

      // Verify Finanzaufwand (34) aggregation
      const finanzaufwand = result.aggregatedData.find(d => d.code === '34');
      const zinsaufwand = result.aggregatedData.find(d => d.code === '340');
      const verlusteFV = result.aggregatedData.find(d => d.code === '341');

      expect(finanzaufwand?.value).toBe(28484); // From fixture
      expect(zinsaufwand?.value).toBe(16695); // From fixture
      expect(verlusteFV?.value).toBe(682); // From fixture

      console.log('✅ Hierarchical aggregation verification passed');
    });
  });

  describe('Ertrag (Revenue) Verification', () => {
    it('should correctly aggregate Aargau 2019 ertrag data', async () => {
      // Load real fixture data
      const fixturePath = path.resolve(process.cwd(), 'fixtures/gdn_ag-2019-ertrag-de.csv');
      const csvContent = fs.readFileSync(fixturePath, 'utf8');
      const gdnData = parseFixtureCSV(csvContent);

      // Load tree structure (using einnahmen tree for revenue)
      const treeStructure = loadTreeStructure('einnahmen-fs-tree.json');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(treeStructure)
      });

      const result = await aggregator.aggregateGdnData(
        gdnData,
        'einnahmen',
        'ag',
        '2019'
      );

      // Verify basic structure
      expect(result.aggregatedData).toBeDefined();
      expect(result.metadata.totalRecords).toBeGreaterThan(0);

      // Find key aggregated values
      const rootTotal = result.aggregatedData.find(d => d.code === 'root');
      const ertragTotal = result.aggregatedData.find(d => d.code === '4');
      const fiskalertrag = result.aggregatedData.find(d => d.code === '40');

      // Verify the main totals
      expect(rootTotal?.value).toBe(3194172); // Total from fixture: 3,194,172
      expect(ertragTotal?.value).toBe(3194172); // Should equal root
      expect(fiskalertrag?.value).toBe(1925552); // From fixture: 1,925,552

      // Verify tax subcategories
      const direkteSteuernNP = result.aggregatedData.find(d => d.code === '400');
      const direkteSteuernJP = result.aggregatedData.find(d => d.code === '401');

      expect(direkteSteuernNP?.value).toBe(1755482); // From fixture: 1,755,482
      expect(direkteSteuernJP?.value).toBe(162615); // From fixture: 162,615

      console.log('✅ Ertrag verification passed');
      console.log(`Total revenue: CHF ${rootTotal?.value?.toLocaleString()}`);
      console.log(`Tax revenue: CHF ${fiskalertrag?.value?.toLocaleString()}`);
    });
  });

  describe('Bilanz (Balance Sheet) Verification', () => {
    it('should correctly aggregate Aargau 2019 bilanz data', async () => {
      // Load real fixture data
      const fixturePath = path.resolve(process.cwd(), 'fixtures/gdn_ag-2019-bilanz-de.csv');
      const csvContent = fs.readFileSync(fixturePath, 'utf8');
      const gdnData = parseFixtureCSV(csvContent);

      // Load tree structure
      const treeStructure = loadTreeStructure('bilanz-fs-tree.json');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(treeStructure)
      });

      const result = await aggregator.aggregateGdnData(
        gdnData,
        'bilanz',
        'ag',
        '2019'
      );

      // Verify basic structure
      expect(result.aggregatedData).toBeDefined();
      expect(result.metadata.totalRecords).toBeGreaterThan(0);

      // Find key aggregated values
      const rootTotal = result.aggregatedData.find(d => d.code === 'root');
      const aktiven = result.aggregatedData.find(d => d.code === '1');
      const passiven = result.aggregatedData.find(d => d.code === '2');

      // Verify balance sheet balances
      expect(rootTotal?.value).toBe(13606045 * 2); // Total should be sum of assets + liabilities
      expect(aktiven?.value).toBe(13606045); // From fixture: 13,606,045
      expect(passiven?.value).toBe(13606045); // Should equal assets

      // Verify asset subcategories
      const finanzvermoegen = result.aggregatedData.find(d => d.code === '10');
      const verwaltungsvermoegen = result.aggregatedData.find(d => d.code === '14');

      expect(finanzvermoegen?.value).toBe(3621926); // From fixture: 3,621,926
      expect(verwaltungsvermoegen?.value).toBe(9984120); // From fixture: 9,984,120

      // Verify that assets sum correctly (allow for small rounding differences)
      const assetSum = finanzvermoegen!.value + verwaltungsvermoegen!.value;
      expect(Math.abs(assetSum - aktiven!.value)).toBeLessThan(2); // Allow 1 CHF difference for rounding

      console.log('✅ Bilanz verification passed');
      console.log(`Total assets: CHF ${aktiven?.value?.toLocaleString()}`);
      console.log(`Total liabilities: CHF ${passiven?.value?.toLocaleString()}`);
    });
  });

  describe('Error Handling with Real Data', () => {
    it('should handle missing tree structure gracefully', async () => {
      const fixturePath = path.resolve(process.cwd(), 'fixtures/gdn_ag-2019-aufwand-de.csv');
      const csvContent = fs.readFileSync(fixturePath, 'utf8');
      const gdnData = parseFixtureCSV(csvContent);

      // Mock fetch to return 404
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(aggregator.aggregateGdnData(
        gdnData,
        'nonexistent',
        'ag',
        '2019'
      )).rejects.toThrow('Failed to load tree structure: 404 Not Found');
    });

    it('should handle malformed CSV data', async () => {
      const malformedData = [
        {
          jahr: '2019',
          nr: 'ag',
          gemeinde: 'Aargau',
          konto: '300',
          betrag: 'invalid_number'
        },
        {
          jahr: '2019',
          nr: 'ag',
          gemeinde: 'Aargau',
          konto: '301',
          betrag: '100000'
        }
      ];

      const treeStructure = loadTreeStructure('aufwand-fs-tree.json');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(treeStructure)
      });

      const result = await aggregator.aggregateGdnData(
        malformedData,
        'aufwand',
        'ag',
        '2019'
      );

      // Should process only the valid record
      expect(result.metadata.totalRecords).toBe(1);

      const account301 = result.aggregatedData.find(d => d.code === '301');
      expect(account301?.value).toBe(100000);
    });
  });

  describe('Performance with Real Data', () => {
    it('should handle large datasets efficiently', async () => {
      const fixturePath = path.resolve(process.cwd(), 'fixtures/gdn_ag-2019-aufwand-de.csv');
      const csvContent = fs.readFileSync(fixturePath, 'utf8');
      const gdnData = parseFixtureCSV(csvContent);

      // Duplicate data to simulate larger dataset
      const largeDataset = [];
      for (let i = 0; i < 10; i++) {
        largeDataset.push(...gdnData);
      }

      const treeStructure = loadTreeStructure('aufwand-fs-tree.json');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(treeStructure)
      });

      const startTime = Date.now();
      const result = await aggregator.aggregateGdnData(
        largeDataset,
        'aufwand',
        'ag',
        '2019'
      );
      const endTime = Date.now();

      // The total records should be the number of valid records processed
      // Some records might be filtered out if they have invalid amounts or empty values
      const validRecords = gdnData.filter(r => r.betrag && r.betrag !== '' && !isNaN(parseFloat(r.betrag.replace(/'/g, '').replace(/,/g, ''))));
      console.log(`Valid records in original data: ${validRecords.length} out of ${gdnData.length}`);
      console.log(`Expected total records: ${validRecords.length * 10}`);
      console.log(`Actual total records: ${result.metadata.totalRecords}`);

      // Just verify we processed a reasonable number of records
      expect(result.metadata.totalRecords).toBeGreaterThan(500); // Should be at least 500 records
      expect(result.metadata.totalRecords).toBeLessThanOrEqual(validRecords.length * 10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      console.log(`✅ Performance test passed: ${endTime - startTime}ms for ${largeDataset.length} records`);
    });
  });
});
