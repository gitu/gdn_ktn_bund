/**
 * Sensible comparisons for a starting place: municipalities of a similar size in the same canton and
 * elsewhere, the canton the place belongs to, cantons of a similar size, the whole country, or the
 * other levels of government. Only places that are in the catalogue are suggested.
 *
 * "Similar size" means the smallest ratio of inhabitants (10,000 is as close to 5,000 as to 20,000).
 */
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { getAllCantons, getAllMunicipalities } from '@/utils/GeographicalDataLoader'
import { placeKeyOfEntry } from '@/utils/ComparisonSelection'
import type { AvailableDataEntry } from '@/types/DataStructures'

export type SuggestionKey =
  | 'similarInCanton'
  | 'similarElsewhere'
  | 'sameCanton'
  | 'largestInCanton'
  | 'similarCantons'
  | 'national'
  | 'levels'
  | 'otherInsurances'

export interface SuggestedPlace {
  place: string
  /** Inhabitants, where known (shown as the reason for a size suggestion) */
  population?: number
}

export interface SuggestionGroup {
  key: SuggestionKey
  places: SuggestedPlace[]
  /** Canton abbreviation the group is about, upper case (e.g. "ZH") */
  canton?: string
}

export interface SuggestionContext {
  catalog: readonly AvailableDataEntry[]
  /** Municipality entity code (`010261`) → canton (lower case) and inhabitants */
  municipalities: ReadonlyMap<string, { canton: string; population?: number }>
  /** Canton (lower case) → inhabitants of the canton */
  cantons: ReadonlyMap<string, number>
  /** Canton (lower case) → inhabitants of its calculated rest (municipalities under 5,000) */
  rests: ReadonlyMap<string, number>
}

/** Country-wide aggregates, in the order they are offered */
const LEVELS = ['gdn', 'ktn', 'ktn_gdn', 'bund', 'bund_ktn_gdn', 'staat']
const CANTON_CODE = /^(ktn_gdn|ktn|gdn)_([a-z]{2})(_rest)?$/

interface CantonCode {
  prefix: string
  canton: string
  rest: boolean
}

function cantonCode(entityCode: string): CantonCode | null {
  const match = CANTON_CODE.exec(entityCode)
  return match ? { prefix: match[1], canton: match[2], rest: Boolean(match[3]) } : null
}

const distance = (a: number, b: number) => Math.abs(Math.log(a / b))

/** The `limit` candidates closest in size to `size`, closest first. */
function closest<T>(
  candidates: T[],
  sizeOf: (c: T) => number | undefined,
  size: number,
  limit: number,
) {
  return candidates
    .map((candidate) => ({ candidate, size: sizeOf(candidate) }))
    .filter((c): c is { candidate: T; size: number } => c.size !== undefined && c.size > 0)
    .sort((a, b) => distance(a.size, size) - distance(b.size, size))
    .slice(0, limit)
}

