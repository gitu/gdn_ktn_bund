/**
 * Multi-language labels for data items
 */
export interface MultiLanguageLabels {
  de: string;  // German
  fr: string;  // French
  it: string;  // Italian
  en: string;  // English
}

/**
 * Tree node representing a hierarchical data structure
 */
export interface TreeNode {
  code: string;
  labels: MultiLanguageLabels;
  children: TreeNode[];
  level: number;
  hasValue: boolean;
  value?: string | number | null;
  funk?: string; // Function code (if applicable)
}

/**
 * Metadata for tree structures
 */
export interface TreeMetadata {
  dimension: string;
  model?: string;
  source: string;
  generatedAt: string;
  totalNodes: number;
  maxDepth: number;
}

/**
 * Complete tree structure with metadata
 */
export interface TreeStructure {
  metadata: TreeMetadata;
  tree: TreeNode;
}

/**
 * Data loading options
 */
export interface DataLoadingOptions {
  entityId?: string;
  year?: string | number;
  dimension?: string;
  model?: string;
  language?: keyof MultiLanguageLabels;
}

/**
 * CSV data record for GDN data
 */
export interface GdnDataRecord {
  jahr: string;
  nr: string;
  gemeinde: string;
  konto: string;
  funktion?: string;
  betrag: string | number;
}

/**
 * CSV data record for STD data
 */
export interface StdDataRecord {
  arten: string;
  funk: string;
  jahr: string;
  value: string | number;
  dim: string;
  hh: string;
  unit: string;
  model: string;
}

/**
 * Code definition record
 */
export interface CodeDefinition {
  code: string;
  funk: string;
  labels: MultiLanguageLabels;
  dim: string;
  model: string;
}

/**
 * Data source information
 */
export interface DataSourceInfo {
  type: 'gdn' | 'std';
  entityId: string;
  entityName?: string;
  availableYears: string[];
  models?: string[];
}

/**
 * Navigation tree node for UI components
 */
export interface NavigationTreeNode {
  id: string;
  label: string;
  code: string;
  level: number;
  hasChildren: boolean;
  hasValue: boolean;
  children?: NavigationTreeNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
}

/**
 * Data loading result
 */
export interface DataLoadingResult<T = any> {
  data: T[];
  metadata: {
    source: string;
    loadedAt: string;
    recordCount: number;
    entityId?: string;
    year?: string;
    dimension?: string;
  };
  error?: string;
}

/**
 * Tree navigation state
 */
export interface TreeNavigationState {
  selectedNodes: string[];
  expandedNodes: string[];
  currentLanguage: keyof MultiLanguageLabels;
  searchQuery?: string;
  filteredNodes?: string[];
}

/**
 * Data comparison configuration
 */
export interface DataComparisonConfig {
  entities: DataSourceInfo[];
  years: string[];
  dimensions: string[];
  selectedCodes: string[];
  language: keyof MultiLanguageLabels;
}

/**
 * Aggregated data point for comparisons
 */
export interface AggregatedDataPoint {
  entityId: string;
  entityName: string;
  year: string;
  code: string;
  label: string;
  value: number;
  dimension: string;
  unit?: string;
}

/**
 * Data export configuration
 */
export interface DataExportConfig {
  format: 'csv' | 'json' | 'excel';
  includeMetadata: boolean;
  includeHierarchy: boolean;
  language: keyof MultiLanguageLabels;
  selectedNodes?: string[];
}

/**
 * Tree search result
 */
export interface TreeSearchResult {
  node: TreeNode;
  path: string[];
  matchType: 'code' | 'label' | 'description';
  relevanceScore: number;
}

/**
 * Data validation result
 */
export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedRecords: number;
  skippedRecords: number;
}

/**
 * Cache configuration for data loading
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  strategy: 'lru' | 'fifo'; // Cache eviction strategy
}

/**
 * Data loading context
 */
export interface DataLoadingContext {
  baseUrl: string;
  cache: CacheConfig;
  defaultLanguage: keyof MultiLanguageLabels;
  timeout: number;
  retryAttempts: number;
}

/**
 * Standard data information entry
 */
export interface StdDataInfo {
  hh: string; // Entity code (e.g., "gdn_ag", "sv", "bund")
  models: StdModelInfo[];
}

/**
 * Standard data model information
 */
export interface StdModelInfo {
  model: string; // Model type (e.g., "fs", "gfs")
  jahre: string[]; // Available years
}

/**
 * GDN (municipality) data information entry
 */
export interface GdnDataInfo {
  nr: string; // Municipality number
  gemeinde: string; // Municipality name
  models: Array<{
    model: string;
    jahre: string[];
  }>; // Available models and their years
}

/**
 * Data browser search result
 */
export interface DataBrowserSearchResult {
  id: string;
  type: 'std' | 'gdn';
  entityCode: string;
  displayName: MultiLanguageLabels;
  description: MultiLanguageLabels;
  availableYears: string[];
  availableModels?: string[];
  municipalityNumber?: string; // For GDN entries
}

/**
 * Data browser filter options
 */
export interface DataBrowserFilters {
  searchQuery: string;
  dataType: 'all' | 'std' | 'gdn';
  yearRange: {
    start?: string;
    end?: string;
  };
  models: string[];
}

/**
 * Data browser configuration
 */
export interface DataBrowserConfig {
  language: keyof MultiLanguageLabels;
  showDescriptions: boolean;
  showYearRange: boolean;
  showModelInfo: boolean;
  maxResults: number;
}

/**
 * Tree table row data for hierarchical display
 */
export interface TreeTableRow {
  id: string;
  code: string;
  label: string;
  value: number | null;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isVisible: boolean;
  parentId?: string;
  children?: TreeTableRow[];
  unit?: string;
}

/**
 * Tree table configuration
 */
export interface TreeTableConfig {
  showValues: boolean;
  showCodes: boolean;
  expandAll: boolean;
  language: keyof MultiLanguageLabels;
  numberFormat: 'de-CH' | 'fr-CH' | 'it-CH' | 'en-US';
  maxDepth?: number;
}

/**
 * Data path specification for loading hierarchical data
 */
export interface DataPath {
  type: 'gdn' | 'std';
  entityId: string;
  year: string;
  dimension?: string;
  model?: string;
}

/**
 * Tree aggregation result containing aggregated data and metadata
 */
export interface TreeAggregationResult {
  aggregatedData: AggregatedDataPoint[];
  metadata: {
    treeStructure?: TreeStructure;
    totalRecords: number;
    processedAt: string;
    dimension: string;
    model?: string;
    entityId?: string;
    year?: string;
  };
}
