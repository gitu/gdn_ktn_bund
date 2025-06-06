/**
 * TypeScript interfaces for Swiss geographical data (cantons and municipalities)
 */

import type { MultiLanguageLabels } from './DataStructures'

/**
 * Swiss canton information
 */
export interface Canton {
  /** Canton ID (1-26) */
  cantonId: string
  /** Canton abbreviation (e.g., "ZH", "BE", "AG") */
  cantonAbbreviation: string
  /** Canton long name (e.g., "Zürich", "Bern / Berne") */
  cantonLongName: string
}

/**
 * Swiss municipality information
 */
export interface Municipality {
  /** Canton ID this municipality belongs to */
  cantonId: string
  /** Canton abbreviation */
  cantonAbbreviation: string
  /** Municipality ID within the canton */
  municipalityId: string
  /** Municipality long name */
  municipalityLongName: string
  /** GDN ID (formatted as canton + municipality ID) */
  gdnId: string
}

/**
 * Geographical data catalog containing all cantons and municipalities
 */
export interface GeographicalDataCatalog {
  /** All Swiss cantons */
  cantons: Canton[]
  /** All Swiss municipalities */
  municipalities: Municipality[]
  /** Index for fast lookups */
  indexes: {
    /** Canton lookup by ID */
    cantonById: Map<string, Canton>
    /** Canton lookup by abbreviation */
    cantonByAbbreviation: Map<string, Canton>
    /** Municipality lookup by GDN ID */
    municipalityByGdnId: Map<string, Municipality>
    /** Municipalities grouped by canton ID */
    municipalitiesByCantonId: Map<string, Municipality[]>
    /** Municipalities grouped by canton abbreviation */
    municipalitiesByCantonAbbreviation: Map<string, Municipality[]>
  }
}

/**
 * Filter options for geographical data queries
 */
export interface GeographicalDataFilters {
  /** Search query for names */
  searchQuery?: string
  /** Filter by specific canton IDs */
  cantonIds?: string[]
  /** Filter by specific canton abbreviations */
  cantonAbbreviations?: string[]
  /** Minimum population (if available) */
  minPopulation?: number
  /** Maximum population (if available) */
  maxPopulation?: number
}

/**
 * Configuration for geographical data operations
 */
export interface GeographicalDataConfig {
  /** Language for display names */
  language: keyof MultiLanguageLabels
  /** Include multilingual labels */
  includeMultilingualLabels: boolean
  /** Case-sensitive search */
  caseSensitiveSearch: boolean
}

/**
 * Result of a geographical data query
 */
export interface GeographicalDataQueryResult {
  /** Matching cantons */
  cantons: Canton[]
  /** Matching municipalities */
  municipalities: Municipality[]
  /** Total count of results */
  totalCount: number
  /** Applied filters */
  appliedFilters: GeographicalDataFilters
}
