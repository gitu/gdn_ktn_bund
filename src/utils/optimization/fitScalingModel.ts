/**
 * Orchestrates one optimisation run: prepare -> (select factors) -> fit -> convert to a readable
 * formula -> honest metrics (adjusted R², leave-one-group-out CV) -> importance and warnings.
 *
 * Pure and synchronous; no logging, no DOM, no network. See docs/optimizer.md for the maths.
 */

import { analyseColumnDependence } from './linearAlgebra'
import { buildFormula, roundCoefficient } from './formula'
import { crossValidate, planFolds } from './crossValidation'
import { SubsetScorer, selectFactors, type SelectionResult } from './factorSelection'
import { DEFAULT_CORE, SCALE_FLOOR, fitCore, type CoreSettings } from './scaleFit'
import { prepareProblem, type PreparedProblem } from './scaleProblem'
import type {
  AccountMetrics,
  CvModel,
  EntityRow,
  FactorImportance,
  FitFailure,
  FitInput,
  FitMetrics,
  FitOptions,
  FitOutcome,
  FitWarning,
  OverfitRisk,
} from './types'

/** Below this many entities every statistic is flagged as unreliable. */
export const MIN_RELIABLE_ENTITIES = 4

function mean(values: ArrayLike<number>): number {
  let s = 0
  for (let i = 0; i < values.length; i++) s += values[i]
  return values.length > 0 ? s / values.length : NaN
}

function variance(values: ArrayLike<number>): number {
  const m = mean(values)
  let s = 0
  for (let i = 0; i < values.length; i++) s += (values[i] - m) * (values[i] - m)
  return values.length > 0 ? s / values.length : NaN
}

/** Standard deviation / mean (population), 0 for fewer than two values. */
export function coefficientOfVariation(values: ArrayLike<number>): number {
  if (values.length < 2) return 0
  const m = mean(values)
  return m === 0 ? 0 : Math.sqrt(variance(values)) / Math.abs(m)
}

/** Keeps columns in the given order and skips any that is a linear combination of earlier ones. */
function greedyIndependent(
  P: PreparedProblem,
  columns: number[],
): { kept: number[]; dropped: { column: number; by: number[] }[] } {
  const kept: number[] = []
  const dropped: { column: number; by: number[] }[] = []
  for (const c of columns) {
    const trial = [...kept, c]
    const rows = P.Xn.map((x) => trial.map((t) => x[t]))
    const { dependentColumns } = analyseColumnDependence(rows, trial.length)
    if (dependentColumns.length === 0) {
      kept.push(c)
    } else {
      dropped.push({ column: c, by: kept.slice() })
    }
  }
  return { kept, dropped }
}

