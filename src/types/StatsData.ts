/**
 * TypeScript interfaces for Swiss statistical data
 */

import type { MultiLanguageLabels } from './DataStructures'

/**
 * Statistical data entry from stats.json catalog
 */
export interface StatsDataEntry {
  /** Unique identifier for the statistic (e.g., "pop") */
  id: string
  /** Multilingual name of the statistic */
  name: MultiLanguageLabels
  /** Multilingual unit of measurement */
  unit: MultiLanguageLabels
  /** Data source information */
  source: string
  /** Last update date (ISO format) */
  lastUpdate: string
  /** Mode of the statistic */
  mode: 'absolute' | 'per_capita'
  /** Data format configuration for parsing CSV files */
  dataFormat: DataFormat
  /** Available data files organized by type */
  data: {
    /** Canton-level data files */
    ktn?: StatsDataFile[]
    /** Municipality-level data files */
    gdn?: StatsDataFile[]
  }
}

/**
 * Data format configuration for CSV parsing
 */
export interface DataFormat {
  /** File type (currently only 'csv' supported) */
  type: 'csv'
  /** CSV delimiter character */
  delimiter: string
  /** Quote character for CSV parsing */
  quoteChar: string
  /** Whether the CSV file has headers */
  header: boolean
  /** Field name or index for the key/ID field */
  key_field: string | number
  /** Field name or index for the value field */
  value_field: string | number
}

/**
 * Reference to a statistical data file
 */
export interface StatsDataFile {
  /** Year of the data */
  year: number
  /** Relative path to the CSV file */
  file: string
  /** Atlas ID for BFS reference (optional) */
  atlasId?: string
}

/**
 * Complete stats catalog from stats.json
 */
export interface StatsCatalog {
  /** Array of all available statistical data entries */
  stats: StatsDataEntry[]
}

/**
 * Raw CSV record from statistical data files
 * Can be either a named record (with headers) or an array-like record (indexed access)
 */
export interface StatsDataRecord {
  key?: string
  value?: string
}

/**
 * Processed statistical data record
 */
export interface ProcessedStatsRecord {
  key: string
  value: number
}

/**
 * Result from loading statistical data
 */
export interface StatsDataResult {
  /** Processed data records */
  data: ProcessedStatsRecord[]
  /** Metadata about the loaded data */
  metadata: {
    /** Source identifier */
    source: string
    /** When the data was loaded */
    loadedAt: string
    /** Number of records */
    recordCount: number
    /** Year of the data (actual year used) */
    year: number
    /** Originally requested year (only set if different from actual year) */
    requestedYear?: number
    /** Type of data (ktn or gdn) */
    dataType: 'ktn' | 'gdn'
    /** Unit of measurement */
    unit?: string
    /** Mode of the statistic */
    mode?: 'absolute' | 'per_capita'
    /** Name of the statistic */
    name?: MultiLanguageLabels
  }
}

/**
 * Aggregated statistical data for federal level
 */
export interface BundStatsResult {
  /** Total aggregated value */
  totalValue: number
  /** Unit of measurement */
  unit: string
  /** Year of the data (actual year used) */
  year: number
  /** Originally requested year (only set if different from actual year) */
  requestedYear?: number
  /** Number of cantons included in aggregation */
  cantonCount: number
  /** Metadata about the aggregation */
  metadata: {
    /** Source identifier */
    source: string
    /** When the aggregation was performed */
    aggregatedAt: string
    /** Original data type used for aggregation */
    sourceDataType: 'ktn'
  }
}

/**
 * Available statistical data summary
 */
export interface StatsAvailabilityInfo {
  /** Statistics ID */
  id: string
  /** Multilingual name */
  name: MultiLanguageLabels
  /** Multilingual unit */
  unit: MultiLanguageLabels
  /** Available years for canton data */
  availableKtnYears: number[]
  /** Available years for municipality data */
  availableGdnYears: number[]
  /** Data source */
  source: string
  /** Last update date */
  lastUpdate: string
  /** Type of statistic (e.g., 'scaling' for use in scaling formulas) */
  type: string
  /** Description of the statistic */
  description: MultiLanguageLabels
}

/**
 * Query filters for statistical data
 */
export interface StatsDataFilters {
  /** Filter by specific geographic IDs */
  geoIds?: string[]
  /** Filter by geographic names (partial match) */
  geoNamePattern?: string
  /** Minimum value threshold */
  minValue?: number
  /** Maximum value threshold */
  maxValue?: number
}

/**
 * Configuration for stats data loading
 */
export interface StatsDataConfig {
  /** Language for error messages and logging */
  language: keyof MultiLanguageLabels
  /** Whether to include detailed metadata */
  includeMetadata: boolean
  /** Whether to validate data integrity */
  validateData: boolean
}
