/**
 * Predefined filter configurations for common use cases
 */

import type { AccountCodeFilterConfig, AccountCodeFilterRule } from '../types/DataFilters'

/**
 * Common filter presets for financial data analysis
 */
export class FilterPresets {
  /**
   * Preset to exclude transfer expenses (36xx codes)
   * This is useful for avoiding double-counting in financial analysis
   */
  static excludeTransferExpenses(): AccountCodeFilterConfig {
    return {
      enabled: true,
      rules: [
        {
          id: 'exclude-transfer-expenses',
          name: 'Exclude Transfer Expenses',
          description:
            'Excludes all account codes starting with "36" (Transferexpenses) to avoid double-counting',
          type: 'startsWith',
          pattern: '36',
          enabled: true,
          action: 'exclude',
        },
      ],
      combineMode: 'AND',
      logFiltered: false,
    }
  }

  /**
   * Preset to exclude internal transfers (36xx and 39xx codes)
   * This provides a broader exclusion of internal transfer accounts
   */
  static excludeInternalTransfers(): AccountCodeFilterConfig {
    return {
      enabled: true,
      rules: [
        {
          id: 'exclude-transfer-expenses',
          name: 'Exclude Transfer Expenses',
          description: 'Excludes account codes starting with "36" (Transferexpenses)',
          type: 'startsWith',
          pattern: '36',
          enabled: true,
          action: 'exclude',
        },
        {
          id: 'exclude-internal-transfers',
          name: 'Exclude Internal Transfers',
          description: 'Excludes account codes starting with "39" (Internal transfers)',
          type: 'startsWith',
          pattern: '39',
          enabled: true,
          action: 'exclude',
        },
      ],
      combineMode: 'AND',
      logFiltered: false,
    }
  }

  /**
   * Preset to include only operational accounts (3xxx and 4xxx series)
   * This focuses analysis on operational revenue and expenses
   */
  static operationalAccountsOnly(): AccountCodeFilterConfig {
    return {
      enabled: true,
      rules: [
        {
          id: 'include-operational',
          name: 'Include Only Operational Accounts',
          description: 'Includes only operational accounts (3xxx and 4xxx series)',
          type: 'regex',
          pattern: '^[34]',
          enabled: true,
          action: 'include',
        },
      ],
      combineMode: 'AND',
      logFiltered: false,
    }
  }

  /**
   * Preset for revenue analysis - includes only revenue accounts (4xxx)
   */
  static revenueAnalysis(): AccountCodeFilterConfig {
    return {
      enabled: true,
      rules: [
        {
          id: 'include-revenue',
          name: 'Include Revenue Accounts',
          description: 'Includes only revenue accounts (4xxx series)',
          type: 'startsWith',
          pattern: '4',
          enabled: true,
          action: 'include',
        },
      ],
      combineMode: 'AND',
      logFiltered: false,
    }
  }

  /**
   * Preset for expense analysis - includes only expense accounts (3xxx) excluding transfers
   */
  static expenseAnalysisExcludingTransfers(): AccountCodeFilterConfig {
    return {
      enabled: true,
      rules: [
        {
          id: 'include-expenses',
          name: 'Include Expense Accounts',
          description: 'Includes only expense accounts (3xxx series)',
          type: 'startsWith',
          pattern: '3',
          enabled: true,
          action: 'include',
        },
        {
          id: 'exclude-transfers',
          name: 'Exclude Transfer Expenses',
          description: 'Excludes transfer expenses (36xx) to avoid double-counting',
          type: 'startsWith',
          pattern: '36',
          enabled: true,
          action: 'exclude',
        },
      ],
      combineMode: 'AND',
      logFiltered: false,
    }
  }

  /**
   * Custom preset builder for excluding specific account code patterns
   */
  static excludePatterns(patterns: string[], description?: string): AccountCodeFilterConfig {
    const rules: AccountCodeFilterRule[] = patterns.map((pattern, index) => ({
      id: `exclude-pattern-${index}`,
      name: `Exclude ${pattern}`,
      description: description || `Excludes account codes starting with "${pattern}"`,
      type: 'startsWith',
      pattern,
      enabled: true,
      action: 'exclude',
    }))

    return {
      enabled: true,
      rules,
      combineMode: 'AND',
      logFiltered: false,
    }
  }

  /**
   * Custom preset builder for including only specific account code patterns
   */
  static includePatterns(patterns: string[], description?: string): AccountCodeFilterConfig {
    const rules: AccountCodeFilterRule[] = patterns.map((pattern, index) => ({
      id: `include-pattern-${index}`,
      name: `Include ${pattern}`,
      description: description || `Includes account codes starting with "${pattern}"`,
      type: 'startsWith',
      pattern,
      enabled: true,
      action: 'include',
    }))

    return {
      enabled: true,
      rules,
      combineMode: 'OR', // Use OR for include patterns so any match includes the record
      logFiltered: false,
    }
  }

  /**
   * Get all available presets with metadata
   */
  static getAllPresets(): Array<{
    id: string
    name: string
    description: string
    config: AccountCodeFilterConfig
  }> {
    return [
      {
        id: 'exclude-transfer-expenses',
        name: 'Exclude Transfer Expenses',
        description:
          'Excludes account codes starting with "36" to remove transfer expenses and avoid double-counting',
        config: this.excludeTransferExpenses(),
      },
      {
        id: 'exclude-internal-transfers',
        name: 'Exclude Internal Transfers',
        description: 'Excludes both transfer expenses (36xx) and internal transfers (39xx)',
        config: this.excludeInternalTransfers(),
      },
      {
        id: 'operational-only',
        name: 'Operational Accounts Only',
        description: 'Includes only operational revenue (4xxx) and expense (3xxx) accounts',
        config: this.operationalAccountsOnly(),
      },
      {
        id: 'revenue-analysis',
        name: 'Revenue Analysis',
        description: 'Includes only revenue accounts (4xxx) for revenue-focused analysis',
        config: this.revenueAnalysis(),
      },
      {
        id: 'expense-analysis',
        name: 'Expense Analysis (No Transfers)',
        description: 'Includes expense accounts (3xxx) but excludes transfer expenses (36xx)',
        config: this.expenseAnalysisExcludingTransfers(),
      },
    ]
  }

  /**
   * Get a preset by ID
   */
  static getPreset(id: string): AccountCodeFilterConfig | null {
    const preset = this.getAllPresets().find((p) => p.id === id)
    return preset ? preset.config : null
  }
}
