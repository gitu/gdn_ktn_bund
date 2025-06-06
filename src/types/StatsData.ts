/**
 * TypeScript interfaces for Swiss statistical data
 */

import type { MultiLanguageLabels } from './DataStructures';

/**
 * Statistical data entry from stats.json catalog
 */
export interface StatsDataEntry {
  /** Unique identifier for the statistic (e.g., "pop") */
  id: string;
  /** Multilingual name of the statistic */
  name: MultiLanguageLabels;
  /** Multilingual unit of measurement */
  unit: MultiLanguageLabels;
  /** Data source information */
  source: string;
  /** Last update date (ISO format) */
  lastUpdate: string;
  /** Available data files organized by type */
  data: {
    /** Canton-level data files */
    ktn?: StatsDataFile[];
    /** Municipality-level data files */
    gdn?: StatsDataFile[];
  };
}

/**
 * Reference to a statistical data file
 */
export interface StatsDataFile {
  /** Year of the data */
  year: number;
  /** Relative path to the CSV file */
  file: string;
  /** Atlas ID for BFS reference (optional) */
  atlasId?: string;
}

/**
 * Complete stats catalog from stats.json
 */
export interface StatsCatalog {
  /** Array of all available statistical data entries */
  stats: StatsDataEntry[];
}

/**
 * Raw CSV record from statistical data files
 */
export interface StatsDataRecord {
  /** Geographic ID */
  GEO_ID: string;
  /** Geographic name (canton or municipality name) */
  GEO_NAME: string;
  /** Variable description */
  VARIABLE: string;
  /** Statistical value */
  VALUE: string;
  /** Unit of measurement */
  UNIT: string;
  /** Status code */
  STATUS: string;
  /** Status description */
  STATUS_DESC: string;
  /** Description value (usually empty) */
  DESC_VAL: string;
  /** Period reference date */
  PERIOD_REF: string;
  /** Data source */
  SOURCE: string;
  /** Last update date */
  LAST_UPDATE: string;
  /** Geometry code */
  GEOM_CODE: string;
  /** Geometry description */
  GEOM: string;
  /** Geometry period */
  GEOM_PERIOD: string;
  /** Map ID for atlas reference */
  MAP_ID: string;
  /** Map URL for atlas reference */
  MAP_URL: string;
}

/**
 * Processed statistical data record
 */
export interface ProcessedStatsRecord {
  /** Geographic ID */
  geoId: string;
  /** Geographic name */
  geoName: string;
  /** Numerical value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Year of the data */
  year: number;
  /** Status (e.g., "A" for normal value) */
  status: string;
  /** Data source */
  source: string;
  /** Last update date */
  lastUpdate: string;
}

/**
 * Result from loading statistical data
 */
export interface StatsDataResult {
  /** Processed data records */
  data: ProcessedStatsRecord[];
  /** Metadata about the loaded data */
  metadata: {
    /** Source identifier */
    source: string;
    /** When the data was loaded */
    loadedAt: string;
    /** Number of records */
    recordCount: number;
    /** Year of the data */
    year: number;
    /** Type of data (ktn or gdn) */
    dataType: 'ktn' | 'gdn';
  };
}

/**
 * Aggregated statistical data for federal level
 */
export interface BundStatsResult {
  /** Total aggregated value */
  totalValue: number;
  /** Unit of measurement */
  unit: string;
  /** Year of the data */
  year: number;
  /** Number of cantons included in aggregation */
  cantonCount: number;
  /** Metadata about the aggregation */
  metadata: {
    /** Source identifier */
    source: string;
    /** When the aggregation was performed */
    aggregatedAt: string;
    /** Original data type used for aggregation */
    sourceDataType: 'ktn';
  };
}

/**
 * Available statistical data summary
 */
export interface StatsAvailabilityInfo {
  /** Statistics ID */
  id: string;
  /** Multilingual name */
  name: MultiLanguageLabels;
  /** Multilingual unit */
  unit: MultiLanguageLabels;
  /** Available years for canton data */
  availableKtnYears: number[];
  /** Available years for municipality data */
  availableGdnYears: number[];
  /** Data source */
  source: string;
  /** Last update date */
  lastUpdate: string;
}

/**
 * Query filters for statistical data
 */
export interface StatsDataFilters {
  /** Filter by specific geographic IDs */
  geoIds?: string[];
  /** Filter by geographic names (partial match) */
  geoNamePattern?: string;
  /** Minimum value threshold */
  minValue?: number;
  /** Maximum value threshold */
  maxValue?: number;
}

/**
 * Configuration for stats data loading
 */
export interface StatsDataConfig {
  /** Language for error messages and logging */
  language: keyof MultiLanguageLabels;
  /** Whether to include detailed metadata */
  includeMetadata: boolean;
  /** Whether to validate data integrity */
  validateData: boolean;
}
