/**
 * "Rest of canton": the municipalities below the 5,000-inhabitant threshold, calculated.
 *
 * The EFV publishes every municipality with 5,000 or more inhabitants individually (`gdn/fs/<id>`), and for
 * every canton an aggregate over *all* its municipalities (`std/fs/gdn_<canton>`). The difference of the two is the
 * remainder, written as `std/fs/gdn_<canton>_rest/<year>.csv`, with matching population/jobs/road statistics
 * (`rest_<cantonId>` rows in the municipal stats files) so that it can be scaled like everything else.
 *
 * This is an approximation and the app says so wherever it is used. What cannot be derived is left out:
 * - Transfers between public bodies (accounts 361-363 expenses, 461-463 revenue). Municipal files list them at gross,
 *   the canton aggregate nets them out, so the difference is meaningless (CHF -1.0 bn for Zürich 2022, account 362).
 * - Any other account whose remainder would be negative (the listed municipalities add up to more than the canton).
 * - The split by function: only the municipal files have it.
 *
 * Run after `npm run split` and `npm run fetch-stats` (both rewrite files this script adds to):
 *   node scripts/buildRestOfCantons.js [--dry]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { ROOT, STATS_DIR, loadCantonIds, readStats } from './statsCommon.js'

/** Inter-municipal transfers: expenses 361-363, revenue 461-463. Never derived. */
export const EXCLUDED_ACCOUNTS = new Set(['361', '362', '363', '461', '462', '463'])
const DIMS = ['bilanz', 'aufwand', 'ertrag']
/** Rounding noise between two sources, in CHF */
const TOLERANCE = 1
const FIRST_YEAR = 2015

/** Statistics that can be subtracted (counts and lengths); averages and the 2018 area file are not. */
export const ADDITIVE_STATS = [
  'pop',
  'pop_0_19',
  'pop_20_64',
  'pop_65plus',
  'pop_foreign',
  'workplaces',
  'fte',
  'establishments',
  'jobs_primary',
  'jobs_secondary',
  'jobs_tertiary',
  'road_length',
]

const key = (dim, arten) => `${dim}|${arten}`

/** Blank cells are missing values, not zeros (`Number('')` is 0). */
const parseValue = (text) =>
  text === undefined || String(text).trim() === '' ? Number.NaN : Number(text)

/**
 * Canton aggregate (one row per account, no function): value per 3-digit account. Finer accounts (4 or 5 digits)
 * are rolled up where the 3-digit row is missing, because the aggregates list e.g. taxes (400-403) only that way.
 * @param {{ arten: string, funk: string, value: string, dim: string }[]} rows
 * @returns {Map<string, number>} `dim|arten` -> CHF
 */
export function aggregateStandardRows(rows) {
  const groups = new Map()
  for (const row of rows) {
    if (!DIMS.includes(row.dim) || row.funk || row.arten.length < 3) continue
    const value = parseValue(row.value)
    if (!Number.isFinite(value)) continue
    const group = key(row.dim, row.arten.slice(0, 3))
    const levels = groups.get(group) ?? {}
    levels[row.arten.length] = (levels[row.arten.length] ?? 0) + value
    groups.set(group, levels)
  }
  return new Map(
    [...groups].map(([group, levels]) => [group, levels[3] ?? levels[4] ?? levels[5] ?? 0]),
  )
}

/** Municipal file: sum over all functions per 3-digit account. */
export function aggregateMunicipalRows(rows) {
  const sums = new Map()
  for (const row of rows) {
    if (!DIMS.includes(row.dim) || row.arten.length < 3) continue
    const value = parseValue(row.value)
    if (!Number.isFinite(value)) continue
    const group = key(row.dim, row.arten.slice(0, 3))
    sums.set(group, (sums.get(group) ?? 0) + value)
  }
  return sums
}

/**
 * Canton total minus the listed municipalities, per account.
 * @param {Map<string, number>} total canton aggregate
 * @param {Map<string, number>} listed sum of the listed municipalities
 * @returns {{ rows: { dim: string, arten: string, value: number }[],
 *            dropped: { dim: string, arten: string, reason: 'transfer' | 'negative' }[] }}
 */
export function computeRest(total, listed) {
  const rows = []
  const dropped = []
  for (const group of new Set([...total.keys(), ...listed.keys()])) {
    const [dim, arten] = group.split('|')
    const t = total.get(group) ?? 0
    const l = listed.get(group) ?? 0
    if (t === 0 && l === 0) continue
    if (EXCLUDED_ACCOUNTS.has(arten)) {
      dropped.push({ dim, arten, reason: 'transfer' })
      continue
    }
    const rest = t - l
    // Natural credit balances (both negative) are fine; otherwise a clearly negative remainder is not derivable
    if (rest < -TOLERANCE && !(t < 0 && l < 0)) {
      dropped.push({ dim, arten, reason: 'negative' })
      continue
    }
    rows.push({
      dim,
      arten,
      value: Math.round((rest < 0 && rest >= -TOLERANCE ? 0 : rest) * 100) / 100,
    })
  }
  rows.sort((a, b) => DIMS.indexOf(a.dim) - DIMS.indexOf(b.dim) || a.arten.localeCompare(b.arten))
  return { rows, dropped }
}

