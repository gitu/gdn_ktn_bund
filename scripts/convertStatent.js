/**
 * Build the employment statistics from the BFS STATENT cube (px-x-0602010000_102,
 * "Arbeitsstätten und Beschäftigte nach Gemeinde und Wirtschaftssektor", 2011-2024, December).
 *
 * Replaces the retired atlas statistic `workplaces` (which was also a single, mislabelled year) with
 * one value per year, and adds statistics that are good cost drivers to optimise against: full-time
 * equivalents, establishments and jobs per economic sector (agriculture / industry / services).
 *
 * The cube has municipalities only; canton values are the sum of their municipalities.
 *
 * Usage: node scripts/convertStatent.js [--px file] [--first-year 2015] [--dry] [--force] [--date YYYY-MM-DD]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parsePxHeader, readCube } from './pxParser.js'
import {
  ROOT,
  dam,
  download,
  loadCantonIds,
  loadMunicipalityCantons,
  readStats,
  registerStat,
  sumToCantons,
  writeStatFiles,
  writeStats,
} from './statsCommon.js'

export const STATENT_ASSET_ID = '36734273'
const SOURCE = 'STATENT (BFS), px-x-0602010000_102, Referenzperiode Dezember'

const DIM = {
  year: 'Jahr',
  municipality: 'Gemeinde',
  sector: 'Wirtschaftssektor',
  unit: 'Beobachtungseinheit',
}
const SECTOR_TOTAL = 'Wirtschaftssektor - Total'

const JOBS_UNIT = {
  de: 'Berufstätige/Innen',
  fr: 'Personnes actives',
  it: 'Persone attive',
  en: 'Employed persons',
}

/** `unit` = Beobachtungseinheit label, `sector` = Wirtschaftssektor label */
export const STATS = [
  {
    id: 'workplaces',
    unit: 'Beschäftigte',
    sector: SECTOR_TOTAL,
    name: { de: 'Arbeitsplätze', fr: 'Postes de travail', it: 'Posti di lavoro', en: 'Jobs' },
    unitLabels: JOBS_UNIT,
  },
  {
    id: 'fte',
    unit: 'Vollzeitäquivalente',
    sector: SECTOR_TOTAL,
    name: {
      de: 'Vollzeitäquivalente',
      fr: 'Équivalents plein temps',
      it: 'Equivalenti a tempo pieno',
      en: 'Full-time equivalents (FTE)',
    },
    unitLabels: {
      de: 'Vollzeitäquivalente',
      fr: 'Équivalents plein temps',
      it: 'Equivalenti a tempo pieno',
      en: 'Full-time equivalents',
    },
  },
  {
    id: 'establishments',
    unit: 'Arbeitsstätten',
    sector: SECTOR_TOTAL,
    name: { de: 'Arbeitsstätten', fr: 'Établissements', it: 'Stabilimenti', en: 'Establishments' },
    unitLabels: {
      de: 'Arbeitsstätten',
      fr: 'Établissements',
      it: 'Stabilimenti',
      en: 'Establishments',
    },
  },
  {
    id: 'jobs_primary',
    unit: 'Beschäftigte',
    sector: 'Primärsektor',
    name: {
      de: 'Beschäftigte im Primärsektor (Landwirtschaft)',
      fr: 'Emplois du secteur primaire (agriculture)',
      it: 'Addetti del settore primario (agricoltura)',
      en: 'Jobs in the primary sector (agriculture)',
    },
    unitLabels: JOBS_UNIT,
  },
  {
    id: 'jobs_secondary',
    unit: 'Beschäftigte',
    sector: 'Sekundärer Sektor',
    name: {
      de: 'Beschäftigte im Sekundärsektor (Industrie, Bau)',
      fr: 'Emplois du secteur secondaire (industrie, construction)',
      it: 'Addetti del settore secondario (industria, costruzioni)',
      en: 'Jobs in the secondary sector (industry, construction)',
    },
    unitLabels: JOBS_UNIT,
  },
  {
    id: 'jobs_tertiary',
    unit: 'Beschäftigte',
    sector: 'Tertiärer Sektor',
    name: {
      de: 'Beschäftigte im Tertiärsektor (Dienstleistungen)',
      fr: 'Emplois du secteur tertiaire (services)',
      it: 'Addetti del settore terziario (servizi)',
      en: 'Jobs in the tertiary sector (services)',
    },
    unitLabels: JOBS_UNIT,
  },
]

