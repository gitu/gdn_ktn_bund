/**
 * Types and interfaces for data filtering functionality
 */

/**
 * Filter rule for account codes
 */
export interface AccountCodeFilterRule {
  /** Unique identifier for the rule */
  id: string
  /** Human-readable name for the rule */
  name: string
  /** Description of what this rule filters */
  description?: string
  /** Type of pattern matching to use */
  type: 'startsWith' | 'endsWith' | 'contains' | 'exact' | 'regex'
  /** The pattern to match against account codes */
  pattern: string
  /** Whether this rule is currently active */
  enabled: boolean
  /** Whether to include or exclude matching codes */
  action: 'include' | 'exclude'
}

/**
 * Configuration for account code filtering
 */
export interface AccountCodeFilterConfig {
  /** Whether filtering is globally enabled */
  enabled: boolean
  /** List of filter rules to apply */
  rules: AccountCodeFilterRule[]
  /** How to combine multiple rules (AND = all must match, OR = any must match) */
  combineMode: 'AND' | 'OR'
  /** Whether to log filtered items for debugging */
  logFiltered: boolean
}

/**
 * Result of applying filters to data
 */
export interface FilterResult {
  /** Original number of records */
  originalCount: number
  /** Number of records after filtering */
  filteredCount: number
  /** Number of records that were excluded */
  excludedCount: number
  /** List of account codes that were excluded (for debugging) */
  excludedCodes: string[]
  /** Whether any filtering was applied */
  wasFiltered: boolean
}

/**
 * Context information for filter evaluation
 */
export interface FilterContext {
  /** The account code being evaluated */
  accountCode: string
  /** The dimension (bilanz, aufwand, ertrag) */
  dimension: string
  /** The data source (gdn, std) */
  source: string
  /** The model (fs, gfs, etc.) */
  model: string
  /** Additional metadata about the record */
  metadata?: Record<string, string | number | boolean>
}

/**
 * Predefined filter rules for common use cases
 */
export const PREDEFINED_FILTER_RULES: Readonly<AccountCodeFilterRule[]> = [
  {
    id: 'exclude-transfer-expenses',
    name: 'Exclude Transfer Expenses',
    description: 'Excludes all account codes starting with "36" (Transferexpenses)',
    type: 'startsWith',
    pattern: '36',
    enabled: false,
    action: 'exclude',
  },
  {
    id: 'exclude-internal-transfers',
    name: 'Exclude Internal Transfers',
    description: 'Excludes internal transfer accounts that may create double counting',
    type: 'startsWith',
    pattern: '39',
    enabled: false,
    action: 'exclude',
  },
  {
    id: 'include-only-operational',
    name: 'Include Only Operational Accounts',
    description: 'Includes only operational accounts (3xxx and 4xxx series)',
    type: 'regex',
    pattern: '^[34]',
    enabled: false,
    action: 'include',
  },
] as const

/**
 * Default filter configuration
 */
export const DEFAULT_FILTER_CONFIG: AccountCodeFilterConfig = {
  enabled: false,
  rules: [],
  combineMode: 'AND',
  logFiltered: false,
}
