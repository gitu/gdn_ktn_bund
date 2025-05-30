/**
 * Tests for EntityLoader utility functions
 *
 * These tests verify the entity loading functionality for Swiss financial data.
 * The tests cover loading GDN and STD entity information from JSON files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadGdnInfo,
  loadStdInfo,
  transformGdnToEntityOptions,
  transformStdToEntityOptions,
  loadAllEntityOptions,
  getEntityOptionsByType,
  getEntityOptionById,
  getAllAvailableYears,
  EntityLoadError,
  type GdnInfo,
  type StdInfo
} from '../EntityLoader';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock GDN JSON data
const mockGdnData: GdnInfo[] = [
  {
    nr: "010176",
    gemeinde: "Lindau",
    jahre: ["2020", "2021", "2022"]
  },
  {
    nr: "236141",
    gemeinde: "Zürich",
    jahre: ["2019", "2020", "2021", "2022"]
  }
];

// Mock STD JSON data
const mockStdData: StdInfo[] = [
  {
    hh: "ktn_zh",
    models: [
      {
        model: "fs",
        jahre: ["2020", "2021", "2022"]
      },
      {
        model: "gfs",
        jahre: ["2020", "2021"]
      }
    ]
  },
  {
    hh: "bund",
    models: [
      {
        model: "fs",
        jahre: ["2019", "2020", "2021", "2022"]
      }
    ]
  }
];

describe('EntityLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('loadGdnInfo', () => {
    it('should load and parse GDN info successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGdnData)
      });

      const result = await loadGdnInfo();

      expect(result).toEqual(mockGdnData);
      expect(mockFetch).toHaveBeenCalledWith('/data/gdn-info.json');
    });

    it('should throw EntityLoadError when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const promise = loadGdnInfo();
      await expect(promise).rejects.toThrow(EntityLoadError);
      await expect(promise).rejects.toThrow('Failed to fetch GDN info: 404 Not Found');
    });

    it('should throw EntityLoadError when data is not an array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' })
      });

      const promise = loadGdnInfo();
      await expect(promise).rejects.toThrow(EntityLoadError);
      await expect(promise).rejects.toThrow('GDN info data is not an array');
    });

    it('should validate GDN data structure', async () => {
      const invalidData = [
        { nr: "010176", gemeinde: "Lindau" } // Missing jahre
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidData)
      });

      const promise = loadGdnInfo();
      await expect(promise).rejects.toThrow(EntityLoadError);
      await expect(promise).rejects.toThrow('Invalid GDN info item structure');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(loadGdnInfo()).rejects.toThrow(EntityLoadError);
      await expect(loadGdnInfo()).rejects.toThrow('Failed to load GDN info');
    });
  });

  describe('loadStdInfo', () => {
    it('should load and parse STD info successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStdData)
      });

      const result = await loadStdInfo();

      expect(result).toEqual(mockStdData);
      expect(mockFetch).toHaveBeenCalledWith('/data/std-info.json');
    });

    it('should throw EntityLoadError when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const promise = loadStdInfo();
      await expect(promise).rejects.toThrow(EntityLoadError);
      await expect(promise).rejects.toThrow('Failed to fetch STD info: 500 Internal Server Error');
    });

    it('should validate STD data structure', async () => {
      const invalidData = [
        { hh: "ktn_zh" } // Missing models
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidData)
      });

      const promise = loadStdInfo();
      await expect(promise).rejects.toThrow(EntityLoadError);
      await expect(promise).rejects.toThrow('Invalid STD info item structure');
    });

    it('should validate STD model structure', async () => {
      const invalidData = [
        {
          hh: "ktn_zh",
          models: [
            { model: "fs" } // Missing jahre
          ]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidData)
      });

      const promise = loadStdInfo();
      await expect(promise).rejects.toThrow(EntityLoadError);
      await expect(promise).rejects.toThrow('Invalid STD model structure');
    });
  });

  describe('transformGdnToEntityOptions', () => {
    it('should transform GDN info to entity options correctly', () => {
      const result = transformGdnToEntityOptions(mockGdnData);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'gdn_010176',
        name: 'Lindau (GDN 010176)',
        type: 'GDN',
        availableYears: ['2020', '2021', '2022'],
        originalData: mockGdnData[0]
      });
      expect(result[1]).toMatchObject({
        id: 'gdn_236141',
        name: 'Zürich (GDN 236141)',
        type: 'GDN',
        availableYears: ['2019', '2020', '2021', '2022'],
        originalData: mockGdnData[1]
      });
    });

    it('should handle empty input', () => {
      const result = transformGdnToEntityOptions([]);
      expect(result).toEqual([]);
    });
  });

  describe('transformStdToEntityOptions', () => {
    it('should transform STD info to entity options correctly', () => {
      const result = transformStdToEntityOptions(mockStdData);

      expect(result).toHaveLength(2);

      // Check ktn_zh transformation
      expect(result[0]).toMatchObject({
        id: 'ktn_zh',
        name: 'Canton of ZH (KTN ZH)',
        type: 'STD',
        availableYears: ['2020', '2021', '2022'], // Combined from both models
        originalData: mockStdData[0]
      });

      // Check bund transformation
      expect(result[1]).toMatchObject({
        id: 'bund',
        name: 'Federal Government (BUND)',
        type: 'STD',
        availableYears: ['2019', '2020', '2021', '2022'],
        originalData: mockStdData[1]
      });
    });

    it('should combine years from multiple models', () => {
      const testData: StdInfo[] = [
        {
          hh: "test_entity",
          models: [
            { model: "fs", jahre: ["2020", "2021"] },
            { model: "gfs", jahre: ["2021", "2022"] }
          ]
        }
      ];

      const result = transformStdToEntityOptions(testData);
      expect(result[0].availableYears).toEqual(['2020', '2021', '2022']);
    });

    it('should handle different entity naming patterns', () => {
      const testData: StdInfo[] = [
        { hh: "bund", models: [{ model: "fs", jahre: ["2020"] }] },
        { hh: "ktn_be", models: [{ model: "fs", jahre: ["2020"] }] },
        { hh: "gdn_region", models: [{ model: "fs", jahre: ["2020"] }] },
        { hh: "other", models: [{ model: "fs", jahre: ["2020"] }] }
      ];

      const result = transformStdToEntityOptions(testData);

      expect(result[0].name).toBe('Federal Government (BUND)');
      expect(result[1].name).toBe('Canton of BE (KTN BE)');
      expect(result[2].name).toBe('Municipalities of REGION (GDN REGION)');
      expect(result[3].name).toBe('OTHER');
    });
  });

  describe('loadAllEntityOptions', () => {
    it('should load and combine all entity options', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGdnData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStdData)
        });

      const result = await loadAllEntityOptions();

      expect(result).toHaveLength(4); // 2 GDN + 2 STD

      const gdnOptions = result.filter(opt => opt.type === 'GDN');
      const stdOptions = result.filter(opt => opt.type === 'STD');

      expect(gdnOptions).toHaveLength(2);
      expect(stdOptions).toHaveLength(2);
    });

    it('should sort options by name', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGdnData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStdData)
        });

      const result = await loadAllEntityOptions();

      // Check that results are sorted alphabetically by name
      for (let i = 1; i < result.length; i++) {
        expect(result[i].name.localeCompare(result[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getEntityOptionsByType', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGdnData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStdData)
        });
    });

    it('should filter GDN entities correctly', async () => {
      const result = await getEntityOptionsByType('GDN');
      expect(result.every(opt => opt.type === 'GDN')).toBe(true);
    });

    it('should filter STD entities correctly', async () => {
      const result = await getEntityOptionsByType('STD');
      expect(result.every(opt => opt.type === 'STD')).toBe(true);
    });
  });

  describe('getEntityOptionById', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGdnData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStdData)
        });
    });

    it('should find entity by ID', async () => {
      const result = await getEntityOptionById('gdn_010176');
      expect(result).toBeDefined();
      expect(result!.id).toBe('gdn_010176');
      expect(result!.name).toBe('Lindau (GDN 010176)');
    });

    it('should return null for non-existent ID', async () => {
      const result = await getEntityOptionById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAllAvailableYears', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGdnData)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStdData)
        });
    });

    it('should return all unique years sorted', async () => {
      const result = await getAllAvailableYears();

      expect(result).toEqual(['2019', '2020', '2021', '2022']);
      expect(result).toEqual([...result].sort()); // Verify sorting
    });
  });
});
