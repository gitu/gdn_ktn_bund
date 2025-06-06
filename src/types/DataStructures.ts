/**
 * Multi-language labels for data items
 */
export interface MultiLanguageLabels {
  de: string // German
  fr: string // French
  it: string // Italian
  en: string // English
}

/**
 * CSV data record for STD data
 */
export interface DataRecord {
  arten: string
  funk: string
  jahr: string
  value: string
  dim: string
  unit: string
}

/**
 * Standard data information entry
 */
export interface StdDataInfo {
  hh: string // Entity code (e.g., "gdn_ag", "sv", "bund")
  models: StdModelInfo[]
}

/**
 * Standard data model information
 */
export interface StdModelInfo {
  model: string // Model type (e.g., "fs", "gfs")
  jahre: string[] // Available years
}

/**
 * GDN (municipality) data information entry
 */
export interface GdnDataInfo {
  nr: string // Municipality number
  gemeinde: string // Municipality name
  models: Array<{
    model: string
    jahre: string[]
  }> // Available models and their years
}

/**
 * Available data entry from the unified catalog
 */
export interface AvailableDataEntry {
  id: string
  type: 'std' | 'gdn'
  entityCode: string
  displayName: MultiLanguageLabels
  description: MultiLanguageLabels
  availableYears: string[]
  municipalityNumber?: string // For GDN entries
}

/**
 * Available data catalog - array of all available data entries
 */
export type AvailableDataCatalog = AvailableDataEntry[]

/**
 * Data browser filter options
 */
export interface DataBrowserFilters {
  searchQuery: string
  dataType: 'all' | 'std' | 'gdn'
  yearRange: {
    start?: string
    end?: string
  }
}

/**
 * Data browser configuration
 */
export interface DataBrowserConfig {
  language: keyof MultiLanguageLabels
  showDescriptions: boolean
  showYearRange: boolean
  maxResults: number
}
