/**
 * Build the population statistics (per year, per municipality and canton) from the BFS STATPOP cube.
 *
 * Why: the BFS atlas that `fetchAtlasData.js` used was retired (its CSV URLs return 404). The same
 * indicator, inhabitants at year end, is published as the PC-Axis cube px-x-0102010000_101
 * ("Ständige und nichtständige Wohnbevölkerung nach institutionellen Gliederungen, ...", 2010-2025,
 * reference date 31 December, municipal structure as of 2025-04-06). It also carries age and
 * nationality, so besides `pop` we derive statistics that are good cost drivers to optimise against:
 * young (0-19), working-age (20-64) and elderly (65+) inhabitants and foreign nationals.
 *
 * Usage:
 *   node scripts/convertPxToStats.js                 # downloads the cube if data/ has no copy
 *   node scripts/convertPxToStats.js --px file.px    # use a local copy
 *   node scripts/convertPxToStats.js --first-year 2015 --dry
 *
 * Writes public/data/stats/<id>/{gdn,ktn}/<year>.csv and registers the years in stats.json.
 * Behind a proxy run with NODE_USE_ENV_PROXY=1 so that fetch() honours HTTPS_PROXY.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parsePxHeader, readCube } from './pxParser.js'
import {
  ROOT,
  dam,
  download,
  readStats,
  registerStat,
  writeStatFiles,
  writeStats,
} from './statsCommon.js'

export const PX_ASSET_ID = '36733988'
export const PX_URL = dam(PX_ASSET_ID)
const SOURCE = 'STATPOP (BFS), px-x-0102010000_101, Stichtag 31.12.'

const DIM = {
  year: 'Jahr',
  region: 'Kanton (-) / Bezirk (>>) / Gemeinde (......)',
  type: 'Bevölkerungstyp',
  nationality: 'Staatsangehörigkeit (Kategorie)',
  sex: 'Geschlecht',
  age: 'Alter',
}
const PERMANENT = 'Ständige Wohnbevölkerung'
const NATIONALITY_TOTAL = 'Staatsangehörigkeit (Kategorie) - Total'
const SEX_TOTAL = 'Geschlecht - Total'
const AGE_TOTAL = 'Alter - Total'

const UNIT = {
  de: 'Einwohner/Innen',
  fr: 'Habitants',
  it: 'Abitanti',
  en: 'Inhabitants',
}

/** The statistics written by this script. `ages` = [first, last] age in years (inclusive). */
export const STATS = [
  {
    id: 'pop',
    name: {
      de: 'Anzahl Einwohner/-innen am Jahresende',
      fr: "Nombre d'habitants à la fin de l'année",
      it: "Numero di abitanti alla fine dell'anno",
      en: 'Number of inhabitants at the end of the year',
    },
  },
  {
    id: 'pop_0_19',
    ages: [0, 19],
    name: {
      de: 'Einwohner/-innen im Alter von 0–19 Jahren',
      fr: 'Habitants âgés de 0 à 19 ans',
      it: 'Abitanti di età compresa tra 0 e 19 anni',
      en: 'Inhabitants aged 0–19',
    },
  },
  {
    id: 'pop_20_64',
    ages: [20, 64],
    name: {
      de: 'Einwohner/-innen im Alter von 20–64 Jahren',
      fr: 'Habitants âgés de 20 à 64 ans',
      it: 'Abitanti di età compresa tra 20 e 64 anni',
      en: 'Inhabitants aged 20–64',
    },
  },
  {
    id: 'pop_65plus',
    ages: [65, Infinity],
    name: {
      de: 'Einwohner/-innen ab 65 Jahren',
      fr: 'Habitants de 65 ans et plus',
      it: 'Abitanti di 65 anni e più',
      en: 'Inhabitants aged 65 and over',
    },
  },
  {
    id: 'pop_foreign',
    nationality: 'Ausland',
    name: {
      de: 'Ausländische Einwohner/-innen',
      fr: 'Habitants de nationalité étrangère',
      it: 'Abitanti di nazionalità straniera',
      en: 'Foreign inhabitants',
    },
  },
]

/** `......0261 Zürich` -> { id: '261', name: 'Zürich' } (BFS municipality number without leading zeros). */
export function parseMunicipality(label) {
  const match = /^\.{2,}(\d{4})\s+(.+)$/.exec(label)
  return match ? { id: String(Number.parseInt(match[1], 10)), name: match[2].trim() } : null
}

/** Age label -> years, e.g. `5 Jahre` -> 5, `1 Jahr` -> 1, `100 Jahre und mehr` -> 100; the total -> null. */
export function parseAge(label) {
  const match = /^(\d+)\s+Jahr/.exec(label)
  return match ? Number.parseInt(match[1], 10) : null
}

