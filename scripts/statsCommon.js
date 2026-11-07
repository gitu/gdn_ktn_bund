/**
 * Helpers shared by the scripts that build public/data/stats from BFS downloads
 * (convertPxToStats.js = STATPOP, convertStatent.js = STATENT, convertRoads.js = road length).
 */

import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const STATS_DIR = path.join(ROOT, 'public', 'data', 'stats')
export const STATS_JSON = path.join(STATS_DIR, 'stats.json')

export const dam = (assetId) => `https://dam-api.bfs.admin.ch/hub/api/dam/assets/${assetId}/master`

const csvQuote = (text) => `"${String(text).replaceAll('"', '""')}"`

/** rows: { id, name, value } -> the `GEO_ID;GEO_NAME;VALUE` layout stats.json describes (dataFormat). */
export function toCsv(rows) {
  const lines = rows.map((row) => `${csvQuote(row.id)};${csvQuote(row.name)};${row.value}`)
  return ['"GEO_ID";"GEO_NAME";VALUE', ...lines].join('\n') + '\n'
}

/** Download `url` to `destination` unless it is already there (use force to refresh). */
export async function download(url, destination, { force = false } = {}) {
  if (fs.existsSync(destination) && !force) return
  console.log(`Downloading ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}. Behind a proxy set NODE_USE_ENV_PROXY=1.`)
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination))
  console.log(
    `Saved ${(fs.statSync(destination).size / 1e6).toFixed(1)} MB to ${path.relative(ROOT, destination)}`,
  )
}

/**
 * Write `<id>/<level>/<year>.csv` for every year and return the `data` block for stats.json.
 * @param {string} id statistic id
 * @param {Record<'gdn' | 'ktn', Map<string, { id: string, name: string, value: number }[]>>} byLevel
 *   level -> year -> rows
 */
export function writeStatFiles(id, byLevel, { dry = false } = {}) {
  const data = { ktn: [], gdn: [] }
  for (const level of ['gdn', 'ktn']) {
    for (const [year, rows] of [...byLevel[level]].sort((a, b) => a[0].localeCompare(b[0]))) {
      data[level].push({ year: Number(year), file: `${id}/${level}/${year}.csv` })
      if (dry) continue
      fs.mkdirSync(path.join(STATS_DIR, id, level), { recursive: true })
      fs.writeFileSync(path.join(STATS_DIR, id, level, `${year}.csv`), toCsv(rows))
    }
  }
  return data
}

/**
 * Add or update a statistic in stats.json (in memory). New ones are inserted after `after`.
 * Existing metadata the user may have tuned (mode, dataFormat) is kept.
 */
export function registerStat(stats, definition, data, { after = 'pop', date }) {
  const template = stats.stats.find((stat) => stat.dataFormat)
  const existing = stats.stats.find((stat) => stat.id === definition.id)
  if (existing) {
    Object.assign(existing, {
      name: definition.name,
      unit: definition.unit,
      source: definition.source,
      lastUpdate: date,
      data,
    })
    return existing
  }
  const stat = {
    id: definition.id,
    name: definition.name,
    unit: definition.unit,
    mode: definition.mode ?? 'absolut',
    source: definition.source,
    lastUpdate: date,
    dataFormat: template.dataFormat,
    data,
  }
  const index = stats.stats.findIndex((entry) => entry.id === after)
  stats.stats.splice(index === -1 ? stats.stats.length : index + 1, 0, stat)
  return stat
}

export function readStats() {
  return JSON.parse(fs.readFileSync(STATS_JSON, 'utf8'))
}

export function writeStats(stats) {
  // Same layout as the committed file: 2 spaces, no trailing newline
  fs.writeFileSync(STATS_JSON, JSON.stringify(stats, null, 2))
}

/** canton abbreviation (ZH, BE, ...) -> canton id string ('1'..'26'), from public/data/cantons.csv */
export function loadCantonIds() {
  const ids = new Map()
  const [, ...lines] = fs
    .readFileSync(path.join(ROOT, 'public', 'data', 'cantons.csv'), 'utf8')
    .trim()
    .split(/\r?\n/)
  for (const line of lines) {
    const [id, abbreviation] = line.split(',').map((cell) => cell.replaceAll('"', ''))
    ids.set(abbreviation, id)
  }
  return ids
}

/**
 * BFS municipality number -> canton id, also for municipalities that no longer exist.
 * Built from the eCH-0071 register (data/eCH0071_*.xml) so that a merged-away municipality still
 * lands in the right canton when municipal figures are summed to cantons; the current list in
 * public/data/municipalities.csv wins where both know the municipality.
 */
export function loadMunicipalityCantons() {
  const cantonIds = loadCantonIds()
  const map = new Map()

  const register = fs
    .readdirSync(path.join(ROOT, 'data'))
    .find((name) => /^eCH0071.*\.xml$/.test(name))
  if (register) {
    const xml = fs.readFileSync(path.join(ROOT, 'data', register), 'utf8')
    for (const match of xml.matchAll(
      /<cantonAbbreviation>(\w+)<\/cantonAbbreviation>\s*<municipalityId>(\d+)<\/municipalityId>/g,
    )) {
      map.set(match[2], cantonIds.get(match[1]))
    }
  }

  const [, ...lines] = fs
    .readFileSync(path.join(ROOT, 'public', 'data', 'municipalities.csv'), 'utf8')
    .trim()
    .split(/\r?\n/)
  for (const line of lines) {
    const [cantonId, , municipalityId] = line.split(',').map((cell) => cell.replaceAll('"', ''))
    map.set(municipalityId, cantonId)
  }
  return map
}

/** Sum municipal rows to cantons. Rows whose municipality has no known canton are returned in `unknown`. */
export function sumToCantons(rows, municipalityCantons, cantons) {
  const totals = new Map(cantons.map((canton) => [canton.id, 0]))
  const unknown = []
  for (const row of rows) {
    const cantonId = municipalityCantons.get(row.id)
    if (cantonId === undefined) unknown.push(row)
    else totals.set(cantonId, totals.get(cantonId) + row.value)
  }
  return {
    rows: cantons.map((canton) => ({
      id: canton.id,
      name: canton.name,
      value: totals.get(canton.id),
    })),
    unknown,
  }
}
