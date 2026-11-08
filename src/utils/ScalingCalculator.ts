/**
 * The "convert" step of a comparison on its own: what each financial column is divided by.
 *
 * For a statistic (`pop`) that is its value for the place and year; for a custom formula
 * (`custom:pop+fte/2`) the formula evaluated with those values. The calculation needs only the
 * statistics, not the financial data, so the comparison wizard can show the divisors before any
 * account is loaded, and the store applies the very same numbers to the loaded columns.
 */
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import {
  CustomScalingFormula,
  CUSTOM_SCALING_PREFIX,
  type ScalingVariable,
} from '@/utils/CustomScalingFormula'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { getCantonByAbbreviation, getMunicipalityByGdnId } from '@/utils/GeographicalDataLoader'
import { parseDatasetId } from '@/utils/PlaceFacts'
import { Logger } from '@/utils/Logger'
import { i18n } from '@/i18n'
import type { MultiLanguageLabels } from '@/types/DataStructures'

type Source = 'gdn' | 'std'
const LANGUAGES = ['de', 'fr', 'it', 'en'] as const

/** One statistic that went into a divisor. */
export interface ScalingInput {
  statId: string
  value: number
  /** Year of the statistic actually used; the loader takes the nearest year when one is missing */
  year?: number
}

export interface ScalingOutcome {
  datasetId: string
  /** What the column is divided by; null when a statistic is missing or the result is not positive */
  factor: number | null
  inputs: ScalingInput[]
}

export type ScalingCalculation =
  | { ok: true; label: MultiLanguageLabels; outcomes: Map<string, ScalingOutcome> }
  /** `unknown`: no statistic with this id; otherwise `error` says what is wrong with the formula */
  | { ok: false; unknown?: boolean; error?: string }

/** The statistics a scaling id needs: one statistic, or the variables of a custom formula. */
export function isCustomScaling(scalingId: string): boolean {
  return scalingId.startsWith(CUSTOM_SCALING_PREFIX)
}

export function formulaOf(scalingId: string): string {
  return isCustomScaling(scalingId) ? scalingId.substring(CUSTOM_SCALING_PREFIX.length) : scalingId
}

const translate = (key: string, params: Record<string, unknown>, locale: string) =>
  (i18n.global as { t: (k: string, p: Record<string, unknown>, l: string) => string }).t(
    key,
    params,
    locale,
  )

/**
 * A formula for people: statistic ids replaced by their names and the operators typeset,
 * e.g. `pop+workplaces/2` → "Bevölkerung + Arbeitsplätze ÷ 2".
 */
export function describeFormula(formula: string, nameOf: (statId: string) => string): string {
  const OPERATORS: Record<string, string> = { '+': ' + ', '-': ' − ', '*': ' × ', '/': ' ÷ ' }
  // Token by token, so that a name containing "/" or "-" is never typeset as an operator
  const tokens = formula.replace(/\s+/g, '').match(/[A-Za-z_]\w*|\d+(?:\.\d+)?|[-+*/()]/g) ?? []
  return tokens
    .map((token, index) => {
      if (/^[A-Za-z_]/.test(token)) return nameOf(token)
      if (!(token in OPERATORS)) return token
      // A leading minus is a sign, not a subtraction
      const previous = tokens[index - 1]
      const isSign =
        token === '-' && (previous === undefined || previous === '(' || previous in OPERATORS)
      return isSign ? '−' : OPERATORS[token]
    })
    .join('')
    .trim()
}

/** Short name of a statistic in a language (the scaling selector's labels), else its full name. */
export function statisticName(
  statId: string,
  stats: readonly { id: string; name: MultiLanguageLabels }[],
  locale: string,
): string {
  const key = `financialDataScalingSelector.options.${statId}`
  const short = translate(key, {}, locale)
  if (short && short !== key) return short
  const stat = stats.find((s) => s.id === statId)
  return stat?.name[locale as keyof MultiLanguageLabels] || stat?.name.de || statId
}

export class ScalingCalculator {
  private readonly stats = StatsDataLoader.getInstance()
  // Shared between columns and repeated calculations: every column of a place-and-year loads once
  private readonly cache = new Map<string, Promise<{ value: number | null; year?: number }>>()

  clear() {
    this.cache.clear()
  }

  /**
   * Which statistics record belongs to a column: a municipality (BFS number), a canton (id 1-26),
   * the country ("bund"), or the calculated rest of a canton, which is stored with the
   * municipalities under `rest_<cantonId>`.
   */
  async resolveTarget(
    source: Source,
    entityId: string,
  ): Promise<{ geoId: string; source: Source }> {
    if (source === 'gdn') {
      const municipality = await getMunicipalityByGdnId(entityId)
      return { geoId: municipality?.municipalityId || entityId, source }
    }

    if (EntitySemanticMapper.isCantonSpecific(entityId)) {
      const cantonCode = EntitySemanticMapper.getCantonCodeFromEntity(entityId)
      const canton = cantonCode
        ? await getCantonByAbbreviation(cantonCode.toUpperCase())
        : undefined
      // An unknown canton gets an id of its own that no statistic has: no divisor, and no cache
      // entry shared with another unknown place
      const unknown = `unknown:${entityId}`
      if (EntitySemanticMapper.isRestOfCanton(entityId)) {
        return { geoId: canton ? `rest_${canton.cantonId}` : unknown, source: 'gdn' }
      }
      return { geoId: canton?.cantonId || unknown, source }
    }

    return { geoId: 'bund', source }
  }

