/**
 * Scaling Formula Optimization
 *
 * Automatically finds the best linear combination of scaling factors that minimizes
 * differences between entities for specific financial data lines.
 *
 * Uses least squares regression to solve: minimize ||Y - Xβ||²
 * Where:
 * - Y = target values (financial data for specific lines)
 * - X = matrix of scaling factors (pop, workplaces, total_area, etc.)
 * - β = coefficients to find (a, b, c, ... in a*pop + b*workplaces + c*total_area)
 */

import type { StatsAvailabilityInfo } from '@/types/StatsData'
import type { FinancialData } from '@/types/FinancialDataStructure'
import { FinancialDataExtractor, type AccountVarianceTarget } from './FinancialDataExtractor'
import { Logger } from './Logger'
import { OPTIMIZATION_CONSTANTS } from '@/constants/optimization'

export interface OptimizationTarget {
  entityCode: string
  targetValue: number
  scalingFactors: Map<string, number>
}

export interface OptimizationResult {
  isValid: boolean
  formula?: string
  coefficients?: Map<string, number>
  rSquared?: number
  error?: string
  targetLineCount?: number
  entityCount?: number
}

export interface OptimizationOptions {
  targetLines?: string[] // Specific financial codes to optimize for
  minRSquared?: number // Minimum R² to accept
  includeIntercept?: boolean // Whether to include constant term
  maxIterations?: number // Maximum optimization iterations
  varianceWeight?: number // Weight for variance minimization vs absolute fitting
}

export interface AccountSummary {
  accountCode: string
  entityCount: number
  currentVariance: number
  currentCV: number
  meanValue: number
}

export interface AccountImprovementSummary extends AccountSummary {
  beforeVariance: number
  afterVariance: number
  beforeCV: number
  afterCV: number
  improvement: number
}

export interface AccountOptimizationResult extends OptimizationResult {
  accountSummary?: AccountImprovementSummary[]
}

