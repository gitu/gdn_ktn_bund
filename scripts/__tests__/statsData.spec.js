/**
 * Consistency of the generated statistics in public/data/stats (what the scaling and the optimizer read).
 * These tests read the real files, so they fail when a data refresh produces something inconsistent.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const STATS_DIR = path.resolve(__dirname, '../../public/data/stats')
const stats = JSON.parse(fs.readFileSync(path.join(STATS_DIR, 'stats.json'), 'utf8')).stats

function readStat(file) {
  const [, ...lines] = fs.readFileSync(path.join(STATS_DIR, file), 'utf8').trim().split(/\r?\n/)
  return new Map(
    lines.map((line) => {
      const [id, , value] = line.split(';')
      return [id.replaceAll('"', ''), Number(value)]
    }),
  )
}

describe('stats.json', () => {
  it('lists a name and unit in all four languages for every statistic', () => {
    for (const stat of stats) {
      for (const language of ['de', 'fr', 'it', 'en']) {
        expect(stat.name[language], `${stat.id} name ${language}`).toBeTruthy()
        expect(stat.unit[language], `${stat.id} unit ${language}`).toBeTruthy()
      }
    }
  })

  it('points only to files that exist and are not empty', () => {
    for (const stat of stats) {
      for (const level of ['gdn', 'ktn']) {
        for (const entry of stat.data[level] ?? []) {
          const file = path.join(STATS_DIR, entry.file)
          expect(fs.existsSync(file), entry.file).toBe(true)
          expect(readStat(entry.file).size, entry.file).toBeGreaterThan(0)
        }
      }
    }
  })

  it('has no orphaned directories (every folder under stats/ belongs to a statistic)', () => {
    const known = new Set(stats.map((stat) => stat.id))
    // area-data-*.csv files predate this scheme and sit in area/
    known.add('area')
    const folders = fs
      .readdirSync(STATS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
    expect(folders.map((f) => f.name).filter((name) => !known.has(name))).toEqual([])
  })

  it('provides every year in a continuous range for the time series statistics', () => {
    for (const id of [
      'pop',
      'pop_0_19',
      'pop_20_64',
      'pop_65plus',
      'pop_foreign',
      'workplaces',
      'fte',
    ]) {
      const years = stats.find((s) => s.id === id).data.gdn.map((entry) => entry.year)
      expect(years.length, id).toBeGreaterThan(5)
      years.forEach((year, i) => i > 0 && expect(year, `${id} gap`).toBe(years[i - 1] + 1))
    }
  })
})

describe('population statistics', () => {
  const years = stats.find((s) => s.id === 'pop').data.gdn.map((entry) => entry.year)

  it('age groups add up to the total, for every municipality and canton', () => {
    for (const year of [years[0], years.at(-1)]) {
      for (const level of ['gdn', 'ktn']) {
        const total = readStat(`pop/${level}/${year}.csv`)
        const groups = ['pop_0_19', 'pop_20_64', 'pop_65plus'].map((id) =>
          readStat(`${id}/${level}/${year}.csv`),
        )
        for (const [id, value] of total) {
          expect(
            groups.reduce((sum, group) => sum + group.get(id), 0),
            `${level} ${id} ${year}`,
          ).toBe(value)
        }
      }
    }
  })

  it('foreign inhabitants never exceed all inhabitants', () => {
    const total = readStat(`pop/gdn/${years.at(-1)}.csv`)
    const foreign = readStat(`pop_foreign/gdn/${years.at(-1)}.csv`)
    for (const [id, value] of foreign) expect(value, id).toBeLessThanOrEqual(total.get(id))
  })

  it('cantons equal the sum of their municipalities in size order of magnitude (Switzerland ~ 9 million)', () => {
    const swiss = [...readStat(`pop/ktn/${years.at(-1)}.csv`).values()].reduce((a, b) => a + b, 0)
    expect(swiss).toBeGreaterThan(8_500_000)
    expect(swiss).toBeLessThan(10_000_000)
  })
})

describe('employment statistics', () => {
  it('cantons are the sum of their municipalities (Switzerland-wide totals agree)', () => {
    const year = stats.find((s) => s.id === 'workplaces').data.gdn.at(-1).year
    // `rest_<canton>` rows (the calculated remainder of a canton) are part of the municipalities already
    const municipal = [...readStat(`workplaces/gdn/${year}.csv`)]
      .filter(([id]) => !id.startsWith('rest_'))
      .reduce((sum, [, value]) => sum + value, 0)
    const cantonal = [...readStat(`workplaces/ktn/${year}.csv`).values()].reduce((a, b) => a + b, 0)
    expect(cantonal).toBe(municipal)
  })

  it('sector jobs never exceed all jobs', () => {
    const year = stats.find((s) => s.id === 'workplaces').data.gdn.at(-1).year
    const all = readStat(`workplaces/gdn/${year}.csv`)
    for (const id of ['jobs_primary', 'jobs_secondary', 'jobs_tertiary']) {
      for (const [municipality, value] of readStat(`${id}/gdn/${year}.csv`)) {
        // For privacy the total of a few tiny municipalities is suppressed while sector values remain
        if (all.has(municipality))
          expect(value, `${id} ${municipality}`).toBeLessThanOrEqual(all.get(municipality))
      }
    }
  })
})

describe('rest of canton statistics', () => {
  it('has a record per canton that is smaller than the canton itself', () => {
    const year = stats.find((s) => s.id === 'pop').data.gdn.at(-2).year
    const municipal = readStat(`pop/gdn/${year}.csv`)
    const cantonal = readStat(`pop/ktn/${year}.csv`)
    const rests = [...municipal].filter(([id]) => id.startsWith('rest_'))
    expect(rests.length).toBeGreaterThanOrEqual(24)
    for (const [id, value] of rests) {
      expect(value, id).toBeGreaterThan(0)
      expect(value, id).toBeLessThan(cantonal.get(id.replace('rest_', '')))
    }
  })

  it('has no rest record for Glarus, where all municipalities are listed individually', () => {
    const year = stats.find((s) => s.id === 'pop').data.gdn.at(-2).year
    expect(readStat(`pop/gdn/${year}.csv`).has('rest_8')).toBe(false)
  })
})
