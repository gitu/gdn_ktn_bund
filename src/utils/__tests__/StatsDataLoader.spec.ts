import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatsDataLoader } from '../StatsDataLoader';
import type { StatsCatalog } from '@/types/StatsData';

/* eslint @typescript-eslint/no-explicit-any: 0 */

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn()
  },
  parse: vi.fn()
}));

import * as Papa from 'papaparse';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockPapaParse = vi.mocked(Papa.parse);

// Mock stats catalog
const mockStatsCatalog: StatsCatalog = {
  stats: [
    {
      id: 'pop',
      name: {
        de: 'Anzahl Einwohner/-innen am Jahresende',
        fr: 'Nombre d\'habitants à la fin de l\'année',
        it: 'Numero di abitanti alla fine dell\'anno',
        en: 'Number of inhabitants at the end of the year'
      },
      unit: {
        de: 'Einwohner/Innen',
        fr: 'Habitants',
        it: 'Abitanti',
        en: 'Inhabitants'
      },
      mode: 'absolute',
      source: 'STATPOP via atlas.bfs.admin.ch',
      lastUpdate: '2024-08-21',
      data: {
        ktn: [
          {
            year: 2023,
            file: 'pop/ktn/2023.csv',
            atlasId: '27862'
          }
        ],
        gdn: [
          {
            year: 2023,
            file: 'pop/gdn/2023.csv',
            atlasId: '27864'
          }
        ]
      }
    }
  ]
};

// Mock CSV data
const mockKtnCsvData = `"GEO_ID";"GEO_NAME";"VARIABLE";VALUE;"UNIT";"STATUS";"STATUS_DESC";"DESC_VAL";"PERIOD_REF";"SOURCE";"LAST_UPDATE";"GEOM_CODE";"GEOM";"GEOM_PERIOD";"MAP_ID";"MAP_URL"
"1";"Zürich";"Anzahl Einwohner/-innen am Jahresende";1605508;"Einwohner/Innen";"A";"Normaler Wert";"";"2023-12-31";"BFS";"2024-07-24";"kant";"Kantone";"2022-01-01";"27862";"https://example.com"
"2";"Bern";"Anzahl Einwohner/-innen am Jahresende";1063533;"Einwohner/Innen";"A";"Normaler Wert";"";"2023-12-31";"BFS";"2024-07-24";"kant";"Kantone";"2022-01-01";"27862";"https://example.com"`;

const _mockGdnCsvData = `"GEO_ID";"GEO_NAME";"VARIABLE";VALUE;"UNIT";"STATUS";"STATUS_DESC";"DESC_VAL";"PERIOD_REF";"SOURCE";"LAST_UPDATE";"GEOM_CODE";"GEOM";"GEOM_PERIOD";"MAP_ID";"MAP_URL"
"1";"Aeugst am Albis";"Anzahl Einwohner/-innen am Jahresende";1998;"Einwohner/Innen";"A";"Normaler Wert";"";"2023-12-31";"BFS";"2024-08-08";"polg";"Politische Gemeinden";"2023-01-01";"27864";"https://example.com"
"2";"Affoltern am Albis";"Anzahl Einwohner/-innen am Jahresende";12859;"Einwohner/Innen";"A";"Normaler Wert";"";"2023-12-31";"BFS";"2024-08-08";"polg";"Politische Gemeinden";"2023-01-01";"27864";"https://example.com"`;