/** Canton rows (`- Zürich`) in the official order 1..26 = the canton ids used by public/data/cantons.csv. */
export function parseCantons(labels) {
  return labels
    .filter((label) => label.startsWith('- '))
    .map((label, index) => ({ id: String(index + 1), name: label.slice(2).trim(), label }))
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
  const pxFile = args.px ? path.resolve(args.px) : path.join(ROOT, 'data', 'px-x-0102010000_101.px')
  if (args.px) {
    if (!fs.existsSync(pxFile)) throw new Error(`${pxFile} does not exist`)
  } else {
    await download(PX_URL, pxFile, { force: args.force })
  }

  const buffer = fs.readFileSync(pxFile)
  const header = parsePxHeader(buffer)
  const dimension = (name) => header.dimensions.find((d) => d.name === name)
  for (const name of Object.values(DIM)) {
    if (!dimension(name)) throw new Error(`Unexpected px layout: dimension "${name}" missing`)
  }

  const years = dimension(DIM.year).values.filter((year) => Number(year) >= args.firstYear)
  const regionLabels = dimension(DIM.region).values
  const municipalities = regionLabels
    .map((label) => ({ label, ...parseMunicipality(label) }))
    .filter((m) => m.id)
  const cantons = parseCantons(regionLabels)
  if (cantons.length !== 26) throw new Error(`Expected 26 cantons, found ${cantons.length}`)
  console.log(
    `${years.length} years (${years[0]}-${years.at(-1)}), ${municipalities.length} municipalities, ${cantons.length} cantons`,
  )

  const fixed = { [DIM.type]: PERMANENT, [DIM.sex]: SEX_TOTAL }

  // value(statId) -> (year, regionLabel) -> number | NaN
  const lookups = new Map()
  const totalCube = readCube(buffer, header, {
    pinned: { ...fixed, [DIM.nationality]: NATIONALITY_TOTAL, [DIM.age]: AGE_TOTAL },
    select: { [DIM.year]: years },
  })
  lookups.set(
    'pop',
    (year, region) => totalCube.data[totalCube.offset({ [DIM.year]: year, [DIM.region]: region })],
  )

  const foreignCube = readCube(buffer, header, {
    pinned: { ...fixed, [DIM.nationality]: 'Ausland', [DIM.age]: AGE_TOTAL },
    select: { [DIM.year]: years },
  })
  lookups.set(
    'pop_foreign',
    (year, region) =>
      foreignCube.data[foreignCube.offset({ [DIM.year]: year, [DIM.region]: region })],
  )

  const ageLabels = dimension(DIM.age).values.filter((label) => parseAge(label) !== null)
  const ageCube = readCube(buffer, header, {
    pinned: { ...fixed, [DIM.nationality]: NATIONALITY_TOTAL },
    select: { [DIM.year]: years, [DIM.age]: ageLabels },
  })
  for (const stat of STATS.filter((s) => s.ages)) {
    const [from, to] = stat.ages
    const labels = ageLabels.filter((label) => {
      const age = parseAge(label)
      return age >= from && age <= to
    })
    lookups.set(stat.id, (year, region) => {
      let sum = 0
      for (const label of labels) {
        const value =
          ageCube.data[ageCube.offset({ [DIM.year]: year, [DIM.region]: region, [DIM.age]: label })]
        if (Number.isNaN(value)) return Number.NaN
        sum += value
      }
      return sum
    })
  }

  // Consistency: the age groups must add up to the total everywhere
  for (const year of [years[0], years.at(-1)]) {
    for (const m of municipalities.slice(0, 50)) {
      const sum = ['pop_0_19', 'pop_20_64', 'pop_65plus'].reduce(
        (s, id) => s + lookups.get(id)(year, m.label),
        0,
      )
      if (sum !== lookups.get('pop')(year, m.label)) {
        throw new Error(`Age groups do not add up to the total for ${m.name} ${year}`)
      }
    }
  }

  const stats = readStats()
  const summary = []
  let after = 'pop' // new statistics are inserted in the order of STATS, starting after `pop`

  for (const def of STATS) {
    const lookup = lookups.get(def.id)
    const byLevel = { gdn: new Map(), ktn: new Map() }
    for (const year of years) {
      for (const [level, regions] of [
        ['gdn', municipalities],
        ['ktn', cantons],
      ]) {
        const rows = regions
          .map((region) => ({
            id: region.id,
            name: region.name,
            value: lookup(year, region.label),
          }))
          .filter((row) => !Number.isNaN(row.value))
        byLevel[level].set(year, rows)
        if (year === years.at(-1)) summary.push(`${def.id} ${level} ${year}: ${rows.length} rows`)
      }
    }
    const data = writeStatFiles(def.id, byLevel, { dry: args.dry })
    registerStat(stats, { ...def, unit: UNIT, source: SOURCE }, data, { after, date: args.date })
    after = def.id
  }

  summary.forEach((line) => console.log(line))
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
