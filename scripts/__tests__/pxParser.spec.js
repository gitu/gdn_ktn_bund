import { describe, expect, it } from 'vitest'
import { parsePxHeader, parseQuotedList, readCube } from '../pxParser.js'

/** Build a small px file: 2 years x 3 regions x 2 kinds, last dimension fastest. */
function buildPx({
  encoding = 'utf8',
  data,
  regions = ['Schweiz', '- Zürich', '......0001 Aeugst am Albis'],
}) {
  const text = [
    'CHARSET="ANSI";',
    'AXIS-VERSION="2010";',
    'TITLE="Test";',
    'STUB="Jahr","Region (......)","Art";',
    'HEADING="Messwert";',
    'VALUES("Jahr")="2023","2024";',
    `VALUES("Region (......)")=${regions.map((r) => `"${r}"`).join(',')};`,
    'VALUES("Art")="Total","Frauen";',
    'VALUES("Messwert")="Anzahl";',
    'DATA=',
  ].join('\r\n')
  const body = `\r\n${data};\r\n`
  return Buffer.concat([
    Buffer.from(text, encoding === 'latin1' ? 'latin1' : 'utf8'),
    Buffer.from(body),
  ])
}

// year 2023: Schweiz 100/55, Zürich 40/20, Aeugst 4/2   year 2024: 110/60, 44/22, "." (missing)/3
const DATA = '100 55 40 20 4 2 110 60 44 22 "." 3'

describe('parseQuotedList', () => {
  it('splits quoted values and unescapes doubled quotes', () => {
    expect(parseQuotedList('"a","b c","d ""x"""')).toEqual(['a', 'b c', 'd "x"'])
  })
})

describe('parsePxHeader', () => {
  it('lists dimensions in storage order, including names with parentheses', () => {
    const header = parsePxHeader(buildPx({ data: DATA }))
    expect(header.dimensions.map((d) => d.name)).toEqual([
      'Jahr',
      'Region (......)',
      'Art',
      'Messwert',
    ])
    expect(header.dimensions[1].values).toHaveLength(3)
  })

  it('reads UTF-8 labels', () => {
    const header = parsePxHeader(buildPx({ data: DATA }))
    expect(header.dimensions[1].values[1]).toBe('- Zürich')
  })

  it('falls back to Windows-1252 when the header is not valid UTF-8 (STATENT cubes)', () => {
    const header = parsePxHeader(buildPx({ data: DATA, encoding: 'latin1' }))
    expect(header.dimensions[1].values[1]).toBe('- Zürich')
  })

  it('rejects input without a DATA section', () => {
    expect(() => parsePxHeader(Buffer.from('TITLE="x";'))).toThrow(/DATA=/)
  })
})

describe('readCube', () => {
  const buffer = buildPx({ data: DATA })
  const header = parsePxHeader(buffer)

  it('reads one cell when everything is pinned', () => {
    const cube = readCube(buffer, header, {
      pinned: { Jahr: '2024', 'Region (......)': '- Zürich', Art: 'Frauen', Messwert: 'Anzahl' },
    })
    expect(cube.dimensions).toEqual([])
    expect([...cube.data]).toEqual([22])
  })

  it('reads a slice over the free dimensions in storage order', () => {
    const cube = readCube(buffer, header, { pinned: { Art: 'Total', Messwert: 'Anzahl' } })
    expect(cube.dimensions.map((d) => d.name)).toEqual(['Jahr', 'Region (......)'])
    expect([...cube.data].map((v) => (Number.isNaN(v) ? 'NaN' : v))).toEqual([
      100,
      40,
      4,
      110,
      44,
      'NaN',
    ])
  })

  it('maps coordinates to positions with offset()', () => {
    const cube = readCube(buffer, header, { pinned: { Art: 'Frauen', Messwert: 'Anzahl' } })
    const at = (year, region) => cube.data[cube.offset({ Jahr: year, 'Region (......)': region })]
    expect(at('2023', 'Schweiz')).toBe(55)
    expect(at('2024', '......0001 Aeugst am Albis')).toBe(3)
  })

  it('restricts a dimension with select, keeping ascending order whatever order was asked', () => {
    const cube = readCube(buffer, header, {
      pinned: { Art: 'Total', Messwert: 'Anzahl' },
      select: { Jahr: ['2024'], 'Region (......)': ['......0001 Aeugst am Albis', 'Schweiz'] },
    })
    expect(cube.dimensions[1].values).toEqual(['Schweiz', '......0001 Aeugst am Albis'])
    expect([...cube.data].map((v) => (Number.isNaN(v) ? 'NaN' : v))).toEqual([110, 'NaN'])
  })

  it('treats quoted markers as missing values', () => {
    const cube = readCube(buffer, header, {
      pinned: { Art: 'Total', Messwert: 'Anzahl', Jahr: '2024' },
    })
    expect(Number.isNaN(cube.data[2])).toBe(true)
  })

  it('complains about unknown dimensions and labels', () => {
    expect(() => readCube(buffer, header, { pinned: { Nope: 'x' } })).toThrow(/Unknown dimension/)
    expect(() => readCube(buffer, header, { pinned: { Art: 'Männer' } })).toThrow(
      /no value "Männer"/,
    )
  })

  it('fails loudly when the data section is shorter than the cube', () => {
    const truncated = buildPx({ data: '1 2 3' })
    expect(() =>
      readCube(truncated, parsePxHeader(truncated), { pinned: { Messwert: 'Anzahl' } }),
    ).toThrow(/ended early/)
  })
})
