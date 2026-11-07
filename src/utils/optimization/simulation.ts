/**
 * Simulations on a fitted model. Everything here is arithmetic on a FitResult; nothing is refitted.
 *
 *  - whatIf:           expected amount per account for hypothetical factor values (+/- CV error)
 *  - expectedVsActual: leave-one-out expectation vs. the real amount, ranked by deviation
 *  - sensitivity:      how the expectation and the rank of one entity move when a factor changes
 */

import { evaluateScale } from './fitScalingModel'
import type { CvModel, FitResult } from './types'

/** The +/- range never goes below 5 % of the expectation. */
const MAX_RELATIVE_RANGE = 0.95

export interface WhatIfAccount {
  id: string
  expected: number
  low: number
  high: number
  /** Relative half-width of the range (the account's out-of-sample CV). */
  range: number
  /** Real amount of the reference entity, when one was given. */
  actual: number | null
  /** actual / expected - 1 */
  deviation: number | null
}

export interface WhatIfResult {
  /** Formula value for the hypothetical inputs. */
  scale: number
  /** False when the formula is not positive for the inputs (nothing sensible to predict). */
  valid: boolean
  /** Model factors the caller did not provide (treated as 0). */
  missingFactors: string[]
  accounts: WhatIfAccount[]
}

export function whatIf(
  result: FitResult,
  factors: Record<string, number>,
  referenceEntityId?: string | null,
): WhatIfResult {
  const missingFactors = result.model.factorIds.filter(
    (id) => typeof factors[id] !== 'number' || !Number.isFinite(factors[id]),
  )
  const scale = evaluateScale(result.model, factors)
  const valid = scale > 0 && missingFactors.length === 0
  const ref = referenceEntityId ? result.entities.findIndex((e) => e.id === referenceEntityId) : -1
  const accounts = result.accounts.map((account, a) => {
    const expected = account.level * scale
    const range = Math.min(Number.isFinite(account.cvCV) ? account.cvCV : 0, MAX_RELATIVE_RANGE)
    const half = Math.abs(expected) * range
    const actualValue = ref >= 0 ? result.actual[a][ref] : NaN
    const hasActual = Number.isFinite(actualValue)
    return {
      id: account.id,
      expected,
      low: expected - half,
      high: expected + half,
      range,
      actual: hasActual ? actualValue : null,
      deviation: hasActual && expected !== 0 ? actualValue / expected - 1 : null,
    }
  })
  return { scale, valid, missingFactors, accounts }
}

export interface DeviationRow {
  entityId: string
  /** null for the "all accounts" view */
  actual: number | null
  expected: number | null
  /** actual / expected - 1 (average over accounts for the "all accounts" view) */
  deviation: number
  /** 1 = spends the most relative to what its size predicts. */
  rank: number
}

function accountIndex(result: FitResult, accountId: string | null): number {
  if (accountId === null) return -1
  return result.accounts.findIndex((a) => a.id === accountId)
}

/** Out-of-sample deviation of every entity (NaN when it has no value). */
export function deviations(result: FitResult, accountId: string | null): number[] {
  const a = accountIndex(result, accountId)
  return result.entities.map((_, e) => {
    if (a >= 0) {
      const y = result.actual[a][e]
      const x = result.cvExpected[a][e]
      return Number.isFinite(y) && Number.isFinite(x) && x !== 0 ? y / x - 1 : NaN
    }
    let sum = 0
    let count = 0
    for (let k = 0; k < result.accounts.length; k++) {
      const y = result.actual[k][e]
      const x = result.cvExpected[k][e]
      if (Number.isFinite(y) && Number.isFinite(x) && x !== 0) {
        sum += y / x - 1
        count++
      }
    }
    return count > 0 ? sum / count : NaN
  })
}

