/**
 * Account codes: parsing the text input, resolving presets ("all expense accounts") against the
 * loaded tree and extracting the amount per entity.
 */

import type { FinancialData, FinancialDataNode } from '@/types/FinancialDataStructure'
import type { FitAccount } from './types'

/**
 * Which accounts a scenario fits.
 *  - codes:    comma separated codes, each one optionally a "+" sum ("400+401,46")
 *  - children: every direct child of the given parent codes, e.g. parents ["3"] = 30..38 (Aufwand),
 *              ["4"] = 40..48 (Ertrag), ["3","4"] = all main account classes
 */
export type AccountSpec = { kind: 'codes'; input: string } | { kind: 'children'; parents: string[] }

// The two English messages below are matched by e2e/account-code-combinations.spec.ts in every UI
// language, so they are deliberately not translated.
const invalidMessage = (groups: string[]) =>
  `Invalid account codes: ${groups.join(', ')}. Use numeric codes only, optionally combined with + (e.g., 400+401).`
export const EMPTY_CODES_MESSAGE = 'Please enter at least one account code.'

const splitGroup = (group: string) =>
  group
    .split('+')
    .map((code) => code.trim())
    .filter((code) => code)

export interface AccountCodeInput {
  /** Valid account groups ("400+401", "46"), in input order, without duplicates. */
  groups: string[]
  /** null when the input is valid or empty. */
  error: string | null
}

/** Validate and split the "36,46,400+401" text input. */
export function parseAccountCodeInput(input: string): AccountCodeInput {
  const trimmed = input.trim()
  if (!trimmed) return { groups: [], error: null }
  const rawGroups = trimmed
    .split(',')
    .map((g) => g.trim())
    .filter((g) => g)
  if (rawGroups.length === 0) return { groups: [], error: EMPTY_CODES_MESSAGE }
  const invalid: string[] = []
  const groups: string[] = []
  for (const group of rawGroups) {
    const codes = splitGroup(group)
    if (codes.length === 0 || codes.some((c) => !/^\d+$/.test(c))) {
      invalid.push(group)
    } else {
      const normalised = codes.join('+')
      if (!groups.includes(normalised)) groups.push(normalised)
    }
  }
  return invalid.length > 0
    ? { groups: [], error: invalidMessage(invalid) }
    : { groups, error: null }
}

/** code -> node over both statements (income statement wins when a code exists in both). */
export function buildAccountIndex(data: FinancialData): Map<string, FinancialDataNode> {
  const index = new Map<string, FinancialDataNode>()
  const walk = (node: FinancialDataNode) => {
    if (!index.has(node.code)) index.set(node.code, node)
    for (const child of node.children) walk(child)
  }
  if (data.incomeStatement) walk(data.incomeStatement)
  if (data.balanceSheet) walk(data.balanceSheet)
  return index
}

/** Account groups of a spec, resolved against the loaded tree. */
export function resolveAccountSpec(
  spec: AccountSpec,
  index: Map<string, FinancialDataNode>,
): { groups: string[]; error: string | null } {
  if (spec.kind === 'codes') {
    return parseAccountCodeInput(spec.input)
  }
  const groups: string[] = []
  for (const parent of spec.parents) {
    for (const child of index.get(parent)?.children ?? []) {
      if (!groups.includes(child.code)) groups.push(child.code)
    }
  }
  return { groups, error: null }
}

export interface ExtractedAccounts {
  accounts: FitAccount[]
  /** Codes that exist in neither tree, or have no value for any of the entities. */
  unknownCodes: string[]
}

/** Sum the codes of every group per entity (an entity needs a value for at least one code). */
export function extractAccounts(
  index: Map<string, FinancialDataNode>,
  groups: string[],
  entityCodes: string[],
): ExtractedAccounts {
  const accounts: FitAccount[] = []
  const unknown = new Set<string>()
  for (const group of groups) {
    const codes = splitGroup(group)
    const values = new Map<string, number>()
    for (const code of codes) {
      const node = index.get(code)
      let found = false
      for (const entity of entityCodes) {
        const v = node?.values.get(entity)?.value
        if (typeof v === 'number' && Number.isFinite(v)) {
          values.set(entity, (values.get(entity) ?? 0) + v)
          found = true
        }
      }
      if (!found) unknown.add(code)
    }
    if (values.size > 0) accounts.push({ id: group, values })
  }
  return { accounts, unknownCodes: [...unknown] }
}

/** Label of a single account code in the given locale (the code itself for "+" sums). */
export function accountLabel(
  index: Map<string, FinancialDataNode>,
  group: string,
  locale: 'de' | 'fr' | 'it' | 'en',
): string {
  const codes = splitGroup(group)
  if (codes.length !== 1) return group
  const node = index.get(codes[0])
  const label = node?.labels?.[locale] || node?.labels?.de
  return label ? `${group} ${label}` : group
}
