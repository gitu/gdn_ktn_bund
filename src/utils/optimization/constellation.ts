/**
 * A constellation is one complete question to the optimiser: which entities, which accounts, which
 * candidate factors and how to fit. Scenarios in the UI are constellations plus their result.
 */

import type { FinancialData } from '@/types/FinancialDataStructure'
import {
  buildAccountIndex,
  extractAccounts,
  resolveAccountSpec,
  type AccountSpec,
} from './accountTargets'
import { fitScalingModel } from './fitScalingModel'
import { parseEntityCode, type FactorTable } from './scalingFactors'
import type { FitEntity, FitMode, FitOutcome, FitOptions } from './types'

export const DEFAULT_ACCOUNT_CODES = '36,46'
export const MAX_FACTOR_LIMIT = 6
export const DEFAULT_MAX_FACTORS = 3

export interface Constellation {
  id: string
  name: string
  /** Entity codes of table columns; null = every column of the table. */
  entities: string[] | null
  accounts: AccountSpec
  /** Candidate factor ids; null = every statistic that was discovered. */
  factors: string[] | null
  includeIntercept: boolean
  mode: FitMode
  /** Ridge strength relative to the fit weight (0 = none). */
  ridge: number
  selection: { enabled: boolean; maxFactors: number }
}

export function createConstellation(partial: Partial<Constellation> = {}): Constellation {
  return {
    id: partial.id ?? `c${Math.random().toString(36).slice(2, 8)}`,
    name: partial.name ?? '',
    entities: partial.entities ?? null,
    accounts: partial.accounts ?? { kind: 'codes', input: DEFAULT_ACCOUNT_CODES },
    factors: partial.factors ?? null,
    includeIntercept: partial.includeIntercept ?? false,
    mode: partial.mode ?? 'nonneg',
    ridge: partial.ridge ?? 0,
    // With a dozen candidate statistics and a handful of entities, using every factor is
    // pure overfitting, so the automatic selection is the default.
    selection: partial.selection ?? { enabled: true, maxFactors: DEFAULT_MAX_FACTORS },
  }
}

/** Copy with a new id; used for "duplicate". */
export function cloneConstellation(
  c: Constellation,
  overrides: Partial<Constellation> = {},
): Constellation {
  return createConstellation({
    ...c,
    entities: c.entities ? [...c.entities] : null,
    factors: c.factors ? [...c.factors] : null,
    accounts:
      c.accounts.kind === 'codes'
        ? { ...c.accounts }
        : { kind: 'children', parents: [...c.accounts.parents] },
    selection: { ...c.selection },
    ...overrides,
    id: overrides.id ?? `c${Math.random().toString(36).slice(2, 8)}`,
  })
}

export interface ConstellationContext {
  financialData: FinancialData
  factors: FactorTable
  /** Every candidate factor id that was discovered (stats.json order). */
  allFactorIds: string[]
}

export interface ConstellationRun {
  outcome: FitOutcome
  /** Account groups that were requested after resolving presets. */
  accountGroups: string[]
  /** Codes without any data for the chosen entities. */
  unknownCodes: string[]
  entityCodes: string[]
  factorIds: string[]
  /** Message when the account input was invalid (e2e contract text, English). */
  inputError: string | null
}

/** Entities of a constellation that exist in the table, in table order. */
export function resolveEntities(c: Constellation, data: FinancialData): string[] {
  const all = [...data.entities.keys()]
  if (c.entities === null) return all
  const wanted = new Set(c.entities)
  return all.filter((code) => wanted.has(code))
}

/** Factor ids of a constellation among the discovered ones, in discovery order. */
export function resolveFactors(c: Constellation, allFactorIds: string[]): string[] {
  if (c.factors === null) return allFactorIds
  const wanted = new Set(c.factors)
  return allFactorIds.filter((id) => wanted.has(id))
}

/**
 * A short fingerprint of everything a result depends on. When it changes (other columns loaded,
 * another setting) the stored result is out of date.
 */
