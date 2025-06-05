/**
 * Tests for AvailableDataLoader utility functions
 */

import { describe, it, expect } from 'vitest';
import type { AvailableDataCatalog } from '../../types/DataStructures';
import {
  filterByType,
  filterByYear,
  searchByName,
  getById,
  getByEntityCode,
  getAllAvailableYears,
  getCatalogStats,
  groupByType,
  getMunicipalitiesByCantonCode
} from '../AvailableDataLoader';

// Mock data that matches the AvailableDataEntry interface
const mockCatalog: AvailableDataCatalog = [
  {
    id: 'gdn_010002',
    type: 'gdn',
    entityCode: '010002',
    displayName: {
      de: 'Affoltern a.A.',
      fr: 'Affoltern a.A.',
      it: 'Affoltern a.A.',
      en: 'Affoltern a.A.'
    },
    description: {
      de: 'Finanzdaten der Gemeinde Affoltern a.A.',
      fr: 'Données financières de la commune Affoltern a.A.',
      it: 'Dati finanziari del comune Affoltern a.A.',
      en: 'Financial data for municipality Affoltern a.A.'
    },
    availableYears: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
    municipalityNumber: '010002'
  },
  {
    id: 'std_sv_ahv',
    type: 'std',
    entityCode: 'sv_ahv',
    displayName: {
      de: 'Alters- und Hinterlassenenversicherung',
      fr: 'Assurance-vieillesse et survivants',
      it: 'Assicurazione vecchiaia e superstiti',
      en: 'Old Age and Survivors Insurance'
    },
    description: {
      de: 'Sozialversicherungsdaten der Schweiz',
      fr: 'Données des assurances sociales suisses',
      it: 'Dati delle assicurazioni sociali svizzere',
      en: 'Swiss social insurance data'
    },
    availableYears: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
  },
  {
    id: 'std_gdn_ag',
    type: 'std',
    entityCode: 'gdn_ag',
    displayName: {
      de: 'Gemeinden Aargau',
      fr: 'Communes Argovie',
      it: 'Comuni Argovia',
      en: 'Municipalities Aargau'
    },
    description: {
      de: 'Alle Gemeinden des Kantons Aargau',
      fr: 'Toutes les communes du canton Argovie',
      it: 'Tutti i comuni del cantone Argovia',
      en: 'All municipalities of Canton Aargau'
    },
    availableYears: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
  },
  {
    id: 'gdn_194001',
    type: 'gdn',
    entityCode: '194001',
    displayName: {
      de: 'Aarau',
      fr: 'Aarau',
      it: 'Aarau',
      en: 'Aarau'
    },
    description: {
      de: 'Finanzdaten der Gemeinde Aarau',
      fr: 'Données financières de la commune Aarau',
      it: 'Dati finanziari del comune Aarau',
      en: 'Financial data for municipality Aarau'
    },
    availableYears: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
    municipalityNumber: '194001'
  }
];

describe('AvailableDataLoader', () => {
  describe('filterByType', () => {
    it('should filter GDN entries correctly', () => {
      const gdnEntries = filterByType(mockCatalog, 'gdn');
      expect(gdnEntries).toHaveLength(2);
      expect(gdnEntries.every(entry => entry.type === 'gdn')).toBe(true);
      expect(gdnEntries[0].municipalityNumber).toBeDefined();
    });

    it('should filter STD entries correctly', () => {
      const stdEntries = filterByType(mockCatalog, 'std');
      expect(stdEntries).toHaveLength(2);
      expect(stdEntries.every(entry => entry.type === 'std')).toBe(true);
      expect(stdEntries[0].municipalityNumber).toBeUndefined();
    });
  });

  describe('filterByYear', () => {
    it('should filter entries by available year', () => {
      const entriesFor2023 = filterByYear(mockCatalog, '2023');
      expect(entriesFor2023).toHaveLength(1);
      expect(entriesFor2023[0].id).toBe('std_sv_ahv');
    });

    it('should return multiple entries for common years', () => {
      const entriesFor2022 = filterByYear(mockCatalog, '2022');
      expect(entriesFor2022).toHaveLength(4);
    });
  });

  describe('searchByName', () => {
    it('should search by display name in German', () => {
      const results = searchByName(mockCatalog, 'Aargau', 'de');
      expect(results).toHaveLength(1); // Only "Gemeinden Aargau" contains "Aargau"
      expect(results[0].id).toBe('std_gdn_ag');
    });

    it('should search by description', () => {
      const results = searchByName(mockCatalog, 'Sozialversicherung', 'de');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('std_sv_ahv');
    });

    it('should be case insensitive', () => {
      const results = searchByName(mockCatalog, 'aarau', 'de');
      expect(results).toHaveLength(1); // Only "Aarau" municipality
      expect(results[0].id).toBe('gdn_194001');
    });
  });

  describe('getById', () => {
    it('should find entry by ID', () => {
      const entry = getById(mockCatalog, 'gdn_010002');
      expect(entry).toBeDefined();
      expect(entry?.displayName.de).toBe('Affoltern a.A.');
    });

    it('should return undefined for non-existent ID', () => {
      const entry = getById(mockCatalog, 'non_existent');
      expect(entry).toBeUndefined();
    });
  });

  describe('getByEntityCode', () => {
    it('should find entry by entity code', () => {
      const entry = getByEntityCode(mockCatalog, 'sv_ahv');
      expect(entry).toBeDefined();
      expect(entry?.type).toBe('std');
    });

    it('should return undefined for non-existent entity code', () => {
      const entry = getByEntityCode(mockCatalog, 'non_existent');
      expect(entry).toBeUndefined();
    });
  });

  describe('getAllAvailableYears', () => {
    it('should return all unique years sorted', () => {
      const years = getAllAvailableYears(mockCatalog);
      expect(years).toEqual(['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']);
    });
  });

  describe('getCatalogStats', () => {
    it('should return correct statistics', () => {
      const stats = getCatalogStats(mockCatalog);
      expect(stats.total).toBe(4);
      expect(stats.gdn).toBe(2);
      expect(stats.std).toBe(2);
      expect(stats.yearRange.earliest).toBe('2015');
      expect(stats.yearRange.latest).toBe('2023');
    });
  });

  describe('groupByType', () => {
    it('should group entries by type', () => {
      const grouped = groupByType(mockCatalog);
      expect(grouped.gdn).toHaveLength(2);
      expect(grouped.std).toHaveLength(2);
    });
  });

  describe('getMunicipalitiesByCantonCode', () => {
    it('should group municipalities by canton code', () => {
      const byCantonCode = getMunicipalitiesByCantonCode(mockCatalog);
      expect(byCantonCode.has('01')).toBe(true); // Zurich canton
      expect(byCantonCode.has('19')).toBe(true); // Aargau canton
      expect(byCantonCode.get('01')).toHaveLength(1);
      expect(byCantonCode.get('19')).toHaveLength(1);
    });
  });
});