  /** Value of one statistic for one place and year (null when there is none). */
  loadStat(statId: string, geoId: string, year: number, source: Source) {
    const key = `${statId}:${geoId}:${year}:${source}`
    let pending = this.cache.get(key)
    if (!pending) {
      pending = this.fetchStat(statId, geoId, year, source)
      this.cache.set(key, pending)
    }
    return pending
  }

  private async fetchStat(
    statId: string,
    geoId: string,
    year: number,
    source: Source,
  ): Promise<{ value: number | null; year?: number }> {
    try {
      if (source === 'std' && geoId === 'bund') {
        const result = await this.stats.getBundData(statId, year)
        return { value: result.totalValue ?? null, year: result.year }
      }
      const result =
        source === 'gdn'
          ? await this.stats.loadGdnData(statId, year, { geoIds: [geoId] })
          : await this.stats.loadKtnData(statId, year, { geoIds: [geoId] })
      const record = result.data.find((r: { key: string; value: number }) => r.key === geoId)
      return { value: record ? record.value : null, year: result.metadata?.year }
    } catch (error) {
      Logger.error('Failed to load scaling factor for entity', error, { geoId, statId })
      return { value: null }
    }
  }

  /** Divisor for one column; `statIds` are the statistics the formula uses. */
  private async calculateOne(
    datasetId: string,
    formula: string,
    statIds: string[],
    custom: boolean,
  ): Promise<ScalingOutcome> {
    const parsed = parseDatasetId(datasetId)
    if (!parsed) return { datasetId, factor: null, inputs: [] }

    const target = await this.resolveTarget(parsed.source as Source, parsed.entity)
    const inputs: ScalingInput[] = []
    for (const statId of statIds) {
      const stat = await this.loadStat(statId, target.geoId, Number(parsed.year), target.source)
      if (stat.value !== null) inputs.push({ statId, value: stat.value, year: stat.year })
    }

    let factor: number | null = null
    if (!custom) {
      factor = inputs[0]?.value ?? null
    } else if (inputs.length === statIds.length) {
      const variables = new Map<string, ScalingVariable>(
        inputs.map((input) => [
          input.statId,
          {
            id: input.statId,
            name: labelsOf(input.statId),
            value: input.value,
            unit: labelsOf(''),
          },
        ]),
      )
      const result = CustomScalingFormula.evaluateFormula(formula, variables)
      factor = result.isValid && result.result !== undefined ? result.result : null
    }

    // Dividing by zero or by a negative number would turn the table upside down
    if (factor === null || !Number.isFinite(factor) || factor <= 0) factor = null
    return { datasetId, factor, inputs }
  }

  /**
   * Divisors for all columns. The label describes the scaling in the four languages (the store shows
   * it as `scalingInfo`).
   */
  async calculate(scalingId: string, datasetIds: readonly string[]): Promise<ScalingCalculation> {
    const custom = isCustomScaling(scalingId)
    const formula = formulaOf(scalingId)
    let statIds: string[]
    let label: MultiLanguageLabels

    if (custom) {
      const availableStats = await this.stats.getAvailableStats()
      const validation = CustomScalingFormula.validateFormula(formula, availableStats)
      if (!validation.isValid) return { ok: false, error: validation.error }
      statIds = validation.usedFactors ?? []
      label = Object.fromEntries(
        LANGUAGES.map((language) => [
          language,
          translate(
            'financialDataScalingSelector.scalingInfo.customFormat',
            {
              formula: describeFormula(formula, (id) =>
                statisticName(id, availableStats, language),
              ),
            },
            language,
          ),
        ]),
      ) as unknown as MultiLanguageLabels
    } else {
      const entry = await this.stats.getStatsEntry(scalingId)
      if (!entry) return { ok: false, unknown: true }
      statIds = [scalingId]
      label = Object.fromEntries(
        LANGUAGES.map((language) => [
          language,
          translate(
            'financialDataScalingSelector.scalingInfo.format',
            { name: entry.name[language], unit: entry.unit[language] },
            language,
          ),
        ]),
      ) as unknown as MultiLanguageLabels
    }

    const results = await Promise.all(
      datasetIds.map((id) => this.calculateOne(id, formula, statIds, custom)),
    )
    return { ok: true, label, outcomes: new Map(results.map((r) => [r.datasetId, r])) }
  }
}

function labelsOf(text: string): MultiLanguageLabels {
  return { de: text, fr: text, it: text, en: text }
}
