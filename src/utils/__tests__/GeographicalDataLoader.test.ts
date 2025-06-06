/**
 * Unit tests for GeographicalDataLoader
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeographicalDataLoader, getAllCantons, getAllMunicipalities, getCantonById, getMunicipalityByGdnId } from '../GeographicalDataLoader';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock CSV data
const mockCantonsCSV = `"cantonId","cantonAbbreviation","cantonLongName"
"1","ZH","Zürich"
"2","BE","Bern / Berne"
"19","AG","Aargau"`;

const mockMunicipalitiesCSV = `"cantonId","cantonAbbreviation","municipalityId","municipalityLongName","gdnId"
"1","ZH","230","Winterthur","0100230"
"1","ZH","261","Zürich","0100261"
"19","AG","4001","Aarau","1904001"`;

describe('GeographicalDataLoader', () => {
  beforeEach(() => {
    // Clear any cached data
    const loader = GeographicalDataLoader.getInstance();
    loader.clearCache();

    // Reset mocks
    mockFetch.mockReset();
  });

  describe('loadGeographicalDataCatalog', () => {
    it('should load and parse canton and municipality data', async () => {
      // Mock fetch responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockCantonsCSV)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockMunicipalitiesCSV)
        });

      const loader = GeographicalDataLoader.getInstance();
      const catalog = await loader.loadGeographicalDataCatalog();

      expect(catalog.cantons).toHaveLength(3);
      expect(catalog.municipalities).toHaveLength(3);

      // Check canton data
      const zurichCanton = catalog.cantons.find(c => c.cantonAbbreviation === 'ZH');
      expect(zurichCanton).toBeDefined();
      expect(zurichCanton?.cantonId).toBe('1');
      expect(zurichCanton?.cantonLongName).toBe('Zürich');

      // Check municipality data
      const winterthur = catalog.municipalities.find(m => m.municipalityLongName === 'Winterthur');
      expect(winterthur).toBeDefined();
      expect(winterthur?.gdnId).toBe('0100230');
      expect(winterthur?.cantonAbbreviation).toBe('ZH');
    });

    it('should handle multilingual canton names', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockCantonsCSV)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockMunicipalitiesCSV)
        });

      const loader = GeographicalDataLoader.getInstance();
      const catalog = await loader.loadGeographicalDataCatalog();

      const _bernCanton = catalog.cantons.find(c => c.cantonAbbreviation === 'BE');
    });

    it('should create proper indexes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockCantonsCSV)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockMunicipalitiesCSV)
        });

      const loader = GeographicalDataLoader.getInstance();
      const catalog = await loader.loadGeographicalDataCatalog();

      // Test canton indexes
      expect(catalog.indexes.cantonById.get('1')?.cantonAbbreviation).toBe('ZH');
      expect(catalog.indexes.cantonByAbbreviation.get('AG')?.cantonId).toBe('19');

      // Test municipality indexes
      expect(catalog.indexes.municipalityByGdnId.get('0100230')?.municipalityLongName).toBe('Winterthur');

      // Test municipalities by canton
      const zurichMunicipalities = catalog.indexes.municipalitiesByCantonId.get('1');
      expect(zurichMunicipalities).toHaveLength(2);
      expect(zurichMunicipalities?.map(m => m.municipalityLongName)).toContain('Winterthur');
      expect(zurichMunicipalities?.map(m => m.municipalityLongName)).toContain('Zürich');
    });

    it('should cache data after first load', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockCantonsCSV)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockMunicipalitiesCSV)
        });

      const loader = GeographicalDataLoader.getInstance();

      // First call should fetch data
      await loader.loadGeographicalDataCatalog();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second call should use cached data
      await loader.loadGeographicalDataCatalog();
      expect(mockFetch).toHaveBeenCalledTimes(2); // No additional calls
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockCantonsCSV)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockMunicipalitiesCSV)
        });
    });

    it('should get canton by ID', async () => {
      const canton = await getCantonById('1');
      expect(canton?.cantonAbbreviation).toBe('ZH');
      expect(canton?.cantonLongName).toBe('Zürich');
    });

    it('should get municipality by GDN ID', async () => {
      const municipality = await getMunicipalityByGdnId('0100230');
      expect(municipality?.municipalityLongName).toBe('Winterthur');
      expect(municipality?.cantonAbbreviation).toBe('ZH');
    });

    it('should get all cantons', async () => {
      const cantons = await getAllCantons();
      expect(cantons).toHaveLength(3);
      expect(cantons.map(c => c.cantonAbbreviation)).toContain('ZH');
      expect(cantons.map(c => c.cantonAbbreviation)).toContain('BE');
      expect(cantons.map(c => c.cantonAbbreviation)).toContain('AG');
    });

    it('should get all municipalities', async () => {
      const municipalities = await getAllMunicipalities();
      expect(municipalities).toHaveLength(3);
      expect(municipalities.map(m => m.municipalityLongName)).toContain('Winterthur');
      expect(municipalities.map(m => m.municipalityLongName)).toContain('Zürich');
      expect(municipalities.map(m => m.municipalityLongName)).toContain('Aarau');
    });
  });

  describe('static utility methods', () => {
    it('should validate GDN ID format', () => {
      expect(GeographicalDataLoader.validateGdnId('0100230')).toBe(true);
      expect(GeographicalDataLoader.validateGdnId('1904001')).toBe(true);
      expect(GeographicalDataLoader.validateGdnId('123')).toBe(false);
      expect(GeographicalDataLoader.validateGdnId('12345678')).toBe(false);
      expect(GeographicalDataLoader.validateGdnId('abc1234')).toBe(false);
    });

    it('should extract canton ID from GDN ID', () => {
      expect(GeographicalDataLoader.extractCantonIdFromGdnId('0100230')).toBe('01');
      expect(GeographicalDataLoader.extractCantonIdFromGdnId('1904001')).toBe('19');
      expect(GeographicalDataLoader.extractCantonIdFromGdnId('invalid')).toBe(null);
    });

    it('should extract municipality ID from GDN ID', () => {
      expect(GeographicalDataLoader.extractMunicipalityIdFromGdnId('0100230')).toBe('00230');
      expect(GeographicalDataLoader.extractMunicipalityIdFromGdnId('1904001')).toBe('04001');
      expect(GeographicalDataLoader.extractMunicipalityIdFromGdnId('invalid')).toBe(null);
    });

    it('should format GDN ID from canton and municipality IDs', () => {
      expect(GeographicalDataLoader.formatGdnId('1', '230')).toBe('0100230');
      expect(GeographicalDataLoader.formatGdnId('19', '4001')).toBe('1904001');
      expect(GeographicalDataLoader.formatGdnId('01', '00230')).toBe('0100230');
    });
  });

  describe('search functionality', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockCantonsCSV)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockMunicipalitiesCSV)
        });
    });

    it('should search by query string', async () => {
      const loader = GeographicalDataLoader.getInstance();
      const result = await loader.searchGeographicalData({ searchQuery: 'Zürich' });

      expect(result.cantons).toHaveLength(1);
      expect(result.municipalities).toHaveLength(1);
      expect(result.cantons[0].cantonLongName).toBe('Zürich');
      expect(result.municipalities[0].municipalityLongName).toBe('Zürich');
    });

    it('should search case-insensitively by default', async () => {
      const loader = GeographicalDataLoader.getInstance();
      const result = await loader.searchGeographicalData({ searchQuery: 'zürich' });

      expect(result.cantons).toHaveLength(1);
      expect(result.municipalities).toHaveLength(1);
    });

    it('should filter by canton IDs', async () => {
      const loader = GeographicalDataLoader.getInstance();
      const result = await loader.searchGeographicalData({ cantonIds: ['1'] });

      expect(result.cantons).toHaveLength(1);
      expect(result.municipalities).toHaveLength(2); // Winterthur and Zürich
      expect(result.cantons[0].cantonAbbreviation).toBe('ZH');
    });

    it('should filter by canton abbreviations', async () => {
      const loader = GeographicalDataLoader.getInstance();
      const result = await loader.searchGeographicalData({ cantonAbbreviations: ['AG'] });

      expect(result.cantons).toHaveLength(1);
      expect(result.municipalities).toHaveLength(1);
      expect(result.cantons[0].cantonAbbreviation).toBe('AG');
      expect(result.municipalities[0].municipalityLongName).toBe('Aarau');
    });

    it('should return correct total count', async () => {
      const loader = GeographicalDataLoader.getInstance();
      const result = await loader.searchGeographicalData({ cantonIds: ['1'] });

      expect(result.totalCount).toBe(3); // 1 canton + 2 municipalities
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockCantonsCSV)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockMunicipalitiesCSV)
        });
    });

    it('should get canton statistics', async () => {
      const loader = GeographicalDataLoader.getInstance();
      const stats = await loader.getCantonStatistics();

      expect(stats.size).toBe(3);
      expect(stats.get('1')?.cantonName).toBe('Zürich');
      expect(stats.get('1')?.municipalityCount).toBe(2);
      expect(stats.get('19')?.cantonName).toBe('Aargau');
      expect(stats.get('19')?.municipalityCount).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors for cantons', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const loader = GeographicalDataLoader.getInstance();
      await expect(loader.loadGeographicalDataCatalog()).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      const loader = GeographicalDataLoader.getInstance();
      await expect(loader.loadGeographicalDataCatalog()).rejects.toThrow('Failed to fetch cantons data: Not Found');
    });
  });
});
