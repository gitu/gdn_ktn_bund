import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import {
  EXCLUDED_ACCOUNTS,
  MIN_MATERIAL_SHARE,
  aggregateMunicipalRows,
  aggregateStandardRows,
  balanceSheetIsPlausible,
  bfsNumber,
  computeRest,
  restIsMaterial,
  toStandardCsv,
} from '../buildRestOfCantons.js'

const row = (dim, arten, value, funk = '') => ({ dim, arten, funk, value: String(value) })

describe('aggregating accounts', () => {
  it('uses the 3-digit row of a canton aggregate and ignores its finer sub-accounts', () => {
    const total = aggregateStandardRows([
      row('ertrag', '421', 100),
      row('ertrag', '4210', 60),
      row('ertrag', '4211', 40),
    ])
    expect(total.get('ertrag|421')).toBe(100)
  })

  it('rolls 4-digit accounts up where the 3-digit row is missing (taxes are listed that way)', () => {
    const total = aggregateStandardRows([
      row('ertrag', '4000', 70),
      row('ertrag', '4001', 30),
      row('ertrag', '40000', 70),
    ])
    expect(total.get('ertrag|400')).toBe(100)
  })

  it('reads only balance sheet, expenses and revenue, and skips rows with a function', () => {
    const total = aggregateStandardRows([
      row('vermoegen', '100', 5),
      row('aufwand', '300', 5, '01'),
      row('bilanz', '100', 7),
    ])
    expect([...total.keys()]).toEqual(['bilanz|100'])
  })

  it('sums a municipality over all functions', () => {
    const sums = aggregateMunicipalRows([
      row('aufwand', '300', 10, '01'),
      row('aufwand', '300', 5, '02'),
      row('aufwand', '301', 2, '01'),
    ])
    expect(sums.get('aufwand|300')).toBe(15)
    expect(sums.get('aufwand|301')).toBe(2)
  })

  it('ignores non-numeric values', () => {
    expect(aggregateMunicipalRows([row('bilanz', '100', '')]).size).toBe(0)
  })
})

describe('computeRest', () => {
  const total = new Map([
    ['bilanz|100', 1000],
    ['aufwand|300', 500],
    ['aufwand|362', 900],
    ['ertrag|461', 50],
  ])

  it('subtracts the listed municipalities per account', () => {
    const listed = new Map([['bilanz|100', 600]])
    expect(computeRest(total, listed).rows).toContainEqual({
      dim: 'bilanz',
      arten: '100',
      value: 400,
    })
  })

  it('never derives transfers between municipalities, however the numbers look', () => {
    const { rows, dropped } = computeRest(total, new Map([['aufwand|362', 100]]))
    expect(rows.map((r) => r.arten)).not.toContain('362')
    expect(rows.map((r) => r.arten)).not.toContain('461')
    expect(
      dropped
        .filter((d) => d.reason === 'transfer')
        .map((d) => d.arten)
        .sort(),
    ).toEqual(['362', '461'])
    expect([...EXCLUDED_ACCOUNTS].sort()).toEqual(['361', '362', '363', '461', '462', '463'])
  })

  it('drops an account whose remainder would be negative instead of inventing a value', () => {
    const { rows, dropped } = computeRest(
      new Map([['aufwand|300', 100]]),
      new Map([['aufwand|300', 130]]),
    )
    expect(rows).toEqual([])
    expect(dropped).toEqual([{ dim: 'aufwand', arten: '300', reason: 'negative' }])
  })

  it('treats a difference within rounding noise as zero', () => {
    const { rows } = computeRest(new Map([['bilanz|100', 100]]), new Map([['bilanz|100', 100.5]]))
    expect(rows).toEqual([{ dim: 'bilanz', arten: '100', value: 0 }])
  })

  it('keeps natural credit balances (account negative in both sources)', () => {
    const { rows } = computeRest(new Map([['aufwand|380', -50]]), new Map([['aufwand|380', -30]]))
    expect(rows).toEqual([{ dim: 'aufwand', arten: '380', value: -20 }])
  })

  it('handles accounts that only one side has and skips empty ones', () => {
    const { rows, dropped } = computeRest(
      new Map([
        ['bilanz|100', 10],
        ['bilanz|101', 0],
      ]),
      new Map([['bilanz|102', 4]]),
    )
    expect(rows).toEqual([{ dim: 'bilanz', arten: '100', value: 10 }])
    expect(dropped).toEqual([{ dim: 'bilanz', arten: '102', reason: 'negative' }])
  })

  it('orders rows balance sheet, expenses, revenue and by account', () => {
    const { rows } = computeRest(
      new Map([
        ['ertrag|421', 1],
        ['bilanz|200', 1],
        ['aufwand|300', 1],
        ['bilanz|100', 1],
      ]),
      new Map(),
    )
    expect(rows.map((r) => `${r.dim}|${r.arten}`)).toEqual([
      'bilanz|100',
      'bilanz|200',
      'aufwand|300',
      'ertrag|421',
    ])
  })
})