/** Sanity gate: the remainder of the balance sheet must be non-negative and not exceed the canton. */
export function balanceSheetIsPlausible(restRows, total) {
  const side = (rows, first) =>
    rows.filter((r) => r.dim === 'bilanz' && r.arten[0] === first).reduce((s, r) => s + r.value, 0)
  const canton = (first) =>
    [...total]
      .filter(([k]) => k.startsWith('bilanz|') && k.split('|')[1][0] === first)
      .reduce((s, [, v]) => s + v, 0)
  const assets = side(restRows, '1')
  const liabilities = side(restRows, '2')
  return (
    assets >= 0 &&
    liabilities >= 0 &&
    assets <= canton('1') + TOLERANCE &&
    liabilities <= canton('2') + TOLERANCE
  )
}

/**
 * Where (almost) all municipalities are listed individually the remainder is just rounding noise between the
 * two sources (Glarus: CHF 3 m of 580 m). Below this share of the canton's assets no rest dataset is offered.
 */
export const MIN_MATERIAL_SHARE = 0.01

export function restIsMaterial(restRows, total) {
  const assets = (entries) => entries.reduce((sum, value) => sum + value, 0)
  const rest = assets(
    restRows.filter((r) => r.dim === 'bilanz' && r.arten[0] === '1').map((r) => r.value),
  )
  const canton = assets(
    [...total]
      .filter(([k]) => k.startsWith('bilanz|') && k.split('|')[1][0] === '1')
      .map(([, v]) => v),
  )
  return canton > 0 && rest / canton >= MIN_MATERIAL_SHARE
}

export function toStandardCsv(rows, year) {
  const lines = rows.map(
    (r) => `"${r.arten}","","${year}","${r.value.toFixed(2)}","${r.dim}","CHF"`,
  )
  return ['"arten","funk","jahr","value","dim","unit"', ...lines].join('\n') + '\n'
}

/** `010261` (canton id 01 + BFS number 0261) -> the BFS number as the statistics use it: `261`. */
export const bfsNumber = (gdnId) => String(Number.parseInt(gdnId.slice(2), 10))

function readCsv(file, delimiter = ',') {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '')
  return Papa.parse(text, { header: true, delimiter, skipEmptyLines: true }).data
}

