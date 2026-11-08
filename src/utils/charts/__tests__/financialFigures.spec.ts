import { describe, expect, it } from 'vitest'
import {
  EXPENSE_GROUPS,
  NET_DEBT_CODE,
  RESULT_CODE,
  accountOptions,
  accountValue,
  chartColumns,
  findAccount,
  groupShares,
} from '../financialFigures'
import { linearScale } from '../scale'
import type {
  FinancialData,
  FinancialDataEntity,
  FinancialDataNode,
} from '@/types/FinancialDataStructure'

const labels = (text: string) => ({ de: text, fr: text, it: text, en: text })
const CITY = 'gdn/fs/010261:2024'
const CANTON = 'std/fs/ktn_zh:2024'

function node(code: string, values: Record<string, number>, children: FinancialDataNode[] = []) {
  return {
    code,
    labels: labels(`Konto ${code}`),
    values: new Map(Object.entries(values).map(([id, value]) => [id, { value, unit: 'CHF' }])),
    children,
  }
}

function entity(code: string, scalingFactor?: number): FinancialDataEntity {
  return {
    code,
    name: labels(code),
    description: labels(code),
    metadata: { source: 'test', loadedAt: '', recordCount: 0 },
    year: '2024',
    model: 'fs',
    source: code.split('/')[0],
    scalingFactor,
    scalingMode: scalingFactor ? 'divide' : undefined,
  }
}

// Sums as the DataLoader writes them: every node holds the total of its children
const data: FinancialData = {
  balanceSheet: node('root', { [CITY]: 0 }, [
    node('1', { [CITY]: 900 }, [node('10', { [CITY]: 400 }), node('14', { [CITY]: 500 })]),
    node('2', { [CITY]: 900 }, [node('20', { [CITY]: 700 }), node('29', { [CITY]: 200 })]),
  ]),
  incomeStatement: node('root', { [CITY]: 50, [CANTON]: -20 }, [
    node('3', { [CITY]: 950, [CANTON]: 120 }, [
      node('30', { [CITY]: 300, [CANTON]: 60 }),
      node('31', { [CITY]: 150, [CANTON]: 60 }),
      node('36', { [CITY]: 500 }),
      node('38', { [CITY]: -10 }),
    ]),
    node('4', { [CITY]: 1000, [CANTON]: 100 }, [node('40', { [CITY]: 1000, [CANTON]: 100 })]),
  ]),
  entities: new Map([
    [CITY, entity(CITY, 10)],
    [CANTON, entity(CANTON)],
  ]),
  metadata: { source: 'test', loadedAt: '', recordCount: 0 },
}

describe('financial figures for the charts', () => {
  it('lists the columns with place and year', () => {
    expect(chartColumns(data).map((c) => [c.placeKey, c.year])).toEqual([
      ['gdn/fs/010261', '2024'],
      ['std/fs/ktn_zh', '2024'],
    ])
    expect(chartColumns(null)).toEqual([])
  })

  it('finds accounts in the right statement', () => {
    expect(findAccount(data, '20')?.labels.de).toBe('Konto 20')
    expect(findAccount(data, '36')?.labels.de).toBe('Konto 36')
    expect(findAccount(data, RESULT_CODE)).toBe(data.incomeStatement)
    expect(findAccount(data, '99')).toBeUndefined()
  })

  it('applies the scaling of each column, as the table does', () => {
    // The city is shown per 10 inhabitants here, the canton in francs
    expect(accountValue(data, '4', CITY)).toBe(100)
    expect(accountValue(data, '4', CANTON)).toBe(100)
    expect(accountValue(data, RESULT_CODE, CANTON)).toBe(-20)
    expect(accountValue(data, '36', CANTON)).toBeUndefined()
  })

  it('calculates the net debt as liabilities minus financial assets', () => {
    expect(accountValue(data, NET_DEBT_CODE, CITY)).toBe(30)
    expect(accountValue(data, NET_DEBT_CODE, CANTON)).toBeUndefined()
  })

  it('splits the expenses into groups that add up to one, ignoring negative corrections', () => {
    const shares = groupShares(data, EXPENSE_GROUPS, CITY)
    expect(shares.map((s) => s.key)).toEqual(EXPENSE_GROUPS.map((g) => g.key))
    expect(shares.find((s) => s.key === 'transfers')?.share).toBeCloseTo(500 / 950)
    expect(shares.find((s) => s.key === 'other')?.value).toBe(0)
    expect(shares.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1)
    expect(groupShares(data, EXPENSE_GROUPS, 'missing')).toEqual([])
  })

  it('offers revenue and expense accounts first in the account picker', () => {
    expect(accountOptions(data).map((o) => `${o.depth}:${o.code}`)).toEqual([
      '0:4',
      '1:40',
      '0:3',
      '1:30',
      '1:31',
      '1:36',
      '1:38',
      '0:1',
      '1:10',
      '1:14',
      '0:2',
      '1:20',
      '1:29',
    ])
  })
})

describe('scales and formats', () => {
  it('builds round ticks that include zero', () => {
    expect(linearScale([120, 870]).ticks).toEqual([0, 250, 500, 750, 1000])
    const mixed = linearScale([-35, 80])
    expect(mixed.ticks[0]).toBeLessThanOrEqual(-35)
    expect(mixed.ticks).toContain(0)
    expect(mixed.position(0)).toBeGreaterThan(0)
    expect(linearScale([]).ticks).toEqual([0, 0.25, 0.5, 0.75, 1])
  })
})
