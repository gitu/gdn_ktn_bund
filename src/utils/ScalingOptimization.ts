/**
 * Scaling formula optimisation (public facade).
 *
 * Two entry points, both built on the numerics in `./optimization/`:
 *
 *  - `optimizeForAccountCodes` finds the formula s = b0 + sum_k b_k * factor_k that makes the
 *    accounts of the chosen entities as equal as possible after dividing by s (minimises the
 *    squared coefficient of variation of the scaled values; accounts count equally; relative
 *    errors, so a canton does not drown out a village). Reports honest, cross-validated quality.
 *  - `optimizeScalingFormula` is the generic helper: regress arbitrary target values on factors.
 *
 * What the optimiser does and where it is deliberately conservative: docs/optimizer.md.
 */

import type { StatsAvailabilityInfo } from '@/types/StatsData'
import type { FinancialData } from '@/types/FinancialDataStructure'
import { OPTIMIZATION_CONSTANTS } from '@/constants/optimization'
import { Logger } from './Logger'
import { buildAccountIndex, extractAccounts } from './optimization/accountTargets'
import { buildFormula, roundCoefficient } from './optimization/formula'
import { fitScalingModel } from './optimization/fitScalingModel'
import { medianTyped, weightedFit } from './optimization/linearAlgebra'
import { parseEntityCode } from './optimization/scalingFactors'
import type { FitMode, FitResult, FitWarning } from './optimization/types'

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
  /** R² corrected for the number of fitted parameters (honest for few entities). */
  adjustedRSquared?: number
  /** Leave-one-out (K-fold for > 60 targets) root-mean-square prediction error. */
  cvRmse?: number
  error?: string
  targetLineCount?: number
  entityCount?: number
}

export interface OptimizationOptions {
  targetLines?: string[] // Specific financial codes to optimize for
  minRSquared?: number // Minimum R² to accept (generic regression only)
  includeIntercept?: boolean // Whether to include constant term
  /** ols: any sign (default of the generic regression); nonneg: >= 0; robust: nonneg + Huber. */
  mode?: FitMode
  /** Ridge strength relative to the fit weight. */
  ridge?: number
  /** Automatic factor selection by cross-validated error (account optimisation). */
  selection?: { enabled: boolean; maxFactors: number }
  /** @deprecated kept for API compatibility, no longer used */
  maxIterations?: number
  /** @deprecated kept for API compatibility, no longer used */
  varianceWeight?: number
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
  /** Out-of-sample CV (each entity scaled by a formula that never saw it). */
  cvCV?: number
  /** In-sample reduction of the CV in percent. */
  improvement: number
  /** Out-of-sample reduction of the CV in percent (can be negative). */
  cvImprovement?: number
}

export interface AccountOptimizationResult extends OptimizationResult {
  accountSummary?: AccountImprovementSummary[]
  warnings?: FitWarning[]
  /** Full result with metrics, per-entity rows and cross-validation models. */
  fit?: FitResult
}

const MIN_VARIATION = 0.01
const MIN_FACTOR_COVERAGE = 0.8
const LOO_LIMIT = 60