function main() {
  const dry = process.argv.includes('--dry')
  const dataDir = path.join(ROOT, 'public', 'data')
  const cantonIds = loadCantonIds() // ZH -> '1'
  const cantons = [...cantonIds].map(([abbreviation, id]) => ({
    abbreviation: abbreviation.toLowerCase(),
    id,
  }))

  // Which municipalities are listed in which year, per canton prefix
  const listedByYear = new Map() // year -> canton prefix -> [gdnId]
  for (const gdnId of fs.readdirSync(path.join(dataDir, 'gdn', 'fs'))) {
    for (const file of fs.readdirSync(path.join(dataDir, 'gdn', 'fs', gdnId))) {
      const year = file.replace('.csv', '')
      if (Number(year) < FIRST_YEAR) continue
      const prefix = gdnId.slice(0, 2)
      const byPrefix = listedByYear.get(year) ?? new Map()
      byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), gdnId])
      listedByYear.set(year, byPrefix)
    }
  }

  const stdInfoPath = path.join(ROOT, 'src', 'data', 'std-info.json')
  const stdInfo = JSON.parse(fs.readFileSync(stdInfoPath, 'utf8')).filter(
    (entry) => !entry.hh.endsWith('_rest'),
  )
  const summary = {
    datasets: 0,
    skippedYears: [],
    negligible: [],
    droppedTransfer: 0,
    droppedNegative: 0,
  }
  const restYears = new Map() // canton id -> years that have a rest dataset

  for (const canton of cantons) {
    const prefix = canton.id.padStart(2, '0')
    const hh = `gdn_${canton.abbreviation}_rest`
    const outDir = path.join(dataDir, 'std', 'fs', hh)
    if (!dry) fs.rmSync(outDir, { recursive: true, force: true })

    const years = []
    for (const year of [...listedByYear.keys()].sort()) {
      const totalFile = path.join(dataDir, 'std', 'fs', `gdn_${canton.abbreviation}`, `${year}.csv`)
      const listedIds = listedByYear.get(year).get(prefix) ?? []
      if (!fs.existsSync(totalFile) || listedIds.length === 0) continue

      const total = aggregateStandardRows(readCsv(totalFile))
      const listed = new Map()
      for (const gdnId of listedIds) {
        for (const [group, value] of aggregateMunicipalRows(
          readCsv(path.join(dataDir, 'gdn', 'fs', gdnId, `${year}.csv`)),
        )) {
          listed.set(group, (listed.get(group) ?? 0) + value)
        }
      }

      const { rows, dropped } = computeRest(total, listed)
      if (!balanceSheetIsPlausible(rows, total)) {
        summary.skippedYears.push(`${canton.abbreviation} ${year}`)
        continue
      }
      if (!restIsMaterial(rows, total)) {
        summary.negligible.push(`${canton.abbreviation} ${year}`)
        continue
      }
      summary.droppedTransfer += dropped.filter((d) => d.reason === 'transfer').length
      summary.droppedNegative += dropped.filter((d) => d.reason === 'negative').length
      if (!dry) {
        fs.mkdirSync(outDir, { recursive: true })
        fs.writeFileSync(path.join(outDir, `${year}.csv`), toStandardCsv(rows, year))
      }
      years.push(year)
      summary.datasets++
    }

    if (years.length > 0) {
      stdInfo.push({ hh, models: [{ model: 'fs', jahre: years }] })
      restYears.set(canton.id, years)
    }
  }

  stdInfo.sort((a, b) => (a.hh < b.hh ? -1 : a.hh > b.hh ? 1 : 0))
  if (!dry) fs.writeFileSync(stdInfoPath, JSON.stringify(stdInfo, null, 2))

  // Matching statistics, so that the rest can be scaled per inhabitant, job, road km ...
  const stats = readStats().stats
  const added = []
  for (const id of ADDITIVE_STATS) {
    const stat = stats.find((s) => s.id === id)
    if (!stat) continue
    for (const { year, file } of stat.data.gdn) {
      const ktnEntry = stat.data.ktn.find((e) => e.year === year)
      if (!ktnEntry) continue
      const gdnPath = path.join(STATS_DIR, file)
      const municipal = new Map(readCsv(gdnPath, ';').map((r) => [r.GEO_ID, Number(r.VALUE)]))
      const cantonal = new Map(
        readCsv(path.join(STATS_DIR, ktnEntry.file), ';').map((r) => [r.GEO_ID, Number(r.VALUE)]),
      )

      // Years without financial data (e.g. roads: 2025) use the listed municipalities of the nearest financial year
      const financialYears = [...listedByYear.keys()].map(Number).sort((a, b) => a - b)
      const nearest = financialYears.reduce((best, y) =>
        Math.abs(y - year) < Math.abs(best - year) ? y : best,
      )
      const lines = []
      for (const canton of cantons) {
        if (!(restYears.get(canton.id) ?? []).length) continue
        const listedIds = listedByYear.get(String(nearest)).get(canton.id.padStart(2, '0')) ?? []
        let rest = cantonal.get(canton.id)
        for (const gdnId of listedIds) {
          const value = municipal.get(bfsNumber(gdnId))
          // A listed municipality without a value (merged away, suppressed) makes the remainder unreliable
          if (value === undefined || !Number.isFinite(value)) {
            rest = undefined
            break
          }
          rest -= value
        }
        if (rest === undefined || !Number.isFinite(rest) || rest <= 0) continue
        lines.push(
          `"rest_${canton.id}";"Übrige Gemeinden ${canton.abbreviation.toUpperCase()}";${Math.round(rest * 1000) / 1000}`,
        )
      }

      if (!dry) {
        const kept = fs
          .readFileSync(gdnPath, 'utf8')
          .split(/\r?\n/)
          .filter((line) => line !== '' && !line.startsWith('"rest_'))
        fs.writeFileSync(gdnPath, [...kept, ...lines].join('\n') + '\n')
      }
      added.push(`${id} ${year}: ${lines.length}`)
    }
  }

  console.log(`${summary.datasets} rest-of-canton datasets (${restYears.size} cantons)`)
  console.log(
    `accounts left out: ${summary.droppedTransfer} transfers, ${summary.droppedNegative} with a negative remainder`,
  )
  console.log(
    `canton-years skipped (implausible balance sheet): ${summary.skippedYears.join(', ') || 'none'}`,
  )
  console.log(
    `canton-years skipped (rest under ${MIN_MATERIAL_SHARE * 100}% of the canton): ${summary.negligible.length}; ` +
      `cantons without any rest dataset: ${
        cantons
          .filter((c) => !restYears.has(c.id))
          .map((c) => c.abbreviation)
          .join(', ') || 'none'
      }`,
  )
  console.log(`statistics rows added for ${added.length} stat-years`)
  if (dry) console.log('Dry run: nothing written')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