export class ScalingOptimization {
  /**
   * Optimize scaling formula to minimize variance for specific account codes
   */
  static optimizeForAccountCodes(
    financialData: FinancialData,
    accountCodes: string[],
    availableStats: StatsAvailabilityInfo[],
    scalingVariables: Map<string, Map<string, number>>, // entityCode -> (factorId -> value)
    options: OptimizationOptions = {},
  ): AccountOptimizationResult {
    try {
      const {
        minRSquared = OPTIMIZATION_CONSTANTS.ACCOUNT_CODE_R_SQUARED_THRESHOLD,
        includeIntercept: _includeIntercept = true,
        varianceWeight = OPTIMIZATION_CONSTANTS.DEFAULT_VARIANCE_WEIGHT,
      } = options

      // Parse account code groups (codes separated by + are summed together)
      const accountGroups: string[][] = accountCodes.map((codeGroup) => {
        // Split by + to handle combinations like "400+401"
        return codeGroup
          .split('+')
          .map((code) => code.trim())
          .filter((code) => code)
      })

      Logger.optimization('Parsing account code groups', {
        groups: accountGroups.map((group, i) => ({ index: i + 1, codes: group }))
      })

      // Validate all individual codes
      const allIndividualCodes = accountGroups.flat()
      const validation = FinancialDataExtractor.validateAccountCodes(
        financialData,
        allIndividualCodes,
      )
      Logger.optimization('Account code validation', {
        valid: validation.valid,
        invalid: validation.invalid
      })

      if (validation.valid.length === 0) {
        return {
          isValid: false,
          error: `No valid account codes found. Invalid: ${validation.invalid.join(', ')}`,
        }
      }

      // Prepare optimization targets for account groups
      const groupedTargets: AccountVarianceTarget[] = []
      const groupedSummary: AccountSummary[] = []

      // Process each account group
      for (let groupIndex = 0; groupIndex < accountGroups.length; groupIndex++) {
        const group = accountGroups[groupIndex]
        const validCodesInGroup = group.filter((code) => validation.valid.includes(code))

        if (validCodesInGroup.length === 0) continue

        // For single account, use existing method
        if (validCodesInGroup.length === 1) {
          const { targets, summary } = FinancialDataExtractor.prepareAccountOptimizationTargets(
            financialData,
            validCodesInGroup,
          )
          groupedTargets.push(...targets)
          groupedSummary.push(...summary)
        } else {
          // For multiple accounts (sum), create combined target
          const groupName = validCodesInGroup.join('+')
          const entitySums = new Map<string, number>()

          // Sum values across all accounts in the group for each entity
          for (const accountCode of validCodesInGroup) {
            const accountData = FinancialDataExtractor.extractAccountValues(financialData, [
              accountCode,
            ])
            const values = accountData.get(accountCode) || []

            for (const { entityCode, value } of values) {
              const currentSum = entitySums.get(entityCode) || 0
              entitySums.set(entityCode, currentSum + Math.abs(value))
            }
          }

          // Create variance target for the summed values
          if (entitySums.size >= 2) {
            const target: AccountVarianceTarget = {
              accountCode: groupName,
              entityValues: entitySums,
              targetVariance: 0,
            }
            groupedTargets.push(target)

            // Create summary for the group
            const values = Array.from(entitySums.values())
            const mean = values.reduce((sum, v) => sum + v, 0) / values.length
            const variance = FinancialDataExtractor.calculateVariance(entitySums)
            const cv = FinancialDataExtractor.calculateCoefficientOfVariation(entitySums)

            groupedSummary.push({
              accountCode: groupName,
              entityCount: entitySums.size,
              currentVariance: variance,
              currentCV: cv,
              meanValue: mean,
            })

            Logger.optimization('Account group processed', {
              groupName,
              entityCount: entitySums.size,
              mean,
              cv
            })
          }
        }
      }

      const varianceTargets = groupedTargets
      const summary = groupedSummary

      if (varianceTargets.length === 0) {
        return {
          isValid: false,
          error: 'No financial data found for the specified account codes',
        }
      }

      // Log optimization goals
      Logger.optimization('Optimization goals set', {
        accountCodeCount: validation.valid.length,
        varianceWeight,
        accountSummaries: summary.map(s => ({
          accountCode: s.accountCode,
          entityCount: s.entityCount,
          mean: s.meanValue,
          cv: s.currentCV
        }))
      })

      // For single entity, use simple normalization instead of variance minimization
      if (scalingVariables.size === 1) {
        Logger.optimization('Single entity detected', {
          approach: 'normalization instead of variance minimization'
        })

        // Get the single entity's data
        const entityCode = Array.from(scalingVariables.keys())[0]
        const entityVars = scalingVariables.get(entityCode)!

        // Create simple normalization targets (target value = 1000 for each account)
        const optimizationTargets: OptimizationTarget[] = []
        Logger.optimization('Creating optimization targets', {
          accountCount: varianceTargets.length
        })
        for (const account of varianceTargets) {
          const accountCode = account.accountCode
          const targetValue = account.entityValues.get(entityCode)

          if (targetValue && targetValue > 0) {
            optimizationTargets.push({
              entityCode: `${entityCode}_${accountCode}`,
              targetValue: Math.log(Math.max(targetValue, 1)), // Log transform for better scaling
              scalingFactors: entityVars,
            })
            Logger.optimization('Added optimization target', {
              accountCode,
              targetValue
            })
          } else {
            Logger.optimization('Skipped account', {
              accountCode,
              reason: 'no data or zero value'
            })
          }
        }

        if (optimizationTargets.length === 0) {
          return {
            isValid: false,
            error: 'No valid data for single entity optimization',
          }
        }

        // For single entity with insufficient data points, create a balanced formula
        if (optimizationTargets.length < availableStats.length) {
          Logger.optimization('Single entity insufficient data', {
            targetCount: optimizationTargets.length,
            factorCount: availableStats.length
          })

          // Create coefficients that normalize all factors to the same value
          const coefficients = new Map<string, number>()
          const targetNormalizedValue = 1.0 // Each factor contributes 1.0
          const formulaParts: string[] = []

          for (const stat of availableStats) {
            const value = entityVars.get(stat.id)
            if (value && value > 0) {
              // Calculate coefficient to normalize this factor to targetNormalizedValue
              const coefficient = targetNormalizedValue / value
              coefficients.set(stat.id, coefficient)

              // Format coefficient nicely
              let formattedCoeff: string
              if (coefficient < 0.0001) {
                formattedCoeff = coefficient.toExponential(2)
              } else if (coefficient < 0.01) {
                formattedCoeff = coefficient.toFixed(6)
              } else if (coefficient < 1) {
                formattedCoeff = coefficient.toFixed(4)
              } else {
                formattedCoeff = coefficient.toFixed(2)
              }

              formulaParts.push(`${formattedCoeff}*${stat.id}`)
              Logger.optimization('Factor normalized', {
                factorId: stat.id,
                value,
                coefficient: formattedCoeff,
                targetValue: targetNormalizedValue
              })
            }
          }

          // Join all parts with + to create the complete formula
          const formula = formulaParts.join(' + ')
          Logger.optimization('Balanced formula created', { formula })

          return {
            isValid: true,
            formula,
            coefficients,
            rSquared: 0, // No R² for simple formula
            targetLineCount: varianceTargets.length,
            entityCount: 1,
            accountSummary: summary.map((s) => ({
              ...s,
              improvement: 0, // No improvement calculation for single entity
              beforeVariance: s.currentVariance,
              afterVariance: s.currentVariance,
              beforeCV: s.currentCV,
              afterCV: s.currentCV,
            })),
          }
        }

        // Run optimization with the normalization targets
        const result = this.optimizeScalingFormula(optimizationTargets, availableStats, {
          ...options,
          minRSquared: 0.01, // Very low threshold for single entity
        })

        return {
          ...result,
          entityCount: 1,
          accountSummary: summary.map((s) => ({
            ...s,
            improvement: 0, // No improvement calculation for single entity
            beforeVariance: s.currentVariance,
            afterVariance: s.currentVariance,
            beforeCV: s.currentCV,
            afterCV: s.currentCV,
          })),
        }
      }

      // Create optimization targets that minimize variance (multi-entity case)
      const optimizationTargets = this.createVarianceMinimizationTargets(
        varianceTargets,
        scalingVariables,
        varianceWeight,
      )

      if (optimizationTargets.length < 1) {
        return {
          isValid: false,
          error: 'Insufficient data points for optimization (need at least 1 entity)',
        }
      }

      // Run optimization
      const result = this.optimizeScalingFormula(optimizationTargets, availableStats, {
        ...options,
        minRSquared,
      })

      if (!result.isValid) {
        return {
          ...result,
          accountSummary: summary.map((s) => ({
            ...s,
            beforeVariance: s.currentVariance,
            afterVariance: s.currentVariance,
            beforeCV: s.currentCV,
            afterCV: s.currentCV,
            improvement: 0,
          })),
        }
      }

      // Calculate improvement metrics
      const accountSummary = this.calculateAccountImprovements(
        varianceTargets,
        result.coefficients!,
        scalingVariables,
        summary,
      )

      return {
        ...result,
        accountSummary,
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Account optimization error',
      }
    }
  }