describe('plausibility gates', () => {
  const total = new Map([
    ['bilanz|100', 1000],
    ['bilanz|200', 1000],
  ])

  it('accepts a remainder smaller than the canton', () => {
    expect(
      balanceSheetIsPlausible(
        [
          { dim: 'bilanz', arten: '100', value: 300 },
          { dim: 'bilanz', arten: '200', value: 300 },
        ],
        total,
      ),
    ).toBe(true)
  })

  it('rejects a remainder larger than the canton or below zero', () => {
    expect(balanceSheetIsPlausible([{ dim: 'bilanz', arten: '100', value: 1500 }], total)).toBe(
      false,
    )
    expect(balanceSheetIsPlausible([{ dim: 'bilanz', arten: '100', value: -500 }], total)).toBe(
      false,
    )
  })

  it('offers no dataset where the remainder is noise (Glarus: all municipalities are listed)', () => {
    expect(
      restIsMaterial([{ dim: 'bilanz', arten: '100', value: 3 }], new Map([['bilanz|100', 580]])),
    ).toBe(false)
    expect(
      restIsMaterial(
        [{ dim: 'bilanz', arten: '100', value: 580 * MIN_MATERIAL_SHARE }],
        new Map([['bilanz|100', 580]]),
      ),
    ).toBe(true)
  })
})

describe('output', () => {
  it('writes the same CSV layout as the other standard files', () => {
    expect(toStandardCsv([{ dim: 'bilanz', arten: '100', value: 12.5 }], '2024')).toBe(
      '"arten","funk","jahr","value","dim","unit"\n"100","","2024","12.50","bilanz","CHF"\n',
    )
  })

  it('maps an EFV municipality code to the BFS number the statistics use', () => {
    expect(bfsNumber('010261')).toBe('261')
    expect(bfsNumber('194141')).toBe('4141')
  })
})

// ---- the generated data -------------------------------------------------------------------------------------
const DATA = path.resolve(__dirname, '../../public/data')
const readCsv = (file, delimiter = ',') =>
  Papa.parse(fs.readFileSync(file, 'utf8'), { header: true, delimiter, skipEmptyLines: true }).data
const restDirs = fs.readdirSync(path.join(DATA, 'std', 'fs')).filter((d) => d.endsWith('_rest'))

describe('generated rest-of-canton data', () => {
  it('exists for 25 cantons (not Glarus, where every municipality is listed)', () => {
    expect(restDirs).toHaveLength(25)
    expect(restDirs).not.toContain('gdn_gl_rest')
  })

  it('never contains the inter-municipal transfer accounts', () => {
    for (const dir of restDirs.slice(0, 5)) {
      const years = fs.readdirSync(path.join(DATA, 'std', 'fs', dir))
      const arten = new Set(
        readCsv(path.join(DATA, 'std', 'fs', dir, years[0])).map((r) => r.arten),
      )
      for (const account of EXCLUDED_ACCOUNTS)
        expect(arten.has(account), `${dir} ${account}`).toBe(false)
    }
  })

  it('adds up: rest + listed municipalities = canton aggregate, for the balance sheet (Zürich 2022)', () => {
    const total = aggregateStandardRows(readCsv(path.join(DATA, 'std', 'fs', 'gdn_zh', '2022.csv')))
    const rest = readCsv(path.join(DATA, 'std', 'fs', 'gdn_zh_rest', '2022.csv')).filter(
      (r) => r.dim === 'bilanz',
    )
    const listed = new Map()
    for (const id of fs
      .readdirSync(path.join(DATA, 'gdn', 'fs'))
      .filter((d) => d.startsWith('01'))) {
      const file = path.join(DATA, 'gdn', 'fs', id, '2022.csv')
      if (!fs.existsSync(file)) continue
      for (const [k, v] of aggregateMunicipalRows(readCsv(file)))
        listed.set(k, (listed.get(k) ?? 0) + v)
    }
    expect(rest.length).toBeGreaterThan(10)
    for (const r of rest) {
      const k = `bilanz|${r.arten}`
      expect(Number(r.value) + (listed.get(k) ?? 0), k).toBeCloseTo(total.get(k) ?? 0, 0)
    }
  })

  it('has a matching population record rest_<cantonId> that adds up with the listed municipalities', () => {
    const readStat = (file) =>
      new Map(readCsv(path.join(DATA, 'stats', file), ';').map((r) => [r.GEO_ID, Number(r.VALUE)]))
    const municipal = readStat('pop/gdn/2022.csv')
    const cantonal = readStat('pop/ktn/2022.csv')
    const listedPopulation = fs
      .readdirSync(path.join(DATA, 'gdn', 'fs'))
      .filter(
        (d) => d.startsWith('01') && fs.existsSync(path.join(DATA, 'gdn', 'fs', d, '2022.csv')),
      )
      .reduce((sum, d) => sum + municipal.get(bfsNumber(d)), 0)
    expect(municipal.get('rest_1')).toBe(cantonal.get('1') - listedPopulation)
    expect(municipal.get('rest_1')).toBeGreaterThan(0)
  })

  it('is part of the catalogue with a name that says it is calculated', () => {
    const catalog = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../src/data/available-data.json'), 'utf8'),
    )
    const entry = catalog.find((e) => e.entityCode === 'gdn_zh_rest')
    expect(entry.displayName.de).toBe('Übrige Gemeinden ZH (berechnet)')
    expect(entry.availableYears).toContain('2024')
  })
})