/** `261 Zürich` -> { id: '261', name: 'Zürich' }; the `Schweiz` total row -> null. */
export function parseMunicipality(label) {
  const match = /^(\d+)\s+(.+)$/.exec(label)
  return match ? { id: String(Number.parseInt(match[1], 10)), name: match[2].trim() } : null
}

function parseArgs(argv) {
  const args = {
    px: null,
    firstYear: 2015,
    dry: false,
    force: false,
    date: new Date().toISOString().slice(0, 10),
  }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--px') args.px = argv[++i]
    else if (argv[i] === '--first-year') args.firstYear = Number(argv[++i])
    else if (argv[i] === '--date') args.date = argv[++i]
    else if (argv[i] === '--dry') args.dry = true
    else if (argv[i] === '--force') args.force = true
    else throw new Error(`Unknown argument ${argv[i]}`)
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const pxFile = args.px ? path.resolve(args.px) : path.join(ROOT, 'data', 'px-x-0602010000_102.px')
  if (args.px) {
    if (!fs.existsSync(pxFile)) throw new Error(`${pxFile} does not exist`)
  } else {
    await download(dam(STATENT_ASSET_ID), pxFile, { force: args.force })
  }

  const buffer = fs.readFileSync(pxFile)
  const header = parsePxHeader(buffer)
  const dimension = (name) => header.dimensions.find((d) => d.name === name)
  for (const name of Object.values(DIM)) {
    if (!dimension(name)) throw new Error(`Unexpected px layout: dimension "${name}" missing`)
  }

  const years = dimension(DIM.year).values.filter((year) => Number(year) >= args.firstYear)
  const municipalities = dimension(DIM.municipality)
    .values.map((label) => ({ label, ...parseMunicipality(label) }))
    .filter((m) => m.id)
  const cantonIds = loadCantonIds()
  const [, ...cantonLines] = fs
    .readFileSync(path.join(ROOT, 'public', 'data', 'cantons.csv'), 'utf8')
    .trim()
    .split(/\r?\n/)
  const cantons = cantonLines.map((line) => {
    const [id, , name] = line.split(',').map((cell) => cell.replaceAll('"', ''))
    return { id, name }
  })
  if (cantons.length !== 26 || cantonIds.size !== 26)
    throw new Error('Expected 26 cantons in public/data/cantons.csv')
  const municipalityCantons = loadMunicipalityCantons()
  console.log(
    `${years.length} years (${years[0]}-${years.at(-1)}), ${municipalities.length} municipalities`,
  )

  const stats = readStats()
  let after = 'workplaces'
  let first = true
  for (const def of STATS) {
    const cube = readCube(buffer, header, {
      pinned: { [DIM.sector]: def.sector, [DIM.unit]: def.unit },
      select: { [DIM.year]: years },
    })
    const byLevel = { gdn: new Map(), ktn: new Map() }
    let unknown = 0
    let suppressed = 0
    for (const year of years) {
      const rows = []
      for (const municipality of municipalities) {
        const value =
          cube.data[cube.offset({ [DIM.year]: year, [DIM.municipality]: municipality.label })]
        if (Number.isNaN(value)) {
          suppressed++
          continue
        }
        rows.push({ id: municipality.id, name: municipality.name, value })
      }
      const cantonSums = sumToCantons(rows, municipalityCantons, cantons)
      unknown += cantonSums.unknown.length
      byLevel.gdn.set(year, rows)
      byLevel.ktn.set(year, cantonSums.rows)
    }
    console.log(
      `${def.id.padEnd(15)} ${years.at(-1)}: ${byLevel.gdn.get(years.at(-1)).length} municipalities, ` +
        `${suppressed} suppressed cells, ${unknown} municipality-years without canton`,
    )
    const data = writeStatFiles(def.id, byLevel, { dry: args.dry })
    registerStat(stats, { ...def, unit: def.unitLabels, source: SOURCE }, data, {
      after: first ? 'workplaces' : after,
      date: args.date,
    })
    after = def.id
    first = false
  }

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