export function constellationSignature(
  c: Constellation,
  data: FinancialData | null,
  allFactorIds: string[],
): string {
  const entities = data ? resolveEntities(c, data) : []
  const factors = resolveFactors(c, allFactorIds)
  return JSON.stringify([
    entities,
    c.accounts,
    factors,
    c.includeIntercept,
    c.mode,
    c.ridge,
    c.selection.enabled ? c.selection.maxFactors : 0,
  ])
}

export function runConstellation(c: Constellation, ctx: ConstellationContext): ConstellationRun {
  const entityCodes = resolveEntities(c, ctx.financialData)
  const factorIds = resolveFactors(c, ctx.allFactorIds)
  const index = buildAccountIndex(ctx.financialData)
  const { groups, error } = resolveAccountSpec(c.accounts, index)
  const base = {
    accountGroups: groups,
    unknownCodes: [] as string[],
    entityCodes,
    factorIds,
    inputError: error,
  }
  if (error) {
    return { ...base, outcome: { isValid: false, code: 'noAccounts', error } }
  }
  if (groups.length === 0) {
    return {
      ...base,
      outcome: { isValid: false, code: 'noAccounts', error: 'No account codes given.' },
    }
  }

  const { accounts, unknownCodes } = extractAccounts(index, groups, entityCodes)
  if (accounts.length === 0) {
    return {
      ...base,
      unknownCodes,
      outcome: {
        isValid: false,
        code: 'noUsableAccounts',
        error: `No valid account codes found. Invalid: ${unknownCodes.join(', ')}`,
      },
    }
  }

  const entities: FitEntity[] = entityCodes.map((code) => ({
    id: code,
    group: parseEntityCode(code)?.groupKey ?? code,
    factors: ctx.factors.values.get(code) ?? new Map<string, number>(),
  }))
  const options: FitOptions = {
    mode: c.mode,
    includeIntercept: c.includeIntercept,
    ridge: c.ridge,
    selection: c.selection.enabled
      ? {
          enabled: true,
          maxFactors: Math.max(1, Math.min(c.selection.maxFactors, MAX_FACTOR_LIMIT)),
        }
      : undefined,
  }
  const outcome = fitScalingModel({ entities, accounts, factorIds }, options)
  return { ...base, unknownCodes, outcome }
}

export interface ComparisonRow {
  id: string
  name: string
  formula: string
  factorIds: string[]
  entityCount: number
  accountCount: number
  beforeCV: number
  afterCV: number
  cvCV: number
  cvImprovement: number
  adjustedRSquared: number
  cvRSquared: number
  overfitRisk: 'low' | 'medium' | 'high'
  warningCount: number
}

/** One comparison row per successful run; failed runs are not comparable. */
export function comparisonRow(
  id: string,
  name: string,
  run: ConstellationRun | undefined,
): ComparisonRow | null {
  if (!run || !run.outcome.isValid) return null
  const r = run.outcome
  return {
    id,
    name,
    formula: r.model.formula,
    factorIds: r.model.factorIds,
    entityCount: r.metrics.entityCount,
    accountCount: r.metrics.accountCount,
    beforeCV: r.metrics.beforeCV,
    afterCV: r.metrics.afterCV,
    cvCV: r.metrics.cvCV,
    cvImprovement: r.metrics.cvImprovement,
    adjustedRSquared: r.metrics.adjustedRSquared,
    cvRSquared: r.metrics.cvRSquared,
    overfitRisk: r.metrics.overfitRisk,
    warningCount: r.warnings.length,
  }
}

/** Id of the row with the best out-of-sample improvement (ties: first). Null without rows. */
export function bestComparisonId(rows: ComparisonRow[]): string | null {
  let best: ComparisonRow | null = null
  for (const row of rows) {
    if (best === null || row.cvImprovement > best.cvImprovement + 1e-9) best = row
  }
  return best?.id ?? null
}
