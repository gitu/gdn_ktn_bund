/**
 * Financial Data Extractor
 *
 * Utilities for extracting specific account code values from financial data
 * to support account-targeted optimization.
 */

import type { FinancialData } from '@/types/FinancialDataStructure'
import { buildAccountIndex } from './optimization/accountTargets'
import { Logger } from './Logger'

export interface AccountCodeValue {
  entityCode: string
  accountCode: string
  value: number
  year: string
}

export interface AccountVarianceTarget {
  accountCode: string
  entityValues: Map<string, number> // entity code -> value
  targetVariance: number // Desired variance (0 = all equal)
}

export class FinancialDataExtractor {
  /**
   * Extract values for specific account codes across all entities
   */
  static extractAccountValues(
    financialData: FinancialData,
    accountCodes: string[],
  ): Map<string, AccountCodeValue[]> {
    const results = new Map<string, AccountCodeValue[]>()
    accountCodes.forEach((code) => results.set(code, []))

    // One pass over the trees instead of one tree walk per (entity, account)
    const index = buildAccountIndex(financialData)
    for (const [entityCode, entity] of financialData.entities) {
      const year = entity.year?.toString() || '2022'
      for (const accountCode of accountCodes) {
        const value = index.get(accountCode)?.values.get(entityCode)?.value
        if (typeof value === 'number') {
          results.get(accountCode)!.push({ entityCode, accountCode, value, year })
        }
      }
    }
    Logger.optimization('Extracted account values', {
      entities: financialData.entities.size,
      found: accountCodes.map((c) => [c, results.get(c)?.length ?? 0]),
    })
    return results
  }

  /**
   * Create variance minimization targets for optimization
   */
  static createVarianceTargets(
    accountValues: Map<string, AccountCodeValue[]>,
    targetVariance: number = 0.1, // Small non-zero variance
  ): AccountVarianceTarget[] {
    const targets: AccountVarianceTarget[] = []

    for (const [accountCode, values] of accountValues) {
      if (values.length < 2) continue // Need at least 2 entities

      // Create entity values map
      const entityValues = new Map<string, number>()
      values.forEach((v) => {
        entityValues.set(v.entityCode, Math.abs(v.value)) // Use absolute values
      })

      // Skip if all values are zero
      const nonZeroValues = Array.from(entityValues.values()).filter((v) => v > 0)
      if (nonZeroValues.length === 0) continue

      targets.push({
        accountCode,
        entityValues,
        targetVariance,
      })
    }

    return targets
  }

  /**
   * Calculate current variance for an account code across entities
   */
  static calculateVariance(entityValues: Map<string, number>): number {
    const values = Array.from(entityValues.values())
    if (values.length < 2) return 0

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length

    return variance
  }

  /**
   * Calculate coefficient of variation (normalized variance)
   */
  static calculateCoefficientOfVariation(entityValues: Map<string, number>): number {
    const values = Array.from(entityValues.values())
    if (values.length < 2) return 0

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    if (mean === 0) return 0

    const variance = this.calculateVariance(entityValues)
    const standardDeviation = Math.sqrt(variance)

    return standardDeviation / mean // CV = σ/μ
  }

  /**
   * Prepare optimization targets for account-specific optimization
   */
  static prepareAccountOptimizationTargets(
    financialData: FinancialData,
    accountCodes: string[],
  ): {
    targets: AccountVarianceTarget[]
    summary: {
      accountCode: string
      entityCount: number
      currentVariance: number
      currentCV: number
      meanValue: number
    }[]
  } {
    // Extract account values
    const accountValues = this.extractAccountValues(financialData, accountCodes)

    // Create variance targets
    const targets = this.createVarianceTargets(accountValues, 0.05) // Target 5% coefficient of variation

    // Create summary
    const summary = targets.map((target) => {
      const values = Array.from(target.entityValues.values())
      const meanValue = values.reduce((sum, v) => sum + v, 0) / values.length
      const currentVariance = this.calculateVariance(target.entityValues)
      const currentCV = this.calculateCoefficientOfVariation(target.entityValues)

      return {
        accountCode: target.accountCode,
        entityCount: target.entityValues.size,
        currentVariance,
        currentCV,
        meanValue,
      }
    })

    return { targets, summary }
  }

  /**
   * Validate account codes exist in financial data
   */
  static validateAccountCodes(
    financialData: FinancialData,
    accountCodes: string[],
  ): {
    valid: string[]
    invalid: string[]
    found: Map<string, number> // account code -> number of entities with data
  } {
    const valid: string[] = []
    const invalid: string[] = []
    const found = new Map<string, number>()

    const accountValues = this.extractAccountValues(financialData, accountCodes)

    accountCodes.forEach((code) => {
      const values = accountValues.get(code) || []
      if (values.length > 0) {
        valid.push(code)
        found.set(code, values.length)
      } else {
        invalid.push(code)
      }
    })

    return { valid, invalid, found }
  }
}