export class ScalingOptimization {
  /**
   * Optimise the scaling formula for account codes ("36", "400+401", ...).
   * `scalingVariables` maps entity code -> factor id -> value.
   */
  static optimizeForAccountCodes(
    financialData: FinancialData,
    accountCodes: string[],
    availableStats: StatsAvailabilityInfo[],
    scalingVariables: Map<string, Map<string, number>>,
    options: OptimizationOptions = {},
  ): AccountOptimizationResult {
    try {
      const groups = accountCodes
        .map((group) =>
          group
            .split('+')
            .map((c) => c.trim())
            .filter((c) => c)
            .join('+'),
        )
        .filter((g) => g)
      const entityCodes = [...scalingVariables.keys()].filter((code) =>
        financialData.entities.has(code),
      )
      const index = buildAccountIndex(financialData)
      const { accounts, unknownCodes } = extractAccounts(index, groups, entityCodes)

      if (accounts.length === 0) {
        return {
          isValid: false,
          error: `No valid account codes found. Invalid: ${unknownCodes.join(', ')}`,
        }
      }
      const factorIds = availableStats.map((s) => s.id)
      const outcome = fitScalingModel(
        {
          entities: entityCodes.map((code) => ({
            id: code,
            group: parseEntityCode(code)?.groupKey ?? code,
            factors: scalingVariables.get(code) ?? new Map<string, number>(),
          })),
          accounts,
          factorIds,
        },
        {
          mode: options.mode,
          includeIntercept: options.includeIntercept,
          ridge: options.ridge,
          selection: options.selection,
        },
      )
      if (!outcome.isValid) {
        return { isValid: false, error: outcome.error }
      }

      const coefficients = new Map<string, number>(Object.entries(outcome.model.coefficients))
      if (outcome.model.intercept !== 0) coefficients.set('_intercept', outcome.model.intercept)
      return {
        isValid: true,
        formula: outcome.model.formula,
        coefficients,
        rSquared: outcome.metrics.rSquared,
        adjustedRSquared: outcome.metrics.adjustedRSquared,
        cvRmse: outcome.metrics.cvRmse,
        targetLineCount: outcome.accounts.length,
        entityCount: outcome.metrics.entityCount,
        warnings: outcome.warnings,
        fit: outcome,
        accountSummary: outcome.accounts.map((a) => ({
          accountCode: a.id,
          entityCount: a.entityCount,
          currentVariance: a.beforeVariance,
          currentCV: a.beforeCV,
          meanValue: a.mean,
          beforeVariance: a.beforeVariance,
          afterVariance: a.afterVariance,
          beforeCV: a.beforeCV,
          afterCV: a.afterCV,
          cvCV: a.cvCV,
          improvement: a.improvement,
          cvImprovement: a.cvImprovement,
        })),
      }
    } catch (error) {
      Logger.error('Account optimisation failed', error)
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Account optimization error',
      }
    }
  }

  /**
   * Generic regression of `targetValue` on the scaling factors (levels, not relative errors).
   * Solved by QR (no normal equations); reports adjusted R² and a cross-validated error.
   */
  static optimizeScalingFormula(
    targets: OptimizationTarget[],
    availableStats: StatsAvailabilityInfo[],
    options: OptimizationOptions = {},
  ): OptimizationResult {
    try {
      const {
        minRSquared = OPTIMIZATION_CONSTANTS.DEFAULT_R_SQUARED_THRESHOLD,
        includeIntercept = true,
        mode = 'ols',
        ridge = 0,
      } = options

      if (targets.length < 1) {
        return { isValid: false, error: 'At least 1 entity required for optimization' }
      }
      const factorIds = availableStats.map((stat) => stat.id)
      if (factorIds.length === 0) {
        return { isValid: false, error: 'No scaling factors available for optimization' }
      }

      const prepared = this.prepare(targets, factorIds)
      if (!prepared) {
        return { isValid: false, error: 'No valid data points found for optimization' }
      }
      const { rows, y, usedFactors } = prepared
      const p = usedFactors.length + (includeIntercept ? 1 : 0)
      const design = rows.map((r) => (includeIntercept ? [1, ...r] : r))
      const penalized =
        design.length > 0 ? Array.from({ length: p }, (_, j) => !(includeIntercept && j === 0)) : []
      const fit = (idx: number[]) =>
        this.regress(
          idx.map((i) => design[i]),
          idx.map((i) => y[i]),
          p,
          { nonNegative: mode !== 'ols', robust: mode === 'robust', ridge, penalized },
        )
      const all = design.map((_, i) => i)
      const beta = fit(all)
      const predict = (b: number[], i: number) => design[i].reduce((s, v, j) => s + v * b[j], 0)

      const yMean = y.reduce((s, v) => s + v, 0) / y.length
      const sst = y.reduce((s, v) => s + (v - yMean) ** 2, 0)
      const residuals = y.map((v, i) => v - predict(beta, i))
      const sse = residuals.reduce((s, r) => s + r * r, 0)
      const rSquared = sst === 0 ? 1 : 1 - sse / sst
      const n = y.length
      const k = p - (includeIntercept ? 1 : 0)
      const adjustedRSquared = n - k - 1 > 0 ? 1 - (1 - rSquared) * ((n - 1) / (n - k - 1)) : NaN

      // Cross-validated error: exact leave-one-out for small problems, 10 folds otherwise
      let cvRmse = NaN
      if (n >= 3) {
        const folds = n <= LOO_LIMIT ? n : 10
        let cvSse = 0
        for (let f = 0; f < folds; f++) {
          const held = all.filter((i) => i % folds === f)
          const train = all.filter((i) => i % folds !== f)
          const b = fit(train)
          for (const i of held) cvSse += (y[i] - predict(b, i)) ** 2
        }
        cvRmse = Math.sqrt(cvSse / n)
      }

      const range = Math.max(...y) - Math.min(...y)
      const avgResidual = residuals.reduce((s, r) => s + Math.abs(r), 0) / residuals.length
      const relativeError = range > 0 ? avgResidual / range : 0
      if (rSquared < minRSquared && relativeError > 0.5) {
        return {
          isValid: false,
          error: `Optimization quality too low (R² = ${rSquared.toFixed(3)}, relative error = ${(relativeError * 100).toFixed(1)}%)`,
        }
      }

      const offset = includeIntercept ? 1 : 0
      const coefficientMap = new Map<string, number>()
      usedFactors.forEach((id, j) => coefficientMap.set(id, roundCoefficient(beta[j + offset])))
      const intercept = includeIntercept ? roundCoefficient(beta[0]) : 0
      if (intercept !== 0) coefficientMap.set('_intercept', intercept)
      const formula = buildFormula(
        intercept,
        usedFactors
          .map((id) => ({ id, coefficient: coefficientMap.get(id) ?? 0 }))
          .filter((t) => Math.abs(t.coefficient) > 1e-6),
      )
      Logger.optimization('Regression fitted', { formula, rSquared, adjustedRSquared, cvRmse })
      return {
        isValid: true,
        formula,
        coefficients: coefficientMap,
        rSquared,
        adjustedRSquared,
        cvRmse,
        targetLineCount: new Set(targets.map((t) => t.entityCode.split('-')[0])).size,
        entityCount: new Set(
          targets.map((t) => t.entityCode.split('/')[2]?.split(':')[0] || t.entityCode),
        ).size,
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown optimization error',
      }
    }
  }

  /** Keep finite targets, factors with enough coverage and variation, and complete rows. */
  private static prepare(
    targets: OptimizationTarget[],
    factorIds: string[],
  ): { rows: number[][]; y: number[]; usedFactors: string[] } | null {
    const valid = targets.filter(
      (t) =>
        Number.isFinite(t.targetValue) &&
        t.scalingFactors.size > 0 &&
        factorIds.some((f) => Number.isFinite(t.scalingFactors.get(f) ?? NaN)),
    )
    if (valid.length === 0) return null

    const usedFactors = factorIds.filter((f) => {
      const values = valid
        .map((t) => t.scalingFactors.get(f))
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      if (values.length < Math.ceil(valid.length * MIN_FACTOR_COVERAGE)) return false
      if (values.length < 2) return valid.length === 1
      const mean = values.reduce((s, v) => s + v, 0) / values.length
      const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
      return mean > 0 && sd / mean > MIN_VARIATION
    })
    if (usedFactors.length === 0) return null

    const rows: number[][] = []
    const y: number[] = []
    for (const t of valid) {
      const row = usedFactors.map((f) => t.scalingFactors.get(f))
      if (row.every((v): v is number => typeof v === 'number' && Number.isFinite(v))) {
        rows.push(row)
        y.push(t.targetValue)
      }
    }
    if (rows.length === 0) return null
    if (rows.length >= 2) {
      const mean = y.reduce((s, v) => s + v, 0) / y.length
      const sd = Math.sqrt(y.reduce((s, v) => s + (v - mean) ** 2, 0) / y.length)
      if (mean > 0 && sd / mean < 0.001) return null // no variation to explain
    }
    return { rows, y, usedFactors }
  }

  /** (Robust, constrained, ridge) least squares on a small design. */
  private static regress(
    design: number[][],
    y: number[],
    p: number,
    opts: { nonNegative: boolean; robust: boolean; ridge: number; penalized: boolean[] },
  ): number[] {
    const n = design.length
    // ridge relative to the total weight (n unit weights)
    const solve = (w: number[] | null) =>
      weightedFit(design, y, w, p, {
        nonNegative: opts.nonNegative,
        ridge: opts.ridge * n,
        penalized: opts.penalized,
      }).coefficients
    let beta = solve(null)
    if (opts.robust && n >= 4) {
      for (let it = 0; it < 25; it++) {
        const res = y.map((v, i) => v - design[i].reduce((s, x, j) => s + x * beta[j], 0))
        const sigma = 1.4826 * medianTyped(Float64Array.from(res.map(Math.abs)))
        if (!(sigma > 1e-12)) break
        const cut = 1.345 * sigma
        const w = res.map((r) => (Math.abs(r) > cut ? cut / Math.abs(r) : 1))
        const next = solve(w)
        const change = Math.max(...next.map((v, j) => Math.abs(v - beta[j])))
        beta = next
        if (change < 1e-10 * (1 + Math.max(...beta.map(Math.abs)))) break
      }
    }
    return beta
  }
}
