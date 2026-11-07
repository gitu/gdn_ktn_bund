/**
 * Loads the candidate scaling factors for a set of table columns.
 *
 * Factors are not hard-coded: the caller passes the ids discovered from stats.json. Every
 * (statistic, level, year) file is fetched and parsed once; the nearest available year is used
 * (StatsDataLoader does that), so per-year statistics are picked up automatically.
 */

import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { getCantonByAbbreviation, getMunicipalityByGdnId } from '@/utils/GeographicalDataLoader'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { Logger } from '@/utils/Logger'
import type { StatsDataResult } from '@/types/StatsData'

export interface EntityRef {
  code: string
  source: 'gdn' | 'std'
  model: string
  entityId: string
  year: number
  /** source/model/id without the year: the same municipality in several years shares it. */
  groupKey: string
}

/** "gdn/fs/010261:2024" -> parts, or null when the code has an unexpected shape. */
export function parseEntityCode(code: string): EntityRef | null {
  const parts = code.split('/')
  if (parts.length !== 3 || (parts[0] !== 'gdn' && parts[0] !== 'std')) return null
  const [entityId, yearText] = parts[2].split(':')
  const year = parseInt(yearText, 10)
  if (!entityId || !Number.isFinite(year)) return null
  return {
    code,
    source: parts[0],
    model: parts[1],
    entityId,
    year,
    groupKey: `${parts[0]}/${parts[1]}/${entityId}`,
  }
}

/** Compact reference used in URLs: "010261:2024". */
export function entityKey(code: string): string {
  return code.split('/').pop() ?? code
}

export interface FactorStatsApi {
  loadGdnData(statsId: string, year: number): Promise<StatsDataResult>
  loadKtnData(statsId: string, year: number): Promise<StatsDataResult>
}

export interface FactorDependencies {
  stats: FactorStatsApi
  /** geo id of an entity as used in the statistics files ('bund', canton id, municipality id). */
  geoId: (ref: EntityRef) => Promise<string | null>
}

export async function defaultGeoId(ref: EntityRef): Promise<string | null> {
  if (ref.source === 'std') {
    if (EntitySemanticMapper.isCantonSpecific(ref.entityId)) {
      const abbreviation = EntitySemanticMapper.getCantonCodeFromEntity(ref.entityId)
      if (!abbreviation) return null
      const canton = await getCantonByAbbreviation(abbreviation.toUpperCase())
      if (!canton) return null
      // Calculated remainder of a canton (gdn_zh_rest): stored with the municipalities
      return EntitySemanticMapper.isRestOfCanton(ref.entityId)
        ? `rest_${canton.cantonId}`
        : canton.cantonId
    }
    return 'bund'
  }
  const municipality = await getMunicipalityByGdnId(ref.entityId)
  return municipality?.municipalityId ?? ref.entityId
}

export const defaultFactorDependencies = (): FactorDependencies => ({
  stats: StatsDataLoader.getInstance(),
  geoId: defaultGeoId,
})

interface LevelData {
  values: Map<string, number>
  /** Year of the file that was actually read. */
  year: number
}

const levelCache = new Map<string, Promise<LevelData | null>>()
const geoCache = new Map<string, Promise<string | null>>()

/** Forget everything that was loaded (tests, or after the statistics changed). */
export function clearFactorCache(): void {
  levelCache.clear()
  geoCache.clear()
}

function loadLevel(
  deps: FactorDependencies,
  statId: string,
  level: 'gdn' | 'ktn',
  year: number,
): Promise<LevelData | null> {
  const key = `${statId}|${level}|${year}`
  let pending = levelCache.get(key)
  if (!pending) {
    pending = (
      level === 'gdn' ? deps.stats.loadGdnData(statId, year) : deps.stats.loadKtnData(statId, year)
    )
      .then((result) => ({
        values: new Map(result.data.map((r) => [r.key, r.value])),
        year: result.metadata.year,
      }))
      .catch((error: unknown) => {
        // A statistic without data on this level is simply unavailable for these entities
        Logger.debug('Scaling factor not available', { statId, level, year, error })
        return null
      })
    levelCache.set(key, pending)
  }
  return pending
}

export interface FactorTable {
  /** entity code -> factor id -> value (missing = not available) */
  values: Map<string, Map<string, number>>
  /** factor id -> entity code -> year of the statistics file that was used */
  years: Map<string, Map<string, number>>
  /** Entity codes that could not be mapped to a geographic id. */
  unmapped: string[]
}

export async function loadFactorValues(
  entityCodes: string[],
  statIds: string[],
  deps: FactorDependencies = defaultFactorDependencies(),
): Promise<FactorTable> {
  const refs = entityCodes.map((c) => parseEntityCode(c)).filter((r): r is EntityRef => r !== null)
  const geoIds = await Promise.all(
    refs.map((ref) => {
      const key = `${ref.source}|${ref.entityId}`
      let pending = geoCache.get(key)
      if (!pending) {
        pending = deps.geoId(ref).catch(() => null)
        geoCache.set(key, pending)
      }
      return pending
    }),
  )

  const values = new Map<string, Map<string, number>>()
  const years = new Map<string, Map<string, number>>(statIds.map((id) => [id, new Map()]))
  const unmapped = refs.filter((_, i) => !geoIds[i]).map((r) => r.code)
  refs.forEach((ref) => values.set(ref.code, new Map()))

  await Promise.all(
    statIds.map(async (statId) => {
      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i]
        const geoId = geoIds[i]
        if (!geoId) continue
        let value: number | undefined
        let usedYear: number | undefined
        if (ref.source === 'gdn' || geoId.startsWith('rest_')) {
          const data = await loadLevel(deps, statId, 'gdn', ref.year)
          value = data?.values.get(geoId)
          usedYear = data?.year
        } else {
          const data = await loadLevel(deps, statId, 'ktn', ref.year)
          if (data) {
            usedYear = data.year
            value =
              geoId === 'bund'
                ? [...data.values.values()].reduce((s, v) => s + v, 0)
                : data.values.get(geoId)
          }
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
          values.get(ref.code)?.set(statId, value)
          if (usedYear !== undefined) years.get(statId)?.set(ref.code, usedYear)
        }
      }
    }),
  )
  return { values, years, unmapped }
}