/** Entities ordered from "far above" to "far below" what their size predicts. */
export function expectedVsActual(result: FitResult, accountId: string | null): DeviationRow[] {
  const dev = deviations(result, accountId)
  const a = accountIndex(result, accountId)
  const rows: DeviationRow[] = []
  result.entities.forEach((entity, e) => {
    if (!Number.isFinite(dev[e])) return
    rows.push({
      entityId: entity.id,
      actual: a >= 0 ? result.actual[a][e] : null,
      expected: a >= 0 ? result.cvExpected[a][e] : null,
      deviation: dev[e],
      rank: 0,
    })
  })
  rows.sort((x, y) => y.deviation - x.deviation || x.entityId.localeCompare(y.entityId))
  rows.forEach((row, i) => (row.rank = i + 1))
  return rows
}

export const SENSITIVITY_STEPS = [-0.25, -0.1, 0.1, 0.25] as const

export interface SensitivityCell {
  delta: number
  /** Expected amount after the change relative to before (0.1 = +10 %). */
  expectedChange: number
  /** Deviation of the entity after the change (actual / new expectation - 1). */
  deviation: number
  /** Rank among all entities after the change (others unchanged). */
  rank: number
}

export interface SensitivityRow {
  /** Factor id, or null for "all factors together". */
  factorId: string | null
  cells: SensitivityCell[]
}

export interface SensitivityResult {
  entityId: string
  baselineDeviation: number
  baselineRank: number
  entityCount: number
  rows: SensitivityRow[]
}

function foldScale(fold: CvModel, factors: Record<string, number>): number {
  return evaluateScale(fold, factors)
}

/**
 * Sensitivity of one entity. The expectation comes from the fold that did *not* see the entity,
 * so changing its factor values cannot leak into the model: the model stays fixed and only the
 * entity's own inputs move.
 */
export function sensitivity(
  result: FitResult,
  entityId: string,
  accountId: string | null,
  steps: readonly number[] = SENSITIVITY_STEPS,
): SensitivityResult | null {
  const e = result.entities.findIndex((x) => x.id === entityId)
  if (e < 0) return null
  const fold = result.cvModels[result.entityFold[e]]
  if (!fold) return null
  const a = accountIndex(result, accountId)
  const accountSet = a >= 0 ? [a] : result.accounts.map((_, k) => k)
  const baseDev = deviations(result, accountId)
  if (!Number.isFinite(baseDev[e])) return null
  const entity = result.entities[e]
  const sign = (k: number) => (result.accounts[k].level < 0 ? -1 : 1)

  const expectedFor = (k: number, factors: Record<string, number>) => {
    const s = foldScale(fold, factors)
    return sign(k) * fold.levels[k] * Math.max(s, 1e-12)
  }
  const deviationAfter = (factors: Record<string, number>) => {
    let sum = 0
    let count = 0
    for (const k of accountSet) {
      const y = result.actual[k][e]
      const x = expectedFor(k, factors)
      if (Number.isFinite(y) && x !== 0) {
        sum += y / x - 1
        count++
      }
    }
    return count > 0 ? sum / count : NaN
  }
  const expectedChange = (factors: Record<string, number>) => {
    let before = 0
    let after = 0
    for (const k of accountSet) {
      before += expectedFor(k, entity.factors)
      after += expectedFor(k, factors)
    }
    return before !== 0 ? after / before - 1 : NaN
  }
  const others = baseDev.filter((d, i) => i !== e && Number.isFinite(d))
  const rankOf = (dev: number) => 1 + others.filter((d) => d > dev).length

  const rows: SensitivityRow[] = [...result.model.factorIds, null].map((factorId) => ({
    factorId,
    cells: steps.map((delta) => {
      const changed: Record<string, number> = { ...entity.factors }
      for (const id of factorId === null ? result.model.factorIds : [factorId]) {
        changed[id] = entity.factors[id] * (1 + delta)
      }
      const dev = deviationAfter(changed)
      return { delta, expectedChange: expectedChange(changed), deviation: dev, rank: rankOf(dev) }
    }),
  }))
  return {
    entityId,
    baselineDeviation: baseDev[e],
    baselineRank: rankOf(baseDev[e]),
    entityCount: others.length + 1,
    rows,
  }
}
