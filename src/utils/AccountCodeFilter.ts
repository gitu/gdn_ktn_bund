/**
 * Utility class for filtering financial data based on account codes
 */

import type {
  AccountCodeFilterConfig,
  AccountCodeFilterRule,
  FilterResult,
  FilterContext,
} from '../types/DataFilters'
import { DEFAULT_FILTER_CONFIG } from '../types/DataFilters'
import type { DataRecord } from '../types/DataStructures'

/**
 * Account code filter utility class
 */
export class AccountCodeFilter {
  private config: AccountCodeFilterConfig

  constructor(config: AccountCodeFilterConfig = DEFAULT_FILTER_CONFIG) {
    this.config = { ...config }
  }

  /**
   * Update the filter configuration
   */
  updateConfig(config: Partial<AccountCodeFilterConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get the current filter configuration
   */
  getConfig(): AccountCodeFilterConfig {
    return { ...this.config }
  }

  /**
   * Check if a single account code should be included based on the filter rules
   */
  shouldIncludeAccountCode(accountCode: string, context?: Partial<FilterContext>): boolean {
    // If filtering is disabled, include everything
    if (!this.config.enabled) {
      return true
    }

    // Get only enabled rules
    const enabledRules = this.config.rules.filter((rule) => rule.enabled)

    // If no enabled rules, include everything
    if (enabledRules.length === 0) {
      return true
    }

    // Create full context
    const fullContext: FilterContext = {
      accountCode,
      dimension: context?.dimension || '',
      source: context?.source || '',
      model: context?.model || '',
      metadata: context?.metadata || {},
    }

    // Evaluate each rule
    const ruleResults = enabledRules.map((rule) => this.evaluateRule(rule, fullContext))

    // Combine results based on combine mode
    if (this.config.combineMode === 'AND') {
      // For AND mode: all include rules must pass, no exclude rules must pass
      const includeRules = enabledRules.filter((rule) => rule.action === 'include')
      const excludeRules = enabledRules.filter((rule) => rule.action === 'exclude')

      const includeResults = ruleResults.filter(
        (_, index) => enabledRules[index].action === 'include',
      )
      const excludeResults = ruleResults.filter(
        (_, index) => enabledRules[index].action === 'exclude',
      )

      // If there are include rules, at least one must match
      const includesPassed = includeRules.length === 0 || includeResults.some((result) => result)

      // If there are exclude rules, none must match
      const excludesPassed = excludeRules.length === 0 || !excludeResults.some((result) => result)

      return includesPassed && excludesPassed
    } else {
      // For OR mode: any include rule passes OR no exclude rule passes
      const includeRules = enabledRules.filter((rule) => rule.action === 'include')
      const excludeRules = enabledRules.filter((rule) => rule.action === 'exclude')

      const includeResults = ruleResults.filter(
        (_, index) => enabledRules[index].action === 'include',
      )
      const excludeResults = ruleResults.filter(
        (_, index) => enabledRules[index].action === 'exclude',
      )

      // If there are include rules, at least one must match
      const includesPassed = includeRules.length === 0 || includeResults.some((result) => result)

      // If there are exclude rules, at least one must NOT match
      const excludesPassed = excludeRules.length === 0 || !excludeResults.every((result) => result)

      return includesPassed || excludesPassed
    }
  }

  /**
   * Filter an array of data records based on account codes
   */
  filterDataRecords(
    records: DataRecord[],
    source?: string,
    model?: string,
  ): { filteredRecords: DataRecord[]; result: FilterResult } {
    const originalCount = records.length
    const excludedCodes: string[] = []

    const filteredRecords = records.filter((record) => {
      const context: Partial<FilterContext> = {
        dimension: record.dim,
        source,
        model,
        metadata: {
          funk: record.funk,
          jahr: record.jahr,
          value: record.value,
          unit: record.unit,
        },
      }

      const shouldInclude = this.shouldIncludeAccountCode(record.arten, context)

      if (!shouldInclude) {
        excludedCodes.push(record.arten)
        if (this.config.logFiltered) {
          console.log(`Filtered out account code: ${record.arten} (${record.dim})`)
        }
      }

      return shouldInclude
    })

    const filteredCount = filteredRecords.length
    const excludedCount = originalCount - filteredCount

    const result: FilterResult = {
      originalCount,
      filteredCount,
      excludedCount,
      excludedCodes: [...new Set(excludedCodes)], // Remove duplicates
      wasFiltered: this.config.enabled && excludedCount > 0,
    }

    return { filteredRecords, result }
  }

  /**
   * Evaluate a single filter rule against a context
   */
  private evaluateRule(rule: AccountCodeFilterRule, context: FilterContext): boolean {
    const { accountCode } = context
    const { type, pattern } = rule

    try {
      switch (type) {
        case 'startsWith':
          return accountCode.startsWith(pattern)

        case 'endsWith':
          return accountCode.endsWith(pattern)

        case 'contains':
          return accountCode.includes(pattern)

        case 'exact':
          return accountCode === pattern

        case 'regex':
          const regex = new RegExp(pattern)
          return regex.test(accountCode)

        default:
          console.warn(`Unknown filter rule type: ${type}`)
          return false
      }
    } catch (error) {
      console.error(`Error evaluating filter rule ${rule.id}:`, error)
      return false
    }
  }

  /**
   * Add a new filter rule
   */
  addRule(rule: AccountCodeFilterRule): void {
    // Check if rule with same ID already exists
    const existingIndex = this.config.rules.findIndex((r) => r.id === rule.id)
    if (existingIndex >= 0) {
      this.config.rules[existingIndex] = rule
    } else {
      this.config.rules.push(rule)
    }
  }

  /**
   * Remove a filter rule by ID
   */
  removeRule(ruleId: string): boolean {
    const initialLength = this.config.rules.length
    this.config.rules = this.config.rules.filter((rule) => rule.id !== ruleId)
    return this.config.rules.length < initialLength
  }

  /**
   * Enable or disable a specific rule
   */
  toggleRule(ruleId: string, enabled?: boolean): boolean {
    const rule = this.config.rules.find((r) => r.id === ruleId)
    if (rule) {
      rule.enabled = enabled !== undefined ? enabled : !rule.enabled
      return true
    }
    return false
  }

  /**
   * Get statistics about the current filter configuration
   */
  getFilterStats(): {
    totalRules: number
    enabledRules: number
    includeRules: number
    excludeRules: number
    isActive: boolean
  } {
    const enabledRules = this.config.rules.filter((rule) => rule.enabled)
    const includeRules = enabledRules.filter((rule) => rule.action === 'include')
    const excludeRules = enabledRules.filter((rule) => rule.action === 'exclude')

    return {
      totalRules: this.config.rules.length,
      enabledRules: enabledRules.length,
      includeRules: includeRules.length,
      excludeRules: excludeRules.length,
      isActive: this.config.enabled && enabledRules.length > 0,
    }
  }
}