export function suggestComparisons(
  start: string,
  context: SuggestionContext,
  limit = 5,
): SuggestionGroup[] {
  const [source, , entity] = start.split('/')
  if (!entity) return []

  const inCatalog = new Set(context.catalog.map(placeKeyOfEntry))
  const std = (code: string) => `std/fs/${code}`
  const existing = (places: string[]) => places.filter((p) => p !== start && inCatalog.has(p))
  const groups: SuggestionGroup[] = []
  const push = (group: SuggestionGroup) => {
    if (group.places.length > 0) groups.push(group)
  }

  const municipalityEntries = context.catalog.filter((e) => e.type === 'gdn')
  const municipalitiesOf = (canton: string) =>
    municipalityEntries.filter((e) => context.municipalities.get(e.entityCode)?.canton === canton)
  const populationOf = (e: AvailableDataEntry) =>
    context.municipalities.get(e.entityCode)?.population
  const asPlaces = (list: { candidate: AvailableDataEntry; size: number }[]) =>
    list.map(({ candidate, size }) => ({ place: placeKeyOfEntry(candidate), population: size }))

  // Everything a canton has: the canton itself, its municipalities, both, and the calculated rest
  const cantonFamily = (canton: string) =>
    existing([
      std(`ktn_${canton}`),
      std(`gdn_${canton}`),
      std(`ktn_gdn_${canton}`),
      std(`gdn_${canton}_rest`),
    ]).map((place) => ({ place }))

  if (source === 'gdn') {
    const own = context.municipalities.get(entity)
    if (own) {
      const others = municipalityEntries.filter((e) => e.entityCode !== entity)
      if (own.population) {
        push({
          key: 'similarInCanton',
          canton: own.canton.toUpperCase(),
          places: asPlaces(
            closest(
              others.filter((e) => context.municipalities.get(e.entityCode)?.canton === own.canton),
              populationOf,
              own.population,
              limit,
            ),
          ),
        })
        push({
          key: 'similarElsewhere',
          places: asPlaces(
            closest(
              others.filter((e) => context.municipalities.get(e.entityCode)?.canton !== own.canton),
              populationOf,
              own.population,
              limit,
            ),
          ),
        })
      }
      push({
        key: 'sameCanton',
        canton: own.canton.toUpperCase(),
        places: cantonFamily(own.canton),
      })
    }
    push({ key: 'national', places: existing([std('gdn')]).map((place) => ({ place })) })
    return groups
  }

  const code = cantonCode(entity)
  if (code) {
    const sizes = code.rest ? context.rests : context.cantons
    const own = sizes.get(code.canton)
    const sameKind = [...sizes.keys()]
      .filter((canton) => canton !== code.canton)
      .map((canton) => std(`${code.prefix}_${canton}${code.rest ? '_rest' : ''}`))
      .filter((place) => inCatalog.has(place))
    if (own) {
      push({
        key: 'similarCantons',
        places: closest(
          sameKind,
          (place) => sizes.get(cantonCode(place.split('/')[2])!.canton),
          own,
          limit,
        ).map(({ candidate, size }) => ({ place: candidate, population: size })),
      })
    }
    push({
      key: 'sameCanton',
      canton: code.canton.toUpperCase(),
      places: cantonFamily(code.canton),
    })
    push({
      key: 'largestInCanton',
      canton: code.canton.toUpperCase(),
      places: municipalitiesOf(code.canton)
        .map((e) => ({ place: placeKeyOfEntry(e), population: populationOf(e) }))
        .filter((p) => p.population !== undefined)
        .sort((a, b) => b.population! - a.population!)
        .slice(0, limit),
    })
    // The same kind of figure for the whole country (all cantons, all municipalities, both)
    push({
      key: 'national',
      places: existing([std(code.prefix), std('bund')]).map((place) => ({ place })),
    })
    return groups
  }

  if (entity === 'sv' || entity.startsWith('sv_')) {
    push({
      key: 'otherInsurances',
      places: context.catalog
        .filter(
          (e) => e.type === 'std' && (e.entityCode === 'sv' || e.entityCode.startsWith('sv_')),
        )
        .map((e) => ({ place: placeKeyOfEntry(e) }))
        .filter((p) => p.place !== start),
    })
    push({
      key: 'levels',
      places: existing([std('bund'), std('staat')]).map((place) => ({ place })),
    })
    return groups
  }

  push({ key: 'levels', places: existing(LEVELS.map(std)).map((place) => ({ place })) })
  return groups
}

// Inhabitants per year, each loaded once
const contexts = new Map<number, Promise<Omit<SuggestionContext, 'catalog'>>>()

/** Inhabitants of every municipality, canton and canton rest in `year`. */
export async function loadSuggestionContext(
  catalog: readonly AvailableDataEntry[],
  year: number,
): Promise<SuggestionContext> {
  let pending = contexts.get(year)
  pending ??= (async () => {
    const stats = StatsDataLoader.getInstance()
    const [municipalities, cantons, municipalPopulation, cantonPopulation] = await Promise.all([
      getAllMunicipalities(),
      getAllCantons(),
      stats.loadGdnData('pop', year),
      stats.loadKtnData('pop', year),
    ])
    const byBfs = new Map(municipalPopulation.data.map((r) => [r.key, r.value]))
    const abbreviationById = new Map(
      cantons.map((c) => [c.cantonId, c.cantonAbbreviation.toLowerCase()]),
    )
    return {
      municipalities: new Map(
        municipalities.map((m) => [
          m.gdnId,
          { canton: m.cantonAbbreviation.toLowerCase(), population: byBfs.get(m.municipalityId) },
        ]),
      ),
      cantons: new Map(
        cantonPopulation.data
          .filter((r) => abbreviationById.has(r.key))
          .map((r) => [abbreviationById.get(r.key)!, r.value]),
      ),
      rests: new Map(
        municipalPopulation.data
          .filter((r) => r.key.startsWith('rest_') && abbreviationById.has(r.key.slice(5)))
          .map((r) => [abbreviationById.get(r.key.slice(5))!, r.value]),
      ),
    }
  })()
  contexts.set(year, pending)
  try {
    return { catalog, ...(await pending) }
  } catch (error) {
    // Try again next time instead of keeping the failure
    contexts.delete(year)
    throw error
  }
}
