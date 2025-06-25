/**
 * Financial Data Extractor
 *
 * Utilities for extracting specific account code values from financial data
 * to support account-targeted optimization.
 */

import type { FinancialData, FinancialDataNode } from '@/types/FinancialDataStructure'

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

    // Initialize results for each account code
    accountCodes.forEach((code) => {
      results.set(code, [])
    })

    // Search through all entities
    console.log(
      `FinancialDataExtractor: Searching for account codes [${accountCodes.join(', ')}] in ${financialData.entities.size} entities`,
    )

    for (const [entityCode, entity] of financialData.entities) {
      const year = entity.year?.toString() || '2022'

      // Search for account codes in both balance sheet and income statement
      accountCodes.forEach((accountCode) => {
        // Search in income statement (contains codes like 36, 46)
        if (financialData.incomeStatement) {
          const value = this.findAccountValueInTree(
            financialData.incomeStatement,
            accountCode,
            entityCode,
          )
          if (value !== null) {
            console.log(`  Found account ${accountCode} for entity ${entityCode}: ${value}`)
            results.get(accountCode)!.push({
              entityCode,
              accountCode,
              value,
              year,
            })
          }
        }

        // Search in balance sheet (contains codes like 10, 20)
        if (
          financialData.balanceSheet &&
          !results.get(accountCode)!.some((r) => r.entityCode === entityCode)
        ) {
          const value = this.findAccountValueInTree(
            financialData.balanceSheet,
            accountCode,
            entityCode,
          )
          if (value !== null) {
            console.log(
              `  Found account ${accountCode} for entity ${entityCode}: ${value} (from balance sheet)`,
            )
            results.get(accountCode)!.push({
              entityCode,
              accountCode,
              value,
              year,
            })
          }
        }
      })
    }

    // Log summary
    accountCodes.forEach((code) => {
      const values = results.get(code) || []
      console.log(`FinancialDataExtractor: Account ${code} found in ${values.length} entities`)
      if (values.length > 0) {
        const sample = values
          .slice(0, 3)
          .map((v) => `${v.entityCode}: ${v.value}`)
          .join(', ')
        console.log(`  Sample values: ${sample}${values.length > 3 ? '...' : ''}`)
      }
    })

    return results
  }

  /**
   * Find account value in a financial data tree
   */
  private static findAccountValueInTree(
    node: FinancialDataNode,
    targetAccountCode: string,
    entityCode: string,
  ): number | null {
    // Check if this node matches the target account code
    if (node.code === targetAccountCode) {
      const value = node.values.get(entityCode)
      return value?.value ?? null
    }

    // Search in children recursively
    for (const child of node.children) {
      const value = this.findAccountValueInTree(child, targetAccountCode, entityCode)
      if (value !== null) {
        return value
      }
    }

    return null
  }

  /**
   * Create variance minimization targets for optimization
   */
  static createVarianceTargets(
    accountValues: Map<string, AccountCodeValue[]>,
    targetVariance: number = 0.1, // Small non-zero variance
  ): AccountVarianceTarget[] {
    const targets: AccountVarianceTarget[] = []

    console.log(`Creating variance targets from ${accountValues.size} account codes`)

    for (const [accountCode, values] of accountValues) {
      console.log(`  Account ${accountCode}: ${values.length} values`)
      if (values.length < 2) {
        console.log(`    Skipping - need at least 2 entities`)
        continue // Need at least 2 entities
      }

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
    console.log(`Preparing account optimization targets for codes: [${accountCodes.join(', ')}]`)

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
