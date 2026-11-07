import { describe, expect, it } from 'vitest'
import {
  parseAge,
  parseCantons,
  parseMunicipality as parseStatpopMunicipality,
  STATS as STATPOP,
} from '../convertPxToStats.js'
import {
  parseMunicipality as parseStatentMunicipality,
  STATS as STATENT,
} from '../convertStatent.js'
import { parseRoadsCsv } from '../convertRoads.js'
import { sumToCantons, toCsv } from '../statsCommon.js'

describe('STATPOP labels', () => {
  it('turns municipality labels into BFS numbers without leading zeros', () => {
    expect(parseStatpopMunicipality('......0261 Zürich')).toEqual({ id: '261', name: 'Zürich' })
    expect(parseStatpopMunicipality('......6812 Basse-Vendline')).toEqual({
      id: '6812',
      name: 'Basse-Vendline',
    })
  })

  it('ignores totals, cantons, districts and the "Ohne Angabe" row', () => {
    for (const label of ['Schweiz', '- Zürich', '>> Bezirk Affoltern', 'Ohne Angabe']) {
      expect(parseStatpopMunicipality(label)).toBeNull()
    }
  })

  it('numbers cantons in order of appearance (the ids of public/data/cantons.csv)', () => {
    const cantons = parseCantons([
      'Schweiz',
      '- Zürich',
      '>> Bezirk X',
      '......0001 A',
      '- Bern / Berne',
      '- Luzern',
    ])
    expect(cantons.map((c) => [c.id, c.name])).toEqual([
      ['1', 'Zürich'],
      ['2', 'Bern / Berne'],
      ['3', 'Luzern'],
    ])
  })

  it('reads ages from the singular, plural and open-ended labels', () => {
    expect(parseAge('0 Jahre')).toBe(0)
    expect(parseAge('1 Jahr')).toBe(1)
    expect(parseAge('64 Jahre')).toBe(64)
    expect(parseAge('100 Jahre und mehr')).toBe(100)
    expect(parseAge('Alter - Total')).toBeNull()
  })

  it('defines the age groups so that they tile 0..100+ without gaps or overlap', () => {
    const groups = STATPOP.filter((stat) => stat.ages).map((stat) => stat.ages)
    expect(groups).toEqual([
      [0, 19],
      [20, 64],
      [65, Infinity],
    ])
  })
})

describe('STATENT', () => {
  it('parses municipality labels and skips the Switzerland row', () => {
    expect(parseStatentMunicipality('261 Zürich')).toEqual({ id: '261', name: 'Zürich' })
    expect(parseStatentMunicipality('Schweiz')).toBeNull()
  })

  it('has unique statistic ids and a name and unit in all four languages', () => {
    const ids = STATENT.map((stat) => stat.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const stat of STATENT) {
      for (const language of ['de', 'fr', 'it', 'en']) {
        expect(stat.name[language], `${stat.id} name ${language}`).toBeTruthy()
        expect(stat.unitLabels[language], `${stat.id} unit ${language}`).toBeTruthy()
      }
    }
  })
})

describe('roads CSV', () => {
  it('parses a BOM-prefixed file', () => {
    const text =
      '﻿"REF_YEAR","GEO_COMM","GEO_CANT","VALUE"\n"2025","1","ZH","26.5"\n"2025","0261","ZH","861.2"\n'
    expect(parseRoadsCsv(text)).toEqual([
      { year: '2025', id: '1', canton: 'ZH', value: 26.5 },
      { year: '2025', id: '261', canton: 'ZH', value: 861.2 },
    ])
  })

  it('rejects a file with a different layout', () => {
    expect(() => parseRoadsCsv('"A","B"\n1,2\n')).toThrow(/column REF_YEAR missing/)
  })
})

describe('shared helpers', () => {
  it('writes the GEO_ID;GEO_NAME;VALUE layout and escapes quotes in names', () => {
    expect(toCsv([{ id: '1', name: 'Aeugst "am" Albis', value: 1998 }])).toBe(
      '"GEO_ID";"GEO_NAME";VALUE\n"1";"Aeugst ""am"" Albis";1998\n',
    )
  })

  it('sums municipalities to cantons and reports municipalities without a canton', () => {
    const cantons = [
      { id: '1', name: 'Zürich' },
      { id: '2', name: 'Bern' },
    ]
    const map = new Map([
      ['1', '1'],
      ['2', '1'],
      ['301', '2'],
    ])
    const result = sumToCantons(
      [
        { id: '1', name: 'a', value: 10 },
        { id: '2', name: 'b', value: 5 },
        { id: '301', name: 'c', value: 7 },
        { id: '99999', name: 'ghost', value: 1 },
      ],
      map,
      cantons,
    )
    expect(result.rows.map((r) => r.value)).toEqual([15, 7])
    expect(result.unknown.map((r) => r.id)).toEqual(['99999'])
  })
})
