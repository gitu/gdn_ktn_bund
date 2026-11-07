import { describe, it, expect } from 'vitest'
import {
  EMPTY_CODES_MESSAGE,
  accountLabel,
  buildAccountIndex,
  extractAccounts,
  parseAccountCodeInput,
  resolveAccountSpec,
} from '../accountTargets'
import { financialDataFrom } from './testData'

const codes = ['gdn/fs/1:2024', 'gdn/fs/2:2024', 'gdn/fs/3:2024']
const data = financialDataFrom(codes, {
  '30': [10, 20, 30],
  '31': [1, 2, undefined],
  '36': [5, 6, 7],
  '40': [100, 200, 300],
  '46': [50, undefined, 70],
})

describe('parseAccountCodeInput', () => {
  it('splits commas and keeps "+" sums', () => {
    expect(parseAccountCodeInput('36, 400+401 ,46').groups).toEqual(['36', '400+401', '46'])
    expect(parseAccountCodeInput(' 36 + 46 ').groups).toEqual(['36+46'])
  })

  it('removes duplicates and ignores empty parts', () => {
    expect(parseAccountCodeInput('36,,36, 46,').groups).toEqual(['36', '46'])
  })

  it('keeps the English messages the e2e suite matches, in every UI language', () => {
    const bad = parseAccountCodeInput('abc+123')
    expect(bad.error).toMatch(/Invalid account codes.*Use numeric codes only/)
    expect(bad.error).toContain('abc+123')
    expect(bad.groups).toEqual([])
    expect(parseAccountCodeInput('36+abc,46').error).toContain('36+abc')
    expect(parseAccountCodeInput(',').error).toBe(EMPTY_CODES_MESSAGE)
  })

  it('treats an empty input as "nothing yet", not as an error', () => {
    expect(parseAccountCodeInput('   ')).toEqual({ groups: [], error: null })
  })
})

describe('account tree helpers', () => {
  const index = buildAccountIndex(data)

  it('indexes every node of both statements', () => {
    expect([...index.keys()].sort()).toEqual(
      ['3', '30', '31', '36', '4', '40', '46', 'root'].sort(),
    )
  })

  it('resolves presets to the children of the given parents', () => {
    expect(resolveAccountSpec({ kind: 'children', parents: ['3'] }, index).groups).toEqual([
      '30',
      '31',
      '36',
    ])
    expect(resolveAccountSpec({ kind: 'children', parents: ['3', '4'] }, index).groups).toEqual([
      '30',
      '31',
      '36',
      '40',
      '46',
    ])
    expect(resolveAccountSpec({ kind: 'children', parents: ['9'] }, index).groups).toEqual([])
    expect(resolveAccountSpec({ kind: 'codes', input: '36,40' }, index).groups).toEqual([
      '36',
      '40',
    ])
  })

  it('sums "+" groups per entity and drops entities without any value', () => {
    const { accounts, unknownCodes } = extractAccounts(index, ['30+31', '46', '99'], codes)
    expect(unknownCodes).toEqual(['99'])
    expect(accounts.map((a) => a.id)).toEqual(['30+31', '46'])
    expect(Object.fromEntries(accounts[0].values)).toEqual({
      'gdn/fs/1:2024': 11,
      'gdn/fs/2:2024': 22,
      'gdn/fs/3:2024': 30,
    })
    expect(accounts[1].values.has('gdn/fs/2:2024')).toBe(false)
  })

  it('only looks at the requested entities', () => {
    const { accounts } = extractAccounts(index, ['36'], [codes[0]])
    expect(accounts[0].values.size).toBe(1)
  })

  it('labels a single code and leaves sums as their code', () => {
    expect(accountLabel(index, '36', 'de')).toBe('36 Konto 36')
    expect(accountLabel(index, '30+31', 'de')).toBe('30+31')
    expect(accountLabel(index, '77', 'de')).toBe('77')
  })
})