export function fitScalingModel(input: FitInput, options: FitOptions = {}): FitOutcome {
  const mode = options.mode ?? 'nonneg'
  const includeIntercept = options.includeIntercept ?? false
  const ridge = Math.max(0, options.ridge ?? 0)

  const prepared = prepareProblem(input)
  if ('isValid' in prepared) {
    return prepared
  }
  const P = prepared
  const warnings: FitWarning[] = [...P.warnings]
  const exclusions = P.exclusions

  const settings: CoreSettings = {
    ...DEFAULT_CORE,
    intercept: includeIntercept,
    nonNegative: mode !== 'ols',
    robust: mode === 'robust',
    ridge,
    huberK: options.huberK ?? DEFAULT_CORE.huberK,
  }
  const plan = planFolds(P.groups)
  const scorer = new SubsetScorer(P, settings, plan)
  const allRows = Array.from({ length: P.n }, (_, i) => i)
  const candidates = P.factorIds.map((_, i) => i)

  // --- which factors? ------------------------------------------------------------------------
  let columns: number[]
  let selection: SelectionResult | null = null
  if (options.selection?.enabled) {
    selection = selectFactors(P, candidates, settings, plan, options.selection.maxFactors, scorer)
    if (!selection) {
      return failure('singular', 'No factor subset could be fitted and cross-validated.', P)
    }
    columns = selection.chosen
  } else {
    if (candidates.length + (includeIntercept ? 1 : 0) >= P.n) {
      // More unknowns than entities: every subset of the factors is "dependent" in the counting
      // sense, so pruning by listing order would be arbitrary. Keep them all; the constrained
      // fit is sparse by nature, and the metrics below show the overfitting.
      columns = candidates
      warnings.push({
        code: 'tooManyFactors',
        params: { factors: candidates.length, entities: P.n },
      })
    } else {
      const { kept, dropped } = greedyIndependent(P, candidates)
      columns = kept
      if (dropped.length > 0) {
        for (const d of dropped) {
          exclusions.factors.push({
            id: P.factorIds[d.column],
            reason: 'collinear',
            by: d.by.map((c) => P.factorIds[c]),
          })
        }
        warnings.push({
          code: 'collinearFactors',
          params: { factors: dropped.map((d) => P.factorIds[d.column]).join(', ') },
        })
      }
    }
  }

  // --- fit ---------------------------------------------------------------------------------
  let full = fitCore(P, columns, settings, allRows)
  // Remove factors the constrained fit does not use, then refit so the reported model is the fit
  const intercepted = includeIntercept ? 1 : 0
  const weightOf = (b: number[], k: number) => Math.abs(b[k + intercepted])
  const used = columns.filter(
    (_, k) => weightOf(full.b, k) > 1e-9 * Math.max(...full.b.map(Math.abs), Number.MIN_VALUE),
  )
  if (used.length === 0) {
    return failure('noEffect', 'No scaling factor receives a positive weight.', P)
  }
  if (used.length < columns.length) {
    columns = used
    full = fitCore(P, columns, settings, allRows, undefined)
  }

  const anchorIdx = (() => {
    const wanted = options.anchorFactor ?? 'pop'
    const idx = P.factorIds.indexOf(wanted)
    return idx >= 0 ? idx : columns[0]
  })()
  const anchorMean = P.colMean[anchorIdx]
  const anchorFactor = P.factorIds[anchorIdx]

  // Normalised -> original units, rounded to six significant digits so the formula string and
  // the model used for simulations are identical.
  const toModel = (b: number[]) => {
    const coefficients: Record<string, number> = {}
    columns.forEach((c, k) => {
      coefficients[P.factorIds[c]] = roundCoefficient(
        ((b[k + intercepted] ?? 0) / P.colMean[c]) * anchorMean,
      )
    })
    const intercept = includeIntercept ? roundCoefficient(b[0] * anchorMean) : 0
    return { coefficients, intercept }
  }
  const model = toModel(full.b)
  const usedIds = columns.map((c) => P.factorIds[c]).filter((id) => model.coefficients[id] !== 0)
  if (usedIds.length === 0) {
    return failure('noEffect', 'No scaling factor receives a positive weight.', P)
  }
  const formula = buildFormula(
    model.intercept,
    usedIds.map((id) => ({ id, coefficient: model.coefficients[id] })),
  )

  // --- evaluate the final (rounded) model on all entities -------------------------------------
  const A = P.y.length
  const scaleOf = (rawRow: ArrayLike<number>) => {
    let s = model.intercept
    for (const c of columns) {
      s += model.coefficients[P.factorIds[c]] * rawRow[c]
    }
    return s
  }
  const rawScale = P.rawX.map(scaleOf)
  const positive = rawScale.filter((s) => s > 0)
  const meanPositive = positive.length > 0 ? mean(positive) : 1
  const floor = SCALE_FLOOR * meanPositive
  const scale = rawScale.map((s) => Math.max(s, floor))
  const nonPositiveEntities = rawScale.filter((s) => !(s > 0)).length

  const robust = mode === 'robust'
  const levels = Array.from({ length: A }, () => 1)
  const actual: number[][] = []
  const expected: number[][] = []
  const accountsMetrics: AccountMetrics[] = []
  for (let a = 0; a < A; a++) {
    const amounts: number[] = []
    const scaled: number[] = []
    for (let e = 0; e < P.n; e++) {
      const y = P.y[a][e]
      if (Number.isFinite(y)) {
        amounts.push(y)
        scaled.push(y / scale[e])
      }
    }
    const sortedScaled = [...scaled].sort((x, z) => x - z)
    const mid = sortedScaled.length >> 1
    const med =
      sortedScaled.length % 2 === 1
        ? sortedScaled[mid]
        : (sortedScaled[mid - 1] + sortedScaled[mid]) / 2
    levels[a] = robust ? med : mean(scaled)
    actual.push(Array.from(P.y[a], (y) => (Number.isFinite(y) ? P.sign[a] * y : NaN)))
    expected.push(Array.from(scale, (s) => P.sign[a] * levels[a] * s))
    accountsMetrics.push({
      id: P.accountIds[a],
      label: P.accountLabels[a],
      entityCount: amounts.length,
      mean: P.sign[a] * mean(amounts),
      level: P.sign[a] * levels[a],
      beforeCV: coefficientOfVariation(amounts),
      afterCV: coefficientOfVariation(scaled),
      cvCV: NaN,
      improvement: 0,
      cvImprovement: 0,
      beforeVariance: variance(amounts),
      afterVariance: variance(scaled),
    })
  }

  // --- cross-validation of exactly this model ------------------------------------------------
  const run = crossValidate(P, columns, settings, plan, full)
  const toUnrounded = (b: number[]) => {
    const coefficients: Record<string, number> = {}
    columns.forEach((c, k) => {
      coefficients[P.factorIds[c]] = ((b[k + intercepted] ?? 0) / P.colMean[c]) * anchorMean
    })
    return { coefficients, intercept: includeIntercept ? b[0] * anchorMean : 0 }
  }
  const foldModels: CvModel[] = run.models.map((fm) => {
    const m = toUnrounded(fm.b)
    return {
      heldOut: fm.heldOut,
      intercept: m.intercept,
      coefficients: m.coefficients,
      levels: Array.from(fm.levels, (l) => l / anchorMean),
    }
  })
  const entityFold = Array.from({ length: P.n }, () => -1)
  run.models.forEach((fm, f) => fm.heldOut.forEach((e) => (entityFold[e] = f)))

  const cvExpected: number[][] = run.expected.map((row, a) =>
    Array.from(row, (x) => (Number.isFinite(x) ? P.sign[a] * x : NaN)),
  )
  accountsMetrics.forEach((m, a) => {
    m.cvCV = run.accountCV[a]
    m.improvement = m.beforeCV > 0 ? ((m.beforeCV - m.afterCV) / m.beforeCV) * 100 : 0
    m.cvImprovement = m.beforeCV > 0 ? ((m.beforeCV - m.cvCV) / m.beforeCV) * 100 : 0
  })

  const entityRows: EntityRow[] = P.entityIds.map((id, e) => {
    const fold = foldModels[entityFold[e]]
    let cvScale = NaN
    if (fold) {
      cvScale = fold.intercept
      columns.forEach((c) => (cvScale += fold.coefficients[P.factorIds[c]] * P.rawX[e][c]))
    }
    const factors: Record<string, number> = {}
    P.factorIds.forEach((f, j) => (factors[f] = P.rawX[e][j]))
    return { id, group: P.groups[e], scale: rawScale[e], cvScale, factors }
  })

  // --- honest summary metrics --------------------------------------------------------------
  const finite = (xs: number[]) => xs.filter((x) => Number.isFinite(x))
  const meanOf = (f: (m: AccountMetrics) => number) => mean(finite(accountsMetrics.map(f)))
  const meanSq = (f: (m: AccountMetrics) => number) =>
    mean(finite(accountsMetrics.map((m) => f(m) ** 2)))
  const beforeSq = meanSq((m) => m.beforeCV)
  const rSquared = beforeSq > 0 ? 1 - meanSq((m) => m.afterCV) / beforeSq : 0
  const cvRSquared = beforeSq > 0 ? 1 - meanSq((m) => m.cvCV) / beforeSq : 0
  const parameterCount = usedIds.length + (model.intercept !== 0 ? 1 : 0)
  // The overall scale of the formula is free (fixed by the anchor), so p parameters buy p - 1 shapes
  const shapeParams = Math.max(0, parameterCount - 1)
  const dofResidual = P.n - 1 - shapeParams
  const adjustedRSquared = dofResidual > 0 ? 1 - (1 - rSquared) * ((P.n - 1) / dofResidual) : NaN
  const afterOverall = meanOf((m) => m.afterCV)
  const cvOverall = meanOf((m) => m.cvCV)
  const gap = cvOverall / Math.max(afterOverall, 1e-9)

  // Risk of a formula that fits the sample but will not carry over to other entities
  let overfitRisk: OverfitRisk = 'low'
  if (shapeParams > 0) {
    if (dofResidual <= 1 || (gap > 3 && P.n < 30)) overfitRisk = 'high'
    else if (P.n / shapeParams < 6 || gap > 1.75 || P.n < 8) overfitRisk = 'medium'
  }
  // Picking the best of many factor subsets on very few entities is itself a form of overfitting
  if (overfitRisk === 'low' && selection && selection.info.tried > 5 && P.n < 12) {
    overfitRisk = 'medium'
  }

  const metrics: FitMetrics = {
    entityCount: P.n,
    accountCount: A,
    parameterCount,
    beforeCV: meanOf((m) => m.beforeCV),
    afterCV: afterOverall,
    cvCV: cvOverall,
    rSquared,
    adjustedRSquared,
    cvRSquared,
    cvImprovement: meanOf((m) => m.cvImprovement),
    cvRmse: run.score,
    cvMethod: plan.method,
    cvFolds: plan.folds.length,
    overfitRisk,
  }

  // --- which factors matter -----------------------------------------------------------------
  const usedCols = columns.filter((c) => usedIds.includes(P.factorIds[c]))
  const contributions = usedCols.map((c) => model.coefficients[P.factorIds[c]] * P.colMean[c])
  const totalContribution = contributions.reduce((s, v) => s + v, 0) + model.intercept
  const baselineScore = Math.sqrt(Math.max(beforeSq, 0))
  const fullScore = scorer.score(usedCols)
  const importance: FactorImportance[] = usedCols.map((c, k) => {
    const without = usedCols.filter((x) => x !== c)
    const reduced = without.length > 0 ? scorer.score(without) : baselineScore
    const effect =
      Number.isFinite(fullScore) && fullScore > 0 && Number.isFinite(reduced)
        ? reduced / fullScore - 1
        : 0
    return {
      id: P.factorIds[c],
      share: totalContribution !== 0 ? contributions[k] / totalContribution : 0,
      dropEffect: effect,
    }
  })
  if (model.intercept !== 0) {
    importance.push({ id: '_intercept', share: model.intercept / totalContribution, dropEffect: 0 })
  }
  importance.sort((x, y) => y.share - x.share)

  // --- warnings -------------------------------------------------------------------------------
  if (P.n < MIN_RELIABLE_ENTITIES) warnings.push({ code: 'fewEntities', params: { count: P.n } })
  if (overfitRisk !== 'low') warnings.push({ code: 'overfitRisk', params: { risk: overfitRisk } })
  if (selection && selection.info.tried > 1 && P.n < 30) {
    warnings.push({ code: 'selectionOptimism', params: { tried: selection.info.tried } })
  }
  if (cvRSquared < 0) warnings.push({ code: 'cvWorseThanUnscaled' })
  if (nonPositiveEntities > 0 || run.nonPositive > 0) {
    warnings.push({
      code: 'nonPositiveScale',
      params: { count: Math.max(nonPositiveEntities, run.nonPositive) },
    })
  }
  if (mode === 'ols' && (model.intercept < 0 || usedIds.some((id) => model.coefficients[id] < 0))) {
    warnings.push({ code: 'negativeCoefficient' })
  }
  if (!full.converged) warnings.push({ code: 'notConverged' })
  if (rSquared < 0.05) warnings.push({ code: 'noFactorEffect' })

  return {
    isValid: true,
    model: {
      factorIds: usedIds,
      coefficients: Object.fromEntries(usedIds.map((id) => [id, model.coefficients[id]])),
      intercept: model.intercept,
      formula,
      anchorFactor,
    },
    metrics,
    accounts: accountsMetrics,
    entities: entityRows,
    actual,
    expected,
    cvExpected,
    cvModels: foldModels,
    entityFold,
    importance,
    selection: selection?.info,
    exclusions,
    warnings,
    options: { mode, includeIntercept, ridge },
    iterations: full.iterations,
  }
}

function failure(code: FitFailure['code'], error: string, P: PreparedProblem): FitFailure {
  return { isValid: false, code, error, exclusions: P.exclusions }
}

/**
 * Evaluate a formula for one set of factor values with the fitted model. Missing factors count
 * as 0 (the caller decides whether that is acceptable).
 */
export function evaluateScale(
  model: { intercept: number; coefficients: Record<string, number> },
  factors: Record<string, number>,
): number {
  let s = model.intercept
  for (const [id, c] of Object.entries(model.coefficients)) {
    s += c * (factors[id] ?? 0)
  }
  return s
}