  /**
   * Find optimal scaling formula for given targets
   */
  static optimizeScalingFormula(
    targets: OptimizationTarget[],
    availableStats: StatsAvailabilityInfo[],
    options: OptimizationOptions = {},
  ): OptimizationResult {
    try {
      const {
        minRSquared = 0.7,
        includeIntercept = true,
        maxIterations: _maxIterations = 1000,
      } = options

      if (targets.length < 1) {
        return {
          isValid: false,
          error: 'At least 1 entity required for optimization',
        }
      }

      // Get available scaling factor IDs
      const factorIds = availableStats.map((stat) => stat.id)

      if (factorIds.length === 0) {
        return {
          isValid: false,
          error: 'No scaling factors available for optimization',
        }
      }

      // Prepare data matrices
      const { X, Y, validFactorIds } = this.prepareMatrices(targets, factorIds, includeIntercept)

      if (X.length === 0 || Y.length === 0) {
        return {
          isValid: false,
          error: 'No valid data points found for optimization',
        }
      }

      // Log the optimization problem
      console.log(`\nOptimization Problem:`)
      console.log(
        `  Solving for ${validFactorIds.length} factors${includeIntercept ? ' + intercept' : ''}: [${validFactorIds.join(', ')}]`,
      )
      console.log(`  ${X.length} data points (equations)`)
      console.log(
        `  Target value range: ${Math.min(...Y).toExponential(3)} to ${Math.max(...Y).toExponential(3)}`,
      )

      // Solve least squares: β = (X'X)⁻¹X'Y
      const coefficients = this.solveLeastSquares(X, Y)

      if (!coefficients) {
        return {
          isValid: false,
          error: 'Unable to solve optimization problem (matrix may be singular)',
        }
      }

      // Calculate R-squared
      const rSquared = this.calculateRSquared(X, Y, coefficients)

      // Log fit diagnostics
      console.log(`\nOptimization Fit Diagnostics:`)
      console.log(`  R² = ${rSquared.toFixed(4)}`)

      // Calculate and log residuals
      const predicted = X.map((row) => row.reduce((sum, x, i) => sum + x * coefficients[i], 0))
      const residuals = Y.map((y, i) => y - predicted[i])
      const maxResidual = Math.max(...residuals.map(Math.abs))
      const avgResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / residuals.length

      console.log(`  Max residual: ${maxResidual.toExponential(3)}`)
      console.log(`  Avg residual: ${avgResidual.toExponential(3)}`)
      console.log(
        `  Target range: ${Math.min(...Y).toExponential(3)} to ${Math.max(...Y).toExponential(3)}`,
      )

      // For account-specific optimization, we care more about achieving target values than R²
      // So we'll proceed even with low R² if residuals are reasonable
      const relativeError = avgResidual / (Math.max(...Y) - Math.min(...Y))
      console.log(`  Relative error: ${(relativeError * 100).toFixed(2)}%`)

      if (rSquared < minRSquared && relativeError > 0.5) {
        return {
          isValid: false,
          error: `Optimization quality too low (R² = ${rSquared.toFixed(3)}, relative error = ${(relativeError * 100).toFixed(1)}%)`,
        }
      }

      // Build formula string (will be used with CUSTOM_SCALING_PREFIX)
      const formula = this.buildFormulaString(coefficients, validFactorIds, includeIntercept)

      // Create coefficient map for result
      const coefficientMap = new Map<string, number>()
      validFactorIds.forEach((factorId, index) => {
        coefficientMap.set(factorId, coefficients[includeIntercept ? index + 1 : index])
      })

      if (includeIntercept && coefficients[0] !== 0) {
        coefficientMap.set('_intercept', coefficients[0])
      }

      // Log coefficient mapping for reference
      console.log(`\\nOptimized Coefficients (formula will use custom: prefix):`)
      const coefficientLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
      let labelIndex = 0

      validFactorIds.forEach((factorId) => {
        const coefficient = coefficientMap.get(factorId)!
        const label = coefficientLabels[labelIndex] || `coeff${labelIndex}`
        console.log(`  ${label} = ${coefficient.toFixed(6)} (${factorId})`)
        labelIndex++
      })

      if (coefficientMap.has('_intercept')) {
        const intercept = coefficientMap.get('_intercept')!
        const label = coefficientLabels[labelIndex] || `coeff${labelIndex}`
        console.log(`  ${label} = ${intercept.toFixed(6)} (intercept)`)
      }

      return {
        isValid: true,
        formula,
        coefficients: coefficientMap,
        rSquared,
        targetLineCount: new Set(targets.map((t) => this.extractFinancialCode(t.entityCode))).size,
        entityCount: new Set(targets.map((t) => this.extractEntityId(t.entityCode))).size,
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown optimization error',
      }
    }
  }

