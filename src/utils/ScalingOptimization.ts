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
import type { ScalingVariable } from './CustomScalingFormula'

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
  minRSquared?: number // Minimum R² to accept (default: 0.7)
  includeIntercept?: boolean // Whether to include constant term (default: true)
  maxIterations?: number // Maximum optimization iterations (default: 1000)
}

export class ScalingOptimization {
  /**
   * Find optimal scaling formula for given targets
   */
  static optimizeScalingFormula(
    targets: OptimizationTarget[],
    availableStats: StatsAvailabilityInfo[],
    options: OptimizationOptions = {}
  ): OptimizationResult {
    try {
      const {
        minRSquared = 0.7,
        includeIntercept = true,
        maxIterations = 1000
      } = options

      if (targets.length < 2) {
        return {
          isValid: false,
          error: 'At least 2 entities required for optimization'
        }
      }

      // Get available scaling factor IDs
      const factorIds = availableStats.map(stat => stat.id)
      
      if (factorIds.length === 0) {
        return {
          isValid: false,
          error: 'No scaling factors available for optimization'
        }
      }

      // Prepare data matrices
      const { X, Y, validFactorIds } = this.prepareMatrices(targets, factorIds, includeIntercept)
      
      if (X.length === 0 || Y.length === 0) {
        return {
          isValid: false,
          error: 'No valid data points found for optimization'
        }
      }

      // Solve least squares: β = (X'X)⁻¹X'Y
      const coefficients = this.solveLeastSquares(X, Y)
      
      if (!coefficients) {
        return {
          isValid: false,
          error: 'Unable to solve optimization problem (matrix may be singular)'
        }
      }

      // Calculate R-squared
      const rSquared = this.calculateRSquared(X, Y, coefficients)
      
      if (rSquared < minRSquared) {
        return {
          isValid: false,
          error: `Optimization quality too low (R² = ${rSquared.toFixed(3)}, minimum required: ${minRSquared})`
        }
      }

      // Build formula string
      const formula = this.buildFormulaString(coefficients, validFactorIds, includeIntercept)
      
      // Create coefficient map for result
      const coefficientMap = new Map<string, number>()
      validFactorIds.forEach((factorId, index) => {
        coefficientMap.set(factorId, coefficients[includeIntercept ? index + 1 : index])
      })
      
      if (includeIntercept && coefficients[0] !== 0) {
        coefficientMap.set('_intercept', coefficients[0])
      }

      return {
        isValid: true,
        formula,
        coefficients: coefficientMap,
        rSquared,
        targetLineCount: new Set(targets.map(t => this.extractFinancialCode(t.entityCode))).size,
        entityCount: new Set(targets.map(t => this.extractEntityId(t.entityCode))).size
      }

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown optimization error'
      }
    }
  }

  /**
   * Prepare data matrices for least squares regression
   */
  private static prepareMatrices(
    targets: OptimizationTarget[],
    factorIds: string[],
    includeIntercept: boolean
  ): { X: number[][], Y: number[], validFactorIds: string[] } {
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

    // Find factors that have data for most targets
    for (const factorId of factorIds) {
      const validCount = validTargets.filter(target => {
        const value = target.scalingFactors.get(factorId)
        return typeof value === 'number' && isFinite(value)
      }).length
      
      // Require factor to be available for at least 80% of targets
      if (validCount >= Math.ceil(validTargets.length * 0.8)) {
        validFactorIds.push(factorId)
      }
    }

    if (validFactorIds.length === 0) {
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

      // Calculate X'X (X transpose times X)
      const Xt = this.transpose(X)
      const XtX = this.matrixMultiply(Xt, X)
      
      // Calculate X'Y (X transpose times Y)
      const XtY = this.matrixVectorMultiply(Xt, Y)
      
      // Add small regularization to handle near-singular matrices
      for (let i = 0; i < XtX.length; i++) {
        XtX[i][i] += 1e-8
      }
      
      // Solve (X'X)β = X'Y using Gaussian elimination
      return this.solveLinearSystem(XtX, XtY)
      
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
    const predicted = X.map(row => 
      row.reduce((sum, x, i) => sum + x * coefficients[i], 0)
    )
    
    // Calculate total sum of squares
    const yMean = Y.reduce((sum, y) => sum + y, 0) / Y.length
    const totalSumSquares = Y.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
    
    // Calculate residual sum of squares
    const residualSumSquares = Y.reduce((sum, y, i) => 
      sum + Math.pow(y - predicted[i], 2), 0
    )
    
    // R² = 1 - (SS_res / SS_tot)
    return totalSumSquares === 0 ? 1 : 1 - (residualSumSquares / totalSumSquares)
  }

  /**
   * Build formula string from coefficients
   */
  private static buildFormulaString(
    coefficients: number[],
    factorIds: string[],
    includeIntercept: boolean
  ): string {
    const terms: string[] = []
    const threshold = 1e-6 // Ignore very small coefficients

    let startIndex = 0
    
    // Handle intercept
    if (includeIntercept) {
      const intercept = coefficients[0]
      if (Math.abs(intercept) > threshold) {
        terms.push(intercept.toFixed(3))
      }
      startIndex = 1
    }

    // Handle scaling factors
    for (let i = 0; i < factorIds.length; i++) {
      const coeff = coefficients[startIndex + i]
      if (Math.abs(coeff) > threshold) {
        const factorId = factorIds[i]
        const coeffStr = Math.abs(coeff - 1) < threshold ? '' : 
                        Math.abs(coeff + 1) < threshold ? '-' :
                        coeff.toFixed(3) + '*'
        
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
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]))
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
    return A.map(row => row.reduce((sum, val, i) => sum + val * b[i], 0))
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
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]

      // Check for singular matrix
      if (Math.abs(augmented[i][i]) < 1e-10) {
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
    const x: number[] = new Array(n)
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