/**
 * A comparison is a list of places (a municipality, a canton, the federal level, …) and a list of
 * years. The URL and the store work with dataset ids instead, one per place and year
 * (`gdn/fs/010261:2024`). This module converts between the two and answers the questions the
 * comparison wizard asks: which years do the chosen places have, and which year comes next.
 */
import { parseDatasetId } from '@/utils/PlaceFacts'
import type { AvailableDataEntry } from '@/types/DataStructures'

export interface ComparisonSelection {
  /** Places in the order the user chose them, e.g. `gdn/fs/010261` */
  places: string[]
  /** Years, oldest first */
  years: string[]
}

/** Years with data for one place; undefined when the place is not in the catalogue. */
export type AvailableYears = (placeKey: string) => readonly string[] | undefined

/** `gdn/fs/010261:2024` → `gdn/fs/010261`; null for a malformed id. */
export function placeKeyOf(datasetId: string): string | null {
  const parsed = parseDatasetId(datasetId)
  return parsed ? `${parsed.source}/${parsed.model}/${parsed.entity}` : null
}

/** `gdn/fs/010261:2024` → `2024`; null for a malformed id. */
export function yearOf(datasetId: string): string | null {
  return parseDatasetId(datasetId)?.year ?? null
}

export function datasetIdOf(placeKey: string, year: string): string {
  return `${placeKey}:${year}`
}

/** Place key of a catalogue entry. Every entry is a financial statement (`fs`). */
export function placeKeyOfEntry(entry: Pick<AvailableDataEntry, 'type' | 'entityCode'>): string {
  return `${entry.type}/fs/${entry.entityCode}`
}

export function sortYears(years: Iterable<string>): string[] {
  return [...new Set(years)].sort((a, b) => Number(a) - Number(b))
}

/** Places in the order they first appear, years oldest first. Malformed ids are skipped. */
export function selectionFromDatasets(datasetIds: readonly string[]): ComparisonSelection {
  const places: string[] = []
  const years: string[] = []
  for (const id of datasetIds) {
    const place = placeKeyOf(id)
    const year = yearOf(id)
    if (!place || !year) continue
    if (!places.includes(place)) places.push(place)
    years.push(year)
  }
  return { places, years: sortYears(years) }
}

/**
 * One dataset id per place and year, place by place, so that the table shows the years of a place
 * next to each other. A year a place has no data for is left out for that place.
 */
export function buildDatasets(
  selection: ComparisonSelection,
  available?: AvailableYears,
): string[] {
  const years = sortYears(selection.years)
  const ids: string[] = []
  for (const place of selection.places) {
    const placeYears = available?.(place)
    for (const year of years) {
      if (!placeYears || placeYears.includes(year)) ids.push(datasetIdOf(place, year))
    }
  }
  return ids
}

/**
 * True when the ids are exactly the places × years that `buildDatasets` would make of them (in any
 * order). A hand-made link such as "Zürich 2015 next to Bern 2024" is not a grid: changing its years
 * in the wizard would add columns the link did not have, so the wizard says so first.
 */
export function isGrid(datasetIds: readonly string[], available?: AvailableYears): boolean {
  const expected = buildDatasets(selectionFromDatasets(datasetIds), available)
  const given = new Set(datasetIds)
  return expected.length === given.size && expected.every((id) => given.has(id))
}

export interface YearCoverage {
  year: string
  /** How many of the places have data for this year */
  count: number
}

/** Every year at least one of the places has data for, newest first. */
export function yearCoverage(places: readonly string[], available: AvailableYears): YearCoverage[] {
  const counts = new Map<string, number>()
  for (const place of places) {
    for (const year of available(place) ?? []) counts.set(year, (counts.get(year) ?? 0) + 1)
  }
  return [...counts]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(b.year) - Number(a.year))
}

/** Newest year all places have data for; otherwise the newest year any of them has. */
export function defaultYear(places: readonly string[], available: AvailableYears): string | null {
  const coverage = yearCoverage(places, available)
  return (coverage.find((c) => c.count === places.length) ?? coverage[0])?.year ?? null
}

/** The year `step` positions after (+1) or before (-1) `year` in `allYears`; null past either end. */
export function stepYear(year: string, step: number, allYears: readonly string[]): string | null {
  const sorted = sortYears(allYears)
  const index = sorted.indexOf(year)
  if (index === -1) return null
  return sorted[index + step] ?? null
}

/** The last `count` years of `allYears`, oldest first. */
export function latestYears(allYears: readonly string[], count: number): string[] {
  return sortYears(allYears).slice(-count)
}

/** Lookup of the years per place from the catalogue. */
export function catalogAvailability(catalog: readonly AvailableDataEntry[]): AvailableYears {
  const byPlace = new Map(catalog.map((entry) => [placeKeyOfEntry(entry), entry.availableYears]))
  return (placeKey) => byPlace.get(placeKey)
}