  /**
   * Prepare data matrices for least squares regression
   */
  private static prepareMatrices(
    targets: OptimizationTarget[],
    factorIds: string[],
    includeIntercept: boolean,
  ): { X: number[][]; Y: number[]; validFactorIds: string[] } {
    const validTargets: OptimizationTarget[] = []
    const validFactorIds: string[] = []

    // Filter targets with valid data
    for (const target of targets) {
      if (isFinite(target.targetValue) && target.scalingFactors.size > 0) {
        let hasValidFactors = false
        for (const factorId of factorIds) {
          const value = target.scalingFactors.get(factorId)
          if (typeof value === 'number' && isFinite(value)) {
            hasValidFactors = true
            break
          }
        }
        if (hasValidFactors) {
          validTargets.push(target)
        }
      }
    }

    // Detect if this is single entity optimization (all targets have same base entity code)
    const uniqueEntities = new Set(
      validTargets.map((t) => {
        // Extract base entity code (before any account code suffix)
        const parts = t.entityCode.split('_')
        // Remove account code suffix if present (last part after underscore)
        return parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])
          ? parts.slice(0, -1).join('_')
          : t.entityCode
      }),
    )
    const isSingleEntity = uniqueEntities.size === 1

    console.log(
      `prepareMatrices: ${validTargets.length} valid targets, isSingleEntity: ${isSingleEntity}`,
    )

    // Find factors that have data for most targets
    for (const factorId of factorIds) {
      const validCount = validTargets.filter((target) => {
        const value = target.scalingFactors.get(factorId)
        return typeof value === 'number' && isFinite(value)
      }).length

      // Require factor to be available for at least 80% of targets
      if (validCount >= Math.ceil(validTargets.length * 0.8)) {
        // Check if this factor has sufficient variance
        const values = validTargets
          .map((target) => target.scalingFactors.get(factorId))
          .filter((val) => typeof val === 'number' && isFinite(val)) as number[]

        if (isSingleEntity && values.length > 0) {
          // For single entity optimization, include all factors with valid data (no variance check)
          validFactorIds.push(factorId)
          console.log(`Factor ${factorId} included for single entity optimization`)
        } else if (values.length >= 2) {
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length
          const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
          const cv = mean > 0 ? Math.sqrt(variance) / Math.abs(mean) : 0

          // Only include factors with sufficient variation (CV > 0.01 = 1%)
          if (cv > 0.01) {
            validFactorIds.push(factorId)
          } else {
            console.warn(`Factor ${factorId} excluded due to low variance (CV: ${cv.toFixed(4)})`)
          }
        } else if (values.length === 1 && !isSingleEntity) {
          // This shouldn't happen in multi-entity mode
          console.warn(`Factor ${factorId} has only one value in multi-entity mode`)
        }
      }
    }

    if (validFactorIds.length === 0) {
      console.warn('No valid factors with sufficient variance found')
      return { X: [], Y: [], validFactorIds: [] }
    }

    // Build matrices
    const X: number[][] = []
    const Y: number[] = []

    for (const target of validTargets) {
      const row: number[] = []

      // Add intercept term if requested
      if (includeIntercept) {
        row.push(1)
      }

      // Add scaling factors
      let hasAllFactors = true
      for (const factorId of validFactorIds) {
        const value = target.scalingFactors.get(factorId)
        if (typeof value === 'number' && isFinite(value)) {
          row.push(value)
        } else {
          hasAllFactors = false
          break
        }
      }

      if (hasAllFactors) {
        X.push(row)
        Y.push(target.targetValue)
      }
    }

    // Check if we have enough data points
    // For single entity: need at least 1 equation (can use any number of factors)
    // For multi-entity: need more points than factors + intercept
    const interceptCount = includeIntercept ? 1 : 0
    const minRequired = isSingleEntity ? 1 : validFactorIds.length + interceptCount
    if (X.length < minRequired) {
      console.warn(
        `Insufficient data points: ${X.length} points for ${validFactorIds.length} factors (need at least ${minRequired})`,
      )
      // For single entity, allow optimization if we have at least 1 data point
      if (isSingleEntity && X.length >= 1) {
        console.warn(
          `Single entity with ${X.length} data points and ${validFactorIds.length} factors - proceeding`,
        )
        return { X, Y, validFactorIds }
      }
      return { X: [], Y: [], validFactorIds: [] }
    }

    // Check target value variation (skip for single entity)
    if (Y.length >= 2 && !isSingleEntity) {
      const yMean = Y.reduce((sum, y) => sum + y, 0) / Y.length
      const yVariance = Y.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / Y.length
      const yCV = yMean > 0 ? Math.sqrt(yVariance) / Math.abs(yMean) : 0

      if (yCV < 0.001) {
        // Less than 0.1% variation
        console.warn(`Target values have insufficient variation (CV: ${yCV.toFixed(6)})`)
        return { X: [], Y: [], validFactorIds: [] }
      }
    }

    return { X, Y, validFactorIds }
  }

  /**
   * Solve least squares regression using normal equations
   */
  private static solveLeastSquares(X: number[][], Y: number[]): number[] | null {
    try {
      if (X.length === 0 || Y.length === 0 || X.length !== Y.length) {
        console.error('Invalid matrix dimensions:', { X: X.length, Y: Y.length })
        return null
      }

      // Normalize X matrix to improve numerical stability
      const { normalizedX, scales } = this.normalizeMatrix(X)

      // Also normalize Y values to similar scale
      const yScale = Math.max(...Y.map(Math.abs)) || 1
      const normalizedY = Y.map((y) => y / yScale)

      // Calculate X'X (X transpose times X)
      const Xt = this.transpose(normalizedX)
      const XtX = this.matrixMultiply(Xt, normalizedX)

      // Calculate X'Y (X transpose times Y)
      const XtY = this.matrixVectorMultiply(Xt, normalizedY)

      // Check matrix condition and add appropriate regularization
      const conditionNumber = this.estimateConditionNumber(XtX)
      const regularization = Math.max(1e-6, conditionNumber * 1e-12)

      console.log(
        `Matrix condition number: ${conditionNumber.toExponential(2)}, regularization: ${regularization.toExponential(2)}`,
      )

      // Add regularization to diagonal
      for (let i = 0; i < XtX.length; i++) {
        XtX[i][i] += regularization
      }

      // Solve (X'X)β = X'Y using Gaussian elimination
      const normalizedCoeffs = this.solveLinearSystem(XtX, XtY)
      if (!normalizedCoeffs) return null

      // Denormalize coefficients (accounting for both X and Y scaling)
      const denormalizedCoeffs = this.denormalizeCoefficients(normalizedCoeffs, scales)

      // Adjust for Y scaling
      return denormalizedCoeffs.map((coeff) => coeff * yScale)
    } catch (error) {
      console.error('Error in least squares solving:', error)
      return null
    }
  }

  /**
   * Calculate R-squared coefficient of determination
   */
  private static calculateRSquared(X: number[][], Y: number[], coefficients: number[]): number {
    // Calculate predicted values
    const predicted = X.map((row) => row.reduce((sum, x, i) => sum + x * coefficients[i], 0))

    // Calculate total sum of squares
    const yMean = Y.reduce((sum, y) => sum + y, 0) / Y.length
    const totalSumSquares = Y.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)

    // Calculate residual sum of squares
    const residualSumSquares = Y.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0)

    // R² = 1 - (SS_res / SS_tot)
    return totalSumSquares === 0 ? 1 : 1 - residualSumSquares / totalSumSquares
  }

  /**
   * Build formula string from coefficients
   */
  private static buildFormulaString(
    coefficients: number[],
    factorIds: string[],
    includeIntercept: boolean,
  ): string {
    const terms: string[] = []
    const threshold = 1e-6 // Ignore very small coefficients

    let startIndex = 0

    // Handle intercept
    if (includeIntercept) {
      const intercept = coefficients[0]
      if (Math.abs(intercept) > threshold) {
        // Always use fixed notation (no scientific notation)
        const interceptStr = intercept.toFixed(6)
        terms.push(interceptStr)
      }
      startIndex = 1
    }

    // Handle scaling factors
    for (let i = 0; i < factorIds.length; i++) {
      const coeff = coefficients[startIndex + i]
      if (Math.abs(coeff) > threshold) {
        const factorId = factorIds[i]
        let coeffStr: string
        if (Math.abs(coeff - 1) < threshold) {
          coeffStr = ''
        } else if (Math.abs(coeff + 1) < threshold) {
          coeffStr = '-'
        } else {
          // Always use fixed notation (no scientific notation)
          coeffStr = coeff.toFixed(6) + '*'
        }

        const term = `${coeffStr}${factorId}`
        terms.push(coeff >= 0 && terms.length > 0 ? `+${term}` : term)
      }
    }

    return terms.length > 0 ? terms.join('').replace(/^\+/, '') : '0'
  }

  /**
   * Matrix operations
   */
  private static transpose(matrix: number[][]): number[][] {
    if (matrix.length === 0) return []
    return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]))
  }

  private static matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result: number[][] = []
    for (let i = 0; i < A.length; i++) {
      result[i] = []
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0
        for (let k = 0; k < B.length; k++) {
          sum += A[i][k] * B[k][j]
        }
        result[i][j] = sum
      }
    }
    return result
  }

  private static matrixVectorMultiply(A: number[][], b: number[]): number[] {
    return A.map((row) => row.reduce((sum, val, i) => sum + val * b[i], 0))
  }

  private static solveLinearSystem(A: number[][], b: number[]): number[] | null {
    const n = A.length
    const augmented: number[][] = A.map((row, i) => [...row, b[i]])

    // Forward elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k
        }
      }

      // Swap rows
      ;[augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]

      // Check for singular matrix with better threshold
      if (Math.abs(augmented[i][i]) < 1e-12) {
        console.warn(`Matrix appears singular at diagonal element ${i}: ${augmented[i][i]}`)
        return null
      }

      // Eliminate
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i]
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j]
        }
      }
    }

    // Back substitution
    const x: number[] = Array.from({ length: n })
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n]
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j]
      }
      x[i] /= augmented[i][i]
    }

    return x
  }

  /**
   * Normalize matrix columns to improve numerical stability
   */
  private static normalizeMatrix(X: number[][]): { normalizedX: number[][]; scales: number[] } {
    if (X.length === 0 || X[0].length === 0) {
      return { normalizedX: X, scales: [] }
    }

    const normalizedX: number[][] = []
    const scales: number[] = []

    // Calculate column scales (max absolute value in each column)
    for (let j = 0; j < X[0].length; j++) {
      let maxVal = 0
      for (let i = 0; i < X.length; i++) {
        maxVal = Math.max(maxVal, Math.abs(X[i][j]))
      }
      scales[j] = maxVal > 1e-12 ? maxVal : 1.0 // Avoid division by zero
    }

    // Normalize each column
    for (let i = 0; i < X.length; i++) {
      const normalizedRow: number[] = []
      for (let j = 0; j < X[i].length; j++) {
        normalizedRow[j] = X[i][j] / scales[j]
      }
      normalizedX[i] = normalizedRow
    }

    return { normalizedX, scales }
  }

  /**
   * Denormalize coefficients after solving normalized system
   */
  private static denormalizeCoefficients(normalizedCoeffs: number[], scales: number[]): number[] {
    const coeffs: number[] = []

    for (let i = 0; i < normalizedCoeffs.length; i++) {
      if (i < scales.length) {
        coeffs[i] = normalizedCoeffs[i] / scales[i]
      } else {
        coeffs[i] = normalizedCoeffs[i] // Intercept term doesn't need scaling
      }
    }

    return coeffs
  }

  /**
   * Estimate condition number of a matrix (simplified approach)
   */
  private static estimateConditionNumber(matrix: number[][]): number {
    if (matrix.length === 0 || matrix[0].length === 0) return 1.0

    // Simple approach: ratio of max to min diagonal elements after normalization
    let maxDiag = 0
    let minDiag = Number.POSITIVE_INFINITY

    for (let i = 0; i < Math.min(matrix.length, matrix[0].length); i++) {
      const val = Math.abs(matrix[i][i])
      if (val > 1e-15) {
        // Avoid very small values
        maxDiag = Math.max(maxDiag, val)
        minDiag = Math.min(minDiag, val)
      }
    }

    if (minDiag === Number.POSITIVE_INFINITY || minDiag < 1e-15) {
      return 1e12 // Very ill-conditioned
    }

    return maxDiag / minDiag
  }

  /**
   * Create optimization targets for variance minimization
   */
  private static createVarianceMinimizationTargets(
    varianceTargets: AccountVarianceTarget[],
    scalingVariables: Map<string, Map<string, number>>,
    _varianceWeight: number,
  ): OptimizationTarget[] {
    const targets: OptimizationTarget[] = []

    console.log(
      `Creating variance minimization targets for ${varianceTargets.length} account codes`,
    )

    // Sort variance targets by account code to ensure consistent ordering
    const sortedVarTargets = [...varianceTargets].sort((a, b) =>
      a.accountCode.localeCompare(b.accountCode),
    )

    // First account code targets 100,000 for all entities
    let referenceScalingRatios: Map<string, number> | null = null

    for (let i = 0; i < sortedVarTargets.length; i++) {
      const varTarget = sortedVarTargets[i]
      const entityValues = Array.from(varTarget.entityValues.entries())
      const isFirstAccount = i === 0

      console.log(`  Account ${varTarget.accountCode}: ${entityValues.length} entities`)

      // Log the original values for this account
      const sortedEntities = entityValues.sort((a, b) => a[1] - b[1])
      console.log(`    Original values:`)
      sortedEntities.forEach(([entity, value]) => {
        console.log(`      ${entity}: ${value.toLocaleString()}`)
      })

      // Calculate and log variance/CV
      const currentVariance = FinancialDataExtractor.calculateVariance(varTarget.entityValues)
      const currentCV = FinancialDataExtractor.calculateCoefficientOfVariation(
        varTarget.entityValues,
      )
      console.log(
        `    Current variance: ${currentVariance.toExponential(3)}, CV: ${currentCV.toFixed(3)}`,
      )

      // Calculate target values based on strategy
      if (isFirstAccount) {
        // First account: target 100,000 for all entities
        console.log(`    Using fixed target of 100,000 for all entities (first account)`)
        referenceScalingRatios = new Map<string, number>()

        for (const [entityCode, originalValue] of entityValues) {
          const entityScalingVars = scalingVariables.get(entityCode)
          if (entityScalingVars && entityScalingVars.size > 0) {
            // We want: originalValue / scalingFormula = 100,000
            // So: scalingFormula = originalValue / 100,000
            // The optimization finds coefficients such that Xβ = Y
            // So our target Y should be originalValue / 100,000
            const desiredScaledValue = 100000
            const targetValue = originalValue / desiredScaledValue
            const scalingRatio = desiredScaledValue / originalValue
            referenceScalingRatios.set(entityCode, scalingRatio)

            console.log(
              `    Creating target for ${entityCode}: original=${originalValue.toLocaleString()}, scaling target=${targetValue.toFixed(6)} (to achieve scaled value of ${desiredScaledValue.toLocaleString()})`,
            )

            targets.push({
              entityCode,
              targetValue,
              scalingFactors: entityScalingVars,
            })
          }
        }
      } else if (referenceScalingRatios) {
        // Subsequent accounts: scale based on first account's ratio
        console.log(`    Using scaled targets based on first account's ratios`)

        for (const [entityCode, originalValue] of entityValues) {
          const entityScalingVars = scalingVariables.get(entityCode)
          const scalingRatio = referenceScalingRatios.get(entityCode)

          if (entityScalingVars && entityScalingVars.size > 0 && scalingRatio !== undefined) {
            // Apply the same scaling ratio as the first account
            // If first account scales by ratio R, this account should also scale by R
            // So: originalValue / scalingFormula = originalValue * scalingRatio
            // Therefore: scalingFormula = originalValue / (originalValue * scalingRatio) = 1 / scalingRatio
            const desiredScaledValue = originalValue * scalingRatio
            const targetValue = originalValue / desiredScaledValue

            console.log(
              `    Creating target for ${entityCode}: original=${originalValue.toLocaleString()}, scaling target=${targetValue.toFixed(6)} (to achieve scaled value of ${desiredScaledValue.toLocaleString()})`,
            )

            targets.push({
              entityCode,
              targetValue,
              scalingFactors: entityScalingVars,
            })
          }
        }
      }
    }

    console.log(`Created ${targets.length} optimization targets`)
    if (targets.length > 0) {
      const sample = targets.slice(0, 3)
      sample.forEach((t) => {
        const factors = Array.from(t.scalingFactors.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')
        console.log(
          `  Target: entity=${t.entityCode}, targetValue=${t.targetValue}, factors=[${factors}]`,
        )
      })
      if (targets.length > 3) console.log(`  ... and ${targets.length - 3} more targets`)
    }

    return targets
  }

  /**
   * Calculate improvement metrics after optimization
   */
  private static calculateAccountImprovements(
    varianceTargets: AccountVarianceTarget[],
    coefficients: Map<string, number>,
    scalingVariables: Map<string, Map<string, number>>,
    originalSummary: AccountSummary[],
  ): AccountImprovementSummary[] {
    return originalSummary.map((summary) => {
      const varTarget = varianceTargets.find((vt) => vt.accountCode === summary.accountCode)
      if (!varTarget) {
        return {
          ...summary,
          beforeVariance: summary.currentVariance,
          afterVariance: summary.currentVariance,
          beforeCV: summary.currentCV,
          afterCV: summary.currentCV,
          improvement: 0,
        }
      }

      // Calculate scaled values using the optimized coefficients
      const scaledValues = new Map<string, number>()

      console.log(`\n  Calculating scaled values for account ${summary.accountCode}:`)

      for (const [entityCode, originalValue] of varTarget.entityValues) {
        const entityScaling = scalingVariables.get(entityCode)
        if (entityScaling) {
          // Apply the optimized scaling formula
          let scalingFactor = 0
          const formulaParts: string[] = []

          // Build formula parts with coefficient labels
          const coefficientLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
          let labelIndex = 0

          for (const [factorId, coefficient] of coefficients) {
            if (factorId !== '_intercept' && entityScaling.has(factorId)) {
              const factorValue = entityScaling.get(factorId) || 0
              const contribution = coefficient * factorValue
              scalingFactor += contribution

              const label = coefficientLabels[labelIndex] || `coeff${labelIndex}`
              formulaParts.push(`${label}*${factorId}(${factorValue.toLocaleString()})`)
              labelIndex++
            }
          }

          // Add intercept if present
          if (coefficients.has('_intercept')) {
            const intercept = coefficients.get('_intercept')!
            scalingFactor += intercept
            const label = coefficientLabels[labelIndex] || `coeff${labelIndex}`
            formulaParts.push(label)
          }

          // Apply scaling (avoid division by zero)
          const scaledValue = scalingFactor > 0 ? originalValue / scalingFactor : originalValue
          scaledValues.set(entityCode, scaledValue)

          // Extract entity type and ID for cleaner display
          const entityParts = entityCode.split('/')
          const entityType = entityParts[0] || 'entity'
          const entityId = entityParts[2]?.split(':')[0] || entityCode
          const entityDisplay = `${entityType}${entityId}`

          // Format in requested style with custom: prefix: gdn1: data(36,332232)/(custom:a*pop(3990)+b*total_area(3331)+c)=1000
          const formulaDisplay = formulaParts.length > 0 ? formulaParts.join('+') : '1'
          console.log(
            `    ${entityDisplay}: data(${summary.accountCode},${originalValue.toLocaleString()})/(custom:${formulaDisplay})=${Math.round(scaledValue).toLocaleString()}`,
          )
        }
      }

      // Calculate new variance and CV
      const afterVariance = FinancialDataExtractor.calculateVariance(scaledValues)
      const afterCV = FinancialDataExtractor.calculateCoefficientOfVariation(scaledValues)

      // Calculate improvement (reduction in coefficient of variation)
      const improvement =
        summary.currentCV > 0 ? ((summary.currentCV - afterCV) / summary.currentCV) * 100 : 0

      return {
        ...summary,
        beforeVariance: summary.currentVariance,
        afterVariance,
        beforeCV: summary.currentCV,
        afterCV,
        improvement,
      }
    })
  }

  /**
   * Helper functions to extract information from entity codes
   */
  private static extractFinancialCode(entityCode: string): string {
    // Extract financial code from entity code structure
    // This would need to be adapted based on actual entity code format
    return entityCode.split('-')[0] || entityCode
  }

  private static extractEntityId(entityCode: string): string {
    // Extract entity ID from entity code structure
    return entityCode.split('/')[2]?.split(':')[0] || entityCode
  }
}
