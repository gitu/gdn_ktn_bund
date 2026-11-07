/**
 * Turns raw entities / accounts / factor values into a clean numeric problem and records, with a
 * reason, everything that had to be left out (nothing is dropped silently).
 */

import type { AccountExclusionReason, Exclusions, FitFailure, FitInput, FitWarning } from './types'

/** Below this many entities every factor must be available for every entity. */
const SMALL_PROBLEM = 20
/** For larger problems a factor may miss up to 10 % of the entities (those are then dropped). */
const MIN_FACTOR_COVERAGE = 0.9
/** An account where more than this share of entities has exactly 0 is not size related. */
const MAX_ZERO_SHARE = 0.5

export interface PreparedProblem {
  n: number
  entityIds: string[]
  groups: string[]
  /** Usable candidate factors, in the order given by the caller. */
  factorIds: string[]
  /** Raw factor values, n rows x F columns. */
  rawX: Float64Array[]
  /** Mean of every factor over the entities (the unit of the normalised design). */
  colMean: number[]
  /** rawX divided by colMean: every column has mean 1. */
  Xn: Float64Array[]
  accountIds: string[]
  accountLabels: (string | undefined)[]
  /** +1, or -1 when the account holds negative amounts only (they are negated for the fit). */
  sign: number[]
  /** Positive amounts, A rows x n columns, NaN where the entity has no value. */
  y: Float64Array[]
  exclusions: Exclusions
  warnings: FitWarning[]
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

function sd(values: number[]): number {
  const m = mean(values)
  return Math.sqrt(values.reduce((s, v) => s + (v - m) * (v - m), 0) / values.length)
}

export function prepareProblem(input: FitInput): PreparedProblem | FitFailure {
  const exclusions: Exclusions = { accounts: [], factors: [], entities: [] }
  const warnings: FitWarning[] = []

  // Unique entities, caller order
  const seen = new Set<string>()
  let entities = input.entities.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
  if (entities.length === 0) {
    return { isValid: false, code: 'noEntities', error: 'No entities to optimise for.' }
  }
  if (entities.length < 2) {
    return {
      isValid: false,
      code: 'tooFewEntities',
      error: 'At least 2 entities are required to compare scaled values.',
    }
  }
  if (input.accounts.length === 0) {
    return { isValid: false, code: 'noAccounts', error: 'No account codes given.' }
  }
  if (input.factorIds.length === 0) {
    return {
      isValid: false,
      code: 'noFactors',
      error: 'No scaling factors available for optimization',
    }
  }

  // --- factors -----------------------------------------------------------------------------
  const requiredCoverage =
    entities.length < SMALL_PROBLEM
      ? 1
      : Math.ceil(entities.length * MIN_FACTOR_COVERAGE) / entities.length
  const keptFactors: string[] = []
  for (const factorId of new Set(input.factorIds)) {
    const missing: string[] = []
    let negative = false
    for (const e of entities) {
      const v = e.factors.get(factorId)
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        missing.push(e.id)
      } else if (v < 0) {
        negative = true
      }
    }
    if (negative) {
      exclusions.factors.push({ id: factorId, reason: 'negative' })
    } else if (1 - missing.length / entities.length < requiredCoverage - 1e-12) {
      exclusions.factors.push({ id: factorId, reason: 'missing', entities: missing.slice(0, 5) })
    } else {
      keptFactors.push(factorId)
    }
  }

  // Entities that miss a kept factor (only possible for larger problems) are dropped
  entities = entities.filter((e) => {
    const lacking = keptFactors.filter((f) => {
      const v = e.factors.get(f)
      return typeof v !== 'number' || !Number.isFinite(v)
    })
    if (lacking.length > 0) {
      exclusions.entities.push({ id: e.id, reason: 'missingFactor', factors: lacking })
      return false
    }
    return true
  })

  // Constant or all-zero factors carry no information about size differences
  const usableFactors: string[] = []
  for (const f of keptFactors) {
    const values = entities.map((e) => e.factors.get(f) as number)
    const m = mean(values)
    if (!(m > 0)) {
      exclusions.factors.push({ id: f, reason: 'zero' })
    } else if (entities.length >= 2 && sd(values) / m < 1e-9) {
      exclusions.factors.push({ id: f, reason: 'noVariation' })
    } else {
      usableFactors.push(f)
    }
  }
  if (usableFactors.length === 0) {
    return {
      isValid: false,
      code: 'noUsableFactors',
      error: 'No scaling factor has usable data for the selected entities.',
      exclusions,
    }
  }

