/**
 * Utility for loading and working with the available data catalog
 */

import type { AvailableDataEntry, AvailableDataCatalog } from '../types/DataStructures';

/**
 * Load the available data catalog from the JSON file
 */
export async function loadAvailableDataCatalog(): Promise<AvailableDataCatalog> {
  try {
    const response = await fetch('/src/data/available-data.json');
    if (!response.ok) {
      throw new Error(`Failed to load available data catalog: ${response.statusText}`);
    }
    const catalog: AvailableDataCatalog = await response.json();
    return catalog;
  } catch (error) {
    console.error('Error loading available data catalog:', error);
    throw error;
  }
}

/**
 * Filter available data entries by type
 */
export function filterByType(catalog: AvailableDataCatalog, type: 'std' | 'gdn'): AvailableDataEntry[] {
  return catalog.filter(entry => entry.type === type);
}

/**
 * Filter available data entries by available years
 */
export function filterByYear(catalog: AvailableDataCatalog, year: string): AvailableDataEntry[] {
  return catalog.filter(entry => entry.availableYears.includes(year));
}

/**
 * Search available data entries by display name
 */
export function searchByName(catalog: AvailableDataCatalog, query: string, language: 'de' | 'fr' | 'it' | 'en' = 'de'): AvailableDataEntry[] {
  const lowerQuery = query.toLowerCase();
  return catalog.filter(entry => 
    entry.displayName[language].toLowerCase().includes(lowerQuery) ||
    entry.description[language].toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get available data entry by ID
 */
export function getById(catalog: AvailableDataCatalog, id: string): AvailableDataEntry | undefined {
  return catalog.find(entry => entry.id === id);
}

/**
 * Get available data entry by entity code
 */
export function getByEntityCode(catalog: AvailableDataCatalog, entityCode: string): AvailableDataEntry | undefined {
  return catalog.find(entry => entry.entityCode === entityCode);
}

/**
 * Get all unique years available across all entries
 */
export function getAllAvailableYears(catalog: AvailableDataCatalog): string[] {
  const allYears = new Set<string>();
  catalog.forEach(entry => {
    entry.availableYears.forEach(year => allYears.add(year));
  });
  return Array.from(allYears).sort();
}

/**
 * Get statistics about the catalog
 */
export function getCatalogStats(catalog: AvailableDataCatalog) {
  const stats = {
    total: catalog.length,
    gdn: catalog.filter(entry => entry.type === 'gdn').length,
    std: catalog.filter(entry => entry.type === 'std').length,
    years: getAllAvailableYears(catalog),
    yearRange: {
      earliest: '',
      latest: ''
    }
  };

  if (stats.years.length > 0) {
    stats.yearRange.earliest = stats.years[0];
    stats.yearRange.latest = stats.years[stats.years.length - 1];
  }

  return stats;
}

/**
 * Group entries by type for easier processing
 */
export function groupByType(catalog: AvailableDataCatalog): { gdn: AvailableDataEntry[], std: AvailableDataEntry[] } {
  return {
    gdn: filterByType(catalog, 'gdn'),
    std: filterByType(catalog, 'std')
  };
}

/**
 * Get municipalities (GDN entries) grouped by canton
 * This extracts canton information from municipality numbers
 */
export function getMunicipalitiesByCantonCode(catalog: AvailableDataCatalog): Map<string, AvailableDataEntry[]> {
  const gdnEntries = filterByType(catalog, 'gdn');
  const byCantonCode = new Map<string, AvailableDataEntry[]>();

  gdnEntries.forEach(entry => {
    if (entry.municipalityNumber) {
      // Swiss municipality numbers: first 2 digits indicate canton
      const cantonCode = entry.municipalityNumber.substring(0, 2);
      if (!byCantonCode.has(cantonCode)) {
        byCantonCode.set(cantonCode, []);
      }
      byCantonCode.get(cantonCode)!.push(entry);
    }
  });

  return byCantonCode;
}