describe('StatsDataLoader', () => {
  let loader: StatsDataLoader;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset singleton instance
    (StatsDataLoader as any).instance = null;

    loader = StatsDataLoader.getInstance();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const loader1 = StatsDataLoader.getInstance();
      const loader2 = StatsDataLoader.getInstance();
      expect(loader1).toBe(loader2);
    });

    it('should accept configuration options', () => {
      const config = { language: 'de' as const, validateData: false };
      const configuredLoader = StatsDataLoader.getInstance(config);
      expect(configuredLoader).toBeInstanceOf(StatsDataLoader);
    });
  });

  describe('loadStatsCatalog', () => {
    it('should load stats catalog successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsCatalog)
      });

      const catalog = await loader.loadStatsCatalog();

      expect(catalog).toEqual(mockStatsCatalog);
      expect(catalog.stats).toHaveLength(1);
      expect(catalog.stats[0].id).toBe('pop');
      expect(mockFetch).toHaveBeenCalledWith('/data/stats/stats.json');
    });

    it('should cache catalog after first load', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsCatalog)
      });

      await loader.loadStatsCatalog();
      await loader.loadStatsCatalog();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(loader.loadStatsCatalog()).rejects.toThrow('Failed to load stats catalog');
    });
  });

  describe('getAvailableStats', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsCatalog)
      });
    });

    it('should return available statistics information', async () => {
      const availableStats = await loader.getAvailableStats();

      expect(availableStats).toHaveLength(1);
      expect(availableStats[0]).toEqual({
        id: 'pop',
        name: mockStatsCatalog.stats[0].name,
        unit: mockStatsCatalog.stats[0].unit,
        availableKtnYears: [2023],
        availableGdnYears: [2023],
        source: 'STATPOP via atlas.bfs.admin.ch',
        lastUpdate: '2024-08-21'
      });
    });
  });

  describe('getStatsEntry', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsCatalog)
      });
    });

    it('should return stats entry by ID', async () => {
      const entry = await loader.getStatsEntry('pop');
      expect(entry).toEqual(mockStatsCatalog.stats[0]);
    });

    it('should return null for non-existent ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsCatalog)
      });

      const entry = await loader.getStatsEntry('nonexistent');
      expect(entry).toBeNull();
    });
  });

  describe('loadKtnData', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatsCatalog)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockKtnCsvData)
        });

      mockPapaParse.mockReturnValue({
        data: [
          {
            GEO_ID: '1',
            GEO_NAME: 'Zürich',
            VARIABLE: 'Anzahl Einwohner/-innen am Jahresende',
            VALUE: '1605508',
            UNIT: 'Einwohner/Innen',
            STATUS: 'A',
            STATUS_DESC: 'Normaler Wert',
            DESC_VAL: '',
            PERIOD_REF: '2023-12-31',
            SOURCE: 'BFS',
            LAST_UPDATE: '2024-07-24',
            GEOM_CODE: 'kant',
            GEOM: 'Kantone',
            GEOM_PERIOD: '2022-01-01',
            MAP_ID: '27862',
            MAP_URL: 'https://example.com'
          },
          {
            GEO_ID: '2',
            GEO_NAME: 'Bern',
            VARIABLE: 'Anzahl Einwohner/-innen am Jahresende',
            VALUE: '1063533',
            UNIT: 'Einwohner/Innen',
            STATUS: 'A',
            STATUS_DESC: 'Normaler Wert',
            DESC_VAL: '',
            PERIOD_REF: '2023-12-31',
            SOURCE: 'BFS',
            LAST_UPDATE: '2024-07-24',
            GEOM_CODE: 'kant',
            GEOM: 'Kantone',
            GEOM_PERIOD: '2022-01-01',
            MAP_ID: '27862',
            MAP_URL: 'https://example.com'
          }
        ],
        errors: []
      } as any);
    });

    it('should load canton data successfully', async () => {
      const result = await loader.loadKtnData('pop', 2023);
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        geoId: '1',
        geoName: 'Zürich',
        value: 1605508,
        unit: 'Einwohner/Innen',
        year: 2023,
        status: 'A',
        source: 'BFS',
        lastUpdate: '2024-07-24'
      });
      
      expect(result.metadata.dataType).toBe('ktn');
      expect(result.metadata.year).toBe(2023);
      expect(result.metadata.recordCount).toBe(2);
    });

    it('should apply filters correctly', async () => {
      const result = await loader.loadKtnData('pop', 2023, { geoIds: ['1'] });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].geoId).toBe('1');
    });

    it('should handle non-existent stats ID', async () => {
      await expect(loader.loadKtnData('nonexistent', 2023)).rejects.toThrow('Statistics entry not found');
    });

    it('should use nearest year when requested year is not available', async () => {
      const result = await loader.loadKtnData('pop', 2022);

      // Should use 2023 (nearest available year) instead of 2022
      expect(result.metadata.year).toBe(2023);
      expect(result.metadata.requestedYear).toBe(2022);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].year).toBe(2023); // Data should reflect actual year used
    });

    it('should not set requestedYear when exact year is available', async () => {
      const result = await loader.loadKtnData('pop', 2023);

      // Should use exact year and not set requestedYear
      expect(result.metadata.year).toBe(2023);
      expect(result.metadata.requestedYear).toBeUndefined();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getBundData', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatsCatalog)
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockKtnCsvData)
        });

      mockPapaParse.mockReturnValue({
        data: [
          {
            GEO_ID: '1',
            GEO_NAME: 'Zürich',
            VALUE: '1605508',
            UNIT: 'Einwohner/Innen',
            STATUS: 'A',
            SOURCE: 'BFS',
            LAST_UPDATE: '2024-07-24'
          },
          {
            GEO_ID: '2',
            GEO_NAME: 'Bern',
            VALUE: '1063533',
            UNIT: 'Einwohner/Innen',
            STATUS: 'A',
            SOURCE: 'BFS',
            LAST_UPDATE: '2024-07-24'
          }
        ],
        errors: []
      } as any);
    });

    it('should aggregate canton data for federal level', async () => {
      const result = await loader.getBundData('pop', 2023);
      
      expect(result.totalValue).toBe(2669041); // 1605508 + 1063533
      expect(result.unit).toBe('Einwohner/Innen');
      expect(result.year).toBe(2023);
      expect(result.cantonCount).toBe(2);
      expect(result.metadata.sourceDataType).toBe('ktn');
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsCatalog)
      });
    });

    it('should get available years', async () => {
      const years = await loader.getAvailableYears('pop');

      expect(years.ktn).toEqual([2023]);
      expect(years.gdn).toEqual([2023]);
    });

    it('should handle non-existent stats ID for available years', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatsCatalog)
      });

      await expect(loader.getAvailableYears('nonexistent')).rejects.toThrow('Statistics entry not found');
    });
  });
});
