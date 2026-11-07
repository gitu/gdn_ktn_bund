/**
 * Road length per municipality (BFS table ts-x-11.03.01.07, "Strassenlänge (ohne Nationalstrassen)
 * nach Gemeinde", published for one year only). Roads are a classic cost driver for municipal
 * maintenance, so it is offered as a scaling/optimisation factor `road_length` (km). Cantons are the
 * sum of their municipalities.
 *
 * Usage: node scripts/convertRoads.js [--csv file] [--dry] [--force] [--date YYYY-MM-DD]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ROOT,
  dam,
  download,
  loadCantonIds,
  readStats,
  registerStat,
  writeStatFiles,
  writeStats,
} from './statsCommon.js'

export const ROADS_ASSET_ID = '36195696'
const SOURCE = 'Strassenlänge ohne Nationalstrassen (BFS), ts-x-11.03.01.07'

export const STAT = {
  id: 'road_length',
  name: {
    de: 'Strassenlänge (ohne Nationalstrassen)',
    fr: 'Longueur du réseau routier (sans les routes nationales)',
    it: 'Lunghezza della rete stradale (escluse le strade nazionali)',
    en: 'Road length (excluding national roads)',
  },
  unit: { de: 'km', fr: 'km', it: 'km', en: 'km' },
}

/** Parse the CSV (`REF_YEAR,GEO_COMM,GEO_CANT,VALUE`, UTF-8 with BOM) into municipal rows. */
export function parseRoadsCsv(text) {
  const [headerLine, ...lines] = text.replace(/^﻿/, '').trim().split(/\r?\n/)
  const columns = headerLine.split(',').map((cell) => cell.replaceAll('"', ''))
  const index = (name) => {
    const position = columns.indexOf(name)
    if (position === -1) throw new Error(`Unexpected roads CSV: column ${name} missing`)
    return position
  }
  const [year, commune, canton, value] = ['REF_YEAR', 'GEO_COMM', 'GEO_CANT', 'VALUE'].map(index)
  return lines.map((line) => {
    const cells = line.split(',').map((cell) => cell.replaceAll('"', ''))
    return {
      year: cells[year],
      id: String(Number.parseInt(cells[commune], 10)),
      canton: cells[canton],
      value: Number(cells[value]),
    }
  })
}

async function main() {
  const args = { csv: null, dry: false, force: false, date: new Date().toISOString().slice(0, 10) }
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--csv') args.csv = argv[++i]
    else if (argv[i] === '--date') args.date = argv[++i]
    else if (argv[i] === '--dry') args.dry = true
    else if (argv[i] === '--force') args.force = true
    else throw new Error(`Unknown argument ${argv[i]}`)
  }

  const file = args.csv ? path.resolve(args.csv) : path.join(ROOT, 'data', 'ts-x-11.03.01.07.csv')
  if (args.csv) {
    if (!fs.existsSync(file)) throw new Error(`${file} does not exist`)
  } else {
    await download(dam(ROADS_ASSET_ID), file, { force: args.force })
  }

  const records = parseRoadsCsv(fs.readFileSync(file, 'utf8')).filter(
    (record) => !Number.isNaN(record.value),
  )
  const year = [...new Set(records.map((record) => record.year))].sort().at(-1)
  const latest = records.filter((record) => record.year === year)

  // Municipality names and canton ids come from the register files the app already ships
  const names = new Map()
  const [, ...lines] = fs
    .readFileSync(path.join(ROOT, 'public', 'data', 'municipalities.csv'), 'utf8')
    .trim()
    .split(/\r?\n/)
  for (const line of lines) {
    const cells = line.split(',').map((cell) => cell.replaceAll('"', ''))
    names.set(cells[2], cells[3])
  }
  const cantonIds = loadCantonIds()
  const [, ...cantonLines] = fs
    .readFileSync(path.join(ROOT, 'public', 'data', 'cantons.csv'), 'utf8')
    .trim()
    .split(/\r?\n/)
  const cantonNames = new Map(
    cantonLines.map((line) => {
      const [id, , name] = line.split(',').map((cell) => cell.replaceAll('"', ''))
      return [id, name]
    }),
  )

  const municipalRows = latest.map((record) => ({
    id: record.id,
    name: names.get(record.id) ?? record.id,
    value: record.value,
  }))
  const totals = new Map()
  for (const record of latest) {
    const id = cantonIds.get(record.canton)
    if (id === undefined) throw new Error(`Unknown canton ${record.canton}`)
    totals.set(id, (totals.get(id) ?? 0) + record.value)
  }
  const cantonRows = [...totals]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([id, value]) => ({
      id,
      name: cantonNames.get(id) ?? id,
      value: Math.round(value * 1000) / 1000,
    }))

  console.log(
    `${STAT.id} ${year}: ${municipalRows.length} municipalities, ${cantonRows.length} cantons`,
  )
  const data = writeStatFiles(
    STAT.id,
    { gdn: new Map([[year, municipalRows]]), ktn: new Map([[year, cantonRows]]) },
    { dry: args.dry },
  )

  const stats = readStats()
  registerStat(stats, { ...STAT, source: SOURCE }, data, {
    after: 'jobs_tertiary',
    date: args.date,
  })
  if (args.dry) {
    console.log('Dry run: nothing written')
    return
  }
  writeStats(stats)
  console.log('Updated public/data/stats/stats.json')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
