/**
 * "Places at a glance": a few plain facts (inhabitants, age and nationality mix, jobs, roads) about
 * the entity behind a selected dataset, taken from the statistics the scaling uses. They help to
 * judge what a financial figure is about: a municipality, a canton, the federal level, a social
 * insurance or a combined figure.
 */

import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { getCantonByAbbreviation, getMunicipalityByGdnId } from '@/utils/GeographicalDataLoader'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { Logger } from '@/utils/Logger'
import type { MultiLanguageLabels } from '@/types/DataStructures'

export type PlaceKind =
  | 'municipality'
  | 'canton'
  | 'cantonMunicipalities'
  | 'cantonRest'
  | 'cantonAndMunicipalities'
  | 'federal'
  | 'switzerland'
  | 'socialInsurance'
  | 'other'

export interface PlaceFacts {
  datasetId: string
  kind: PlaceKind
  year: string
  /** Label of the entity as in the table header (absent for plain municipalities: use `municipalityName`) */
  name?: MultiLanguageLabels
  municipalityName?: string
  description?: MultiLanguageLabels
  cantonAbbreviation?: string
  cantonName?: string
  population?: number
  population65Plus?: number
  populationForeign?: number
  jobs?: number
  roadKm?: number
  areaHa?: number
}

type Level = 'gdn' | 'ktn' | 'sum'

/** Value of a statistic for one place; the loader falls back to the nearest available year. */
async function statValue(
  statId: string,
  level: Level,
  geoId: string,
  year: number,
): Promise<number | undefined> {
  const loader = StatsDataLoader.getInstance()
  try {
    if (level === 'sum') {
      return (await loader.getBundData(statId, year)).totalValue
    }
    const result =
      level === 'gdn'
        ? await loader.loadGdnData(statId, year, { geoIds: [geoId] })
        : await loader.loadKtnData(statId, year, { geoIds: [geoId] })
    const value = result.data.find(
      (record: { key: string; value: number }) => record.key === geoId,
    )?.value
    return Number.isFinite(value) ? value : undefined
  } catch {
    // The statistic does not exist for this year/level: just leave the fact out
    return undefined
  }
}

async function loadStats(level: Level, geoId: string, year: number) {
  const [population, population65Plus, populationForeign, jobs, roadKm, areaHa] = await Promise.all(
    [
      statValue('pop', level, geoId, year),
      statValue('pop_65plus', level, geoId, year),
      statValue('pop_foreign', level, geoId, year),
      statValue('workplaces', level, geoId, year),
      statValue('road_length', level, geoId, year),
      // The area file lists totals and regions next to the cantons: a country-wide sum is not reliable
      level === 'sum' ? Promise.resolve(undefined) : statValue('total_area', level, geoId, year),
    ],
  )
  return { population, population65Plus, populationForeign, jobs, roadKm, areaHa }
}

/** Parse `std/fs/ktn_zh:2024` into its parts; null when the identifier is malformed. */
export function parseDatasetId(datasetId: string) {
  const parts = datasetId.split('/')
  if (parts.length !== 3) return null
  const [entity, year] = parts[2].split(':')
  if (!entity || !year) return null
  return { source: parts[0], model: parts[1], entity, year }
}

export function classifyStandardEntity(code: string): PlaceKind {
  const lower = code.toLowerCase()
  if (lower === 'bund') return 'federal'
  if (EntitySemanticMapper.isRestOfCanton(lower)) return 'cantonRest'
  if (EntitySemanticMapper.isSocialInsurance(lower)) return 'socialInsurance'
  if (lower.startsWith('ktn_gdn_') && EntitySemanticMapper.isCantonSpecific(lower))
    return 'cantonAndMunicipalities'
  if (lower.startsWith('gdn_') && EntitySemanticMapper.isCantonSpecific(lower))
    return 'cantonMunicipalities'
  if (lower.startsWith('ktn_') && EntitySemanticMapper.isCantonSpecific(lower)) return 'canton'
  if (['staat', 'gdn', 'ktn', 'bund_ktn_gdn'].includes(lower)) return 'switzerland'
  return 'other'
}

/** Facts for one dataset id like `gdn/fs/010261:2024`; null if nothing sensible can be said. */
export async function loadPlaceFacts(datasetId: string): Promise<PlaceFacts | null> {
  const parsed = parseDatasetId(datasetId)
  if (!parsed) return null
  const year = Number(parsed.year)
  const base = { datasetId, year: parsed.year }

  try {
    if (parsed.source === 'gdn') {
      const municipality = await getMunicipalityByGdnId(parsed.entity)
      if (!municipality) return { ...base, kind: 'municipality' }
      return {
        ...base,
        kind: 'municipality',
        municipalityName: municipality.municipalityLongName,
        cantonAbbreviation: municipality.cantonAbbreviation,
        ...(await loadStats('gdn', municipality.municipalityId, year)),
      }
    }

    const kind = classifyStandardEntity(parsed.entity)
    const name = EntitySemanticMapper.getEntityDisplayName(parsed.entity)
    const description = EntitySemanticMapper.getEntityDescription(parsed.entity)

    if (
      kind === 'canton' ||
      kind === 'cantonMunicipalities' ||
      kind === 'cantonAndMunicipalities' ||
      kind === 'cantonRest'
    ) {
      const abbreviation = EntitySemanticMapper.getCantonCodeFromEntity(parsed.entity).toUpperCase()
      const canton = await getCantonByAbbreviation(abbreviation)
      return {
        ...base,
        kind,
        name,
        description,
        cantonAbbreviation: abbreviation,
        cantonName: canton?.cantonLongName,
        // The calculated rest has its own record next to the municipalities: rest_<cantonId>
        ...(canton
          ? kind === 'cantonRest'
            ? await loadStats('gdn', `rest_${canton.cantonId}`, year)
            : await loadStats('ktn', canton.cantonId, year)
          : {}),
      }
    }

    if (kind === 'federal' || kind === 'switzerland') {
      return { ...base, kind, name, description, ...(await loadStats('sum', '', year)) }
    }

    return { ...base, kind, name, description }
  } catch (error) {
    Logger.warn('Could not load place facts', { datasetId, error })
    return null
  }
}

export async function loadAllPlaceFacts(datasetIds: string[]): Promise<PlaceFacts[]> {
  const all = await Promise.all(datasetIds.map((id) => loadPlaceFacts(id)))
  return all.filter((facts): facts is PlaceFacts => facts !== null)
}

/** Share of `part` in `whole` as a fraction, or undefined if either is missing/zero. */
export function share(part?: number, whole?: number): number | undefined {
  if (part === undefined || whole === undefined || whole <= 0) return undefined
  return part / whole
}
