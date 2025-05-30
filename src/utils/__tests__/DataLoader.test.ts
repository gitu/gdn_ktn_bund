/**
 * Tests for DataLoader utility functions
 *
 * These tests verify the data loading functionality for Swiss financial data.
 * The tests cover path construction, data existence checks, and data loading.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  constructDataPath,
  checkDataExists,
  loadEntityData,
  getAvailableYears,
  getLatestYear,
  getAvailableMunicipalities,
  clearCache,
  getCacheStats
} from '../DataLoader';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Papa.parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn((csvText: string, options: { complete: (result: { data: Record<string, string>[]; errors: unknown[] }) => void }) => {
      // Simple mock implementation that returns parsed data
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map((h: string) => h.trim());

      const data = lines.slice(1)
        .filter((line: string) => line.trim() !== '')
        .map((line: string) => {
          const values = line.split(',').map((v: string) => v.trim());
          const record: Record<string, string> = {};

          headers.forEach((header: string, index: number) => {
            if (header && index < values.length) {
              record[header] = values[index];
            }
          });

          return record;
        });

      options.complete({ data, errors: [] });
    })
  }
}));

// Mock GDN CSV data
const mockGdnCsvData = `jahr,nr,gemeinde,konto,funktion,betrag
2020,010176,Lindau,30,0,1000000
2020,010176,Lindau,31,0,500000
2020,010176,Lindau,40,0,1500000`;

// Mock STD CSV data
const mockStdCsvData = `arten,funk,jahr,value,dim,hh,unit,model
2,0,2020,1000000,ausgaben,ktn_zh,CHF,fs
21,0,2020,500000,ausgaben,ktn_zh,CHF,fs
3,0,2020,1500000,einnahmen,ktn_zh,CHF,fs`;

describe('DataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('constructDataPath', () => {
    it('should construct correct path for GDN entity (6-digit ID)', () => {
      const path = constructDataPath('010176', '2020', 'fs');
      expect(path).toBe('/data/gdn/010176/2020.csv');
    });

    it('should construct correct path for STD entity (non-6-digit ID)', () => {
      const path = constructDataPath('ktn_zh', '2020', 'fs');
      expect(path).toBe('/data/std/fs/ktn_zh/2020.csv');
    });

    it('should use default model if not provided', () => {
      const path = constructDataPath('ktn_zh', '2020');
      expect(path).toBe('/data/std/fs/ktn_zh/2020.csv');
    });

    it('should handle different models for STD entities', () => {
      const path = constructDataPath('ktn_zh', '2020', 'gfs');
      expect(path).toBe('/data/std/gfs/ktn_zh/2020.csv');
    });
  });

  describe('checkDataExists', () => {
    it('should return true when file exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      const exists = await checkDataExists('010176', '2020');
      expect(exists).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/data/gdn/010176/2020.csv', { method: 'HEAD' });
    });

    it('should return false when file does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      const exists = await checkDataExists('nonexistent', '2020');
      expect(exists).toBe(false);
    });

    it('should return false when fetch throws an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const exists = await checkDataExists('010176', '2020');
      expect(exists).toBe(false);
    });

    it('should use correct path for STD entities', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      await checkDataExists('ktn_zh', '2020', 'gfs');
      expect(mockFetch).toHaveBeenCalledWith('/data/std/gfs/ktn_zh/2020.csv', { method: 'HEAD' });
    });
  });

  describe('loadEntityData', () => {
    it('should load and parse GDN data correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockGdnCsvData)
      });

      const data = await loadEntityData('010176', '2020');

      expect(data).toBeDefined();
      expect(data.length).toBe(3);
      expect(data[0]).toMatchObject({
        jahr: '2020',
        nr: '010176',
        gemeinde: 'Lindau',
        konto: '30',
        funktion: '0',
        betrag: 1000000
      });
    });

    it('should load and parse STD data correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockStdCsvData)
      });

      const data = await loadEntityData('ktn_zh', '2020');

      expect(data).toBeDefined();
      expect(data.length).toBe(3);
      expect(data[0]).toMatchObject({
        jahr: '2020',
        nr: 'ktn_zh', // STD records use hh as nr
        gemeinde: 'ktn_zh', // STD records use hh as gemeinde
        konto: '2', // STD records use arten as konto
        funktion: '0', // STD records use funk as funktion
        betrag: 1000000 // STD records use value as betrag (converted to number)
      });
    });

    it('should cache loaded data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockGdnCsvData)
      });

      // First call should fetch data
      await loadEntityData('010176', '2020');

      // Second call should use cached data
      await loadEntityData('010176', '2020');

      // Fetch should only be called once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(loadEntityData('010176', '2020')).rejects.toThrow();
    });

    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loadEntityData('010176', '2020')).rejects.toThrow('Failed to fetch CSV file: 404 Not Found');
    });
  });

  describe('Cache management', () => {
    it('should clear cache correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockGdnCsvData)
      });

      await loadEntityData('010176', '2020');

      const statsBefore = getCacheStats();
      expect(statsBefore.size).toBe(1);

      clearCache();

      const statsAfter = getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    it('should report correct cache stats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGdnCsvData)
      });

      await loadEntityData('010176', '2020');
      await loadEntityData('010176', '2021');

      const stats = getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('010176_2020_fs');
      expect(stats.keys).toContain('010176_2021_fs');
    });
  });

  describe('Year and municipality utilities', () => {
    it('should return available years', () => {
      const years = getAvailableYears();
      expect(Array.isArray(years)).toBe(true);
      expect(years.length).toBeGreaterThan(0);
    });

    it('should return latest year', () => {
      const latestYear = getLatestYear();
      expect(typeof latestYear).toBe('string');
      expect(latestYear).toMatch(/^\d{4}$/);
    });

    it('should return available municipalities', () => {
      const municipalities = getAvailableMunicipalities();
      expect(Array.isArray(municipalities)).toBe(true);
      expect(municipalities.length).toBeGreaterThan(0);
      expect(municipalities).toContain('Zürich');
    });
  });
});