  // --- accounts ----------------------------------------------------------------------------
  const entityIndex = new Map(entities.map((e, i) => [e.id, i]))
  const accountIds: string[] = []
  const accountLabels: (string | undefined)[] = []
  const sign: number[] = []
  const y: Float64Array[] = []
  const hasAccountData = Array.from({ length: entities.length }, () => false)
  const reject = (id: string, reason: AccountExclusionReason) =>
    exclusions.accounts.push({ id, reason })

  for (const account of input.accounts) {
    const entries: { i: number; v: number }[] = []
    for (const [entityId, value] of account.values) {
      const i = entityIndex.get(entityId)
      if (i !== undefined && Number.isFinite(value)) {
        entries.push({ i, v: value })
      }
    }
    if (entries.length === 0) {
      reject(account.id, 'noData')
      continue
    }
    if (entries.length < 2) {
      reject(account.id, 'tooFewEntities')
      continue
    }
    const positives = entries.filter((x) => x.v > 0).length
    const negatives = entries.filter((x) => x.v < 0).length
    if (positives > 0 && negatives > 0) {
      reject(account.id, 'mixedSign')
      continue
    }
    if (entries.filter((x) => x.v === 0).length / entries.length > MAX_ZERO_SHARE) {
      reject(account.id, 'mostlyZero')
      continue
    }
    const s = negatives > 0 ? -1 : 1
    const values = entries.map((x) => s * x.v)
    const m = mean(values)
    if (!(m > 0) || sd(values) / m < 1e-12) {
      reject(account.id, 'noVariation')
      continue
    }
    const row = new Float64Array(entities.length).fill(NaN)
    for (const { i, v } of entries) {
      row[i] = s * v
      hasAccountData[i] = true
    }
    accountIds.push(account.id)
    accountLabels.push(account.label)
    sign.push(s)
    y.push(row)
  }
  if (accountIds.length === 0) {
    return {
      isValid: false,
      code: 'noUsableAccounts',
      error: 'None of the account codes has usable data for at least 2 entities.',
      exclusions,
    }
  }

  // Entities without any usable account value cannot take part
  const keepIdx: number[] = []
  entities.forEach((e, i) => {
    if (hasAccountData[i]) {
      keepIdx.push(i)
    } else {
      exclusions.entities.push({ id: e.id, reason: 'noAccountData' })
    }
  })
  if (keepIdx.length < 2) {
    return {
      isValid: false,
      code: 'tooFewEntities',
      error: 'At least 2 entities with data are required to compare scaled values.',
      exclusions,
    }
  }
  const finalEntities = keepIdx.map((i) => entities[i])
  const finalY = y.map((row) => Float64Array.from(keepIdx.map((i) => row[i])))

  if (exclusions.accounts.length > 0) {
    warnings.push({ code: 'excludedAccounts', params: { count: exclusions.accounts.length } })
  }
  if (exclusions.factors.length > 0) {
    warnings.push({ code: 'excludedFactors', params: { count: exclusions.factors.length } })
  }
  if (exclusions.entities.length > 0) {
    warnings.push({ code: 'excludedEntities', params: { count: exclusions.entities.length } })
  }

  // --- numeric design ----------------------------------------------------------------------
  const n = finalEntities.length
  const rawX = finalEntities.map((e) =>
    Float64Array.from(usableFactors.map((f) => e.factors.get(f) as number)),
  )
  const colMean = usableFactors.map((_, j) => {
    let s = 0
    for (let i = 0; i < n; i++) s += rawX[i][j]
    return s / n
  })
  const Xn = rawX.map((row) => Float64Array.from(row, (v, j) => v / colMean[j]))

  return {
    n,
    entityIds: finalEntities.map((e) => e.id),
    groups: finalEntities.map((e) => e.group ?? e.id),
    factorIds: usableFactors,
    rawX,
    colMean,
    Xn,
    accountIds,
    accountLabels,
    sign,
    y: finalY,
    exclusions,
    warnings,
  }
}
