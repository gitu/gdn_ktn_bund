/**
 * Figures the charts read from the loaded financial data: one value per account and column, with the
 * column's scaling applied (francs per inhabitant etc.), plus a few derived key figures and the
 * composition of expenses and revenue.
 *
 * Account codes follow the Swiss public accounting model (HRM2): 1 assets, 2 liabilities,
 * 3 expenses, 4 revenue, with two-digit groups below (30 personnel, 40 taxes, …).
 */
import type {
  FinancialData,
  FinancialDataEntity,
  FinancialDataNode,
} from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'
import { placeKeyOf, yearOf } from '@/utils/ComparisonSelection'

/** Pseudo account: revenue minus expenses (the income statement total). */
export const RESULT_CODE = 'result'
/** Pseudo account: liabilities minus financial assets (HRM2 net debt I). */
export const NET_DEBT_CODE = 'netdebt'

export interface ChartColumn {
  /** Dataset id, e.g. `gdn/fs/010261:2024` */
  id: string
  /** The column without its year, e.g. `gdn/fs/010261` */
  placeKey: string
  year: string
  entity: FinancialDataEntity
}

/** The loaded columns in table order. */
export function chartColumns(data: FinancialData | null | undefined): ChartColumn[] {
  if (!data) return []
  const columns: ChartColumn[] = []
  for (const [id, entity] of data.entities) {
    const placeKey = placeKeyOf(id)
    const year = yearOf(id)
    if (placeKey && year) columns.push({ id, placeKey, year, entity })
  }
  return columns
}

export function findAccount(data: FinancialData, code: string): FinancialDataNode | undefined {
  if (code === RESULT_CODE) return data.incomeStatement
  const search = (node: FinancialDataNode): FinancialDataNode | undefined => {
    if (node.code === code) return node
    for (const child of node.children) {
      const found = search(child)
      if (found) return found
    }
    return undefined
  }
  // Codes starting with 1/2 are balance sheet accounts, 3/4 income statement accounts
  const tree =
    code.startsWith('1') || code.startsWith('2') ? data.balanceSheet : data.incomeStatement
  return search(tree)
}

/** Divide by the column's divisor when it is scaled, as the table does. */
export function applyScaling(value: number, entity: FinancialDataEntity | undefined): number {
  if (entity?.scalingFactor === undefined) return value
  if (entity.scalingMode === 'divide') {
    return entity.scalingFactor === 0 ? NaN : value / entity.scalingFactor
  }
  return value * entity.scalingFactor
}

/** Value of an account for one column (scaled); undefined when the column has no such value. */
export function accountValue(
  data: FinancialData,
  code: string,
  columnId: string,
): number | undefined {
  const entity = data.entities.get(columnId)
  if (code === NET_DEBT_CODE) {
    const liabilities = findAccount(data, '20')?.values.get(columnId)?.value
    const financialAssets = findAccount(data, '10')?.values.get(columnId)?.value
    if (liabilities === undefined || financialAssets === undefined) return undefined
    return applyScaling(liabilities - financialAssets, entity)
  }
  const value = findAccount(data, code)?.values.get(columnId)?.value
  return value === undefined ? undefined : applyScaling(value, entity)
}

/** The key figures offered in the charts, in the order they are listed. */
export const KEY_FIGURES = [
  { key: 'revenue', code: '4' },
  { key: 'expenses', code: '3' },
  { key: 'result', code: RESULT_CODE },
  { key: 'netDebt', code: NET_DEBT_CODE },
] as const

export type KeyFigureKey = (typeof KEY_FIGURES)[number]['key']

/**
 * Groups of the expense and revenue structure. Small or rare HRM2 groups are combined so that a
 * stacked bar has at most six segments; each group keeps its colour slot whatever is selected.
 */
export interface AccountGroup {
  key: string
  codes: string[]
}

export const EXPENSE_GROUPS: AccountGroup[] = [
  { key: 'personnel', codes: ['30'] },
  { key: 'goods', codes: ['31', '32'] },
  { key: 'transfers', codes: ['36'] },
  { key: 'depreciation', codes: ['33'] },
  { key: 'financial', codes: ['34'] },
  { key: 'other', codes: ['35', '37', '38', '39'] },
]

export const REVENUE_GROUPS: AccountGroup[] = [
  { key: 'taxes', codes: ['40'] },
  { key: 'fees', codes: ['42'] },
  { key: 'transfers', codes: ['46'] },
  { key: 'financial', codes: ['44'] },
  { key: 'other', codes: ['41', '43', '45', '47', '48', '49'] },
]

export interface GroupShare {
  key: string
  value: number
  /** Part of the sum of all groups, 0-1 */
  share: number
}

/**
 * Composition of a column's expenses or revenue. Negative group values (corrections) count as zero,
 * so the shares stay between 0 and 1. Empty when the column has none of the groups.
 */
export function groupShares(
  data: FinancialData,
  groups: AccountGroup[],
  columnId: string,
): GroupShare[] {
  const values = groups.map((group) => ({
    key: group.key,
    value: group.codes.reduce((sum, code) => {
      const value = accountValue(data, code, columnId)
      return sum + (value !== undefined && value > 0 ? value : 0)
    }, 0),
  }))
  const total = values.reduce((sum, group) => sum + group.value, 0)
  if (!(total > 0)) return []
  return values.map((group) => ({ ...group, share: group.value / total }))
}

/** Flat list of all accounts below the four main ones, for an account picker. */
export interface AccountOption {
  code: string
  labels: MultiLanguageLabels
  depth: number
}

export function accountOptions(data: FinancialData): AccountOption[] {
  const options: AccountOption[] = []
  const walk = (node: FinancialDataNode, depth: number) => {
    // Only accounts with a value in at least one column are worth charting
    if (node.values.size > 0) options.push({ code: node.code, labels: node.labels, depth })
    node.children.forEach((child) => walk(child, depth + 1))
  }
  for (const tree of [data.incomeStatement, data.balanceSheet]) {
    // Order: revenue, expenses, assets, liabilities
    const children = [...tree.children].sort((a, b) => order(a.code) - order(b.code))
    children.forEach((child) => walk(child, 0))
  }
  return options
}

const order = (code: string) => ({ '4': 0, '3': 1, '1': 2, '2': 3 })[code] ?? 9
