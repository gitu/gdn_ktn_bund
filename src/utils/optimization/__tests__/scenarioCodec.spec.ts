import { describe, it, expect } from 'vitest'
import { createConstellation } from '../constellation'
import {
  MAX_SCENARIOS,
  decodeScenarios,
  encodeScenarios,
  isDefaultScenarioSet,
} from '../scenarioCodec'

const codes = ['gdn/fs/010261:2024', 'gdn/fs/010230:2024', 'std/fs/gdn_zh:2024']

describe('scenario URL codec', () => {
  it('round-trips every field', () => {
    const a = createConstellation({
      name: 'Städte & Kantone «A»',
      entities: [codes[0], codes[2]],
      accounts: { kind: 'children', parents: ['3', '4'] },
      factors: ['pop', 'workplaces'],
      includeIntercept: true,
      mode: 'robust',
      ridge: 0.05,
      selection: { enabled: false, maxFactors: 2 },
    })
    const b = createConstellation({ accounts: { kind: 'codes', input: '400+401,46' }, mode: 'ols' })
    const decoded = decodeScenarios(encodeScenarios([a, b]), codes)
    expect(decoded).not.toBeNull()
    expect(decoded![0]).toMatchObject({
      name: a.name,
      entities: a.entities,
      accounts: a.accounts,
      factors: a.factors,
      includeIntercept: true,
      mode: 'robust',
      ridge: 0.05,
      selection: { enabled: false, maxFactors: 2 },
    })
    expect(decoded![1]).toMatchObject({
      entities: null,
      factors: null,
      accounts: b.accounts,
      mode: 'ols',
    })
  })

  it('is URL safe and compact', () => {
    const s = createConstellation({
      entities: [codes[0], codes[1], codes[2]],
      factors: ['pop', 'workplaces', 'total_area'],
    })
    const text = encodeScenarios([s])
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(text.length).toBeLessThan(200)
    // three scenarios stay far below typical URL limits
    expect(encodeScenarios([s, s, s]).length).toBeLessThan(600)
  })

  it('drops entities that are not in the table any more', () => {
    const a = createConstellation({ entities: [codes[0], 'gdn/fs/999999:2024'] })
    expect(decodeScenarios(encodeScenarios([a]), codes)![0].entities).toEqual([codes[0]])
  })

  it('rejects garbage, other versions and tampered payloads without throwing', () => {
    expect(decodeScenarios('', codes)).toBeNull()
    expect(decodeScenarios('%%%not-base64%%%', codes)).toBeNull()
    expect(decodeScenarios(btoa('{"a":1}'), codes)).toBeNull()
    expect(decodeScenarios(btoa(JSON.stringify([2, ['x']])), codes)).toBeNull()
    expect(
      decodeScenarios(btoa(JSON.stringify([1, ['x', null, 'zz:1', null, 0, 3, 0]])), codes),
    ).toBeNull()
    expect(
      decodeScenarios(btoa(JSON.stringify([1, ['x', null, 'c:36', null, 0]])), codes),
    ).toBeNull()
  })

  it('clamps out-of-range numbers and ignores more than the maximum number of scenarios', () => {
    const payload = btoa(JSON.stringify([1, ['x', null, 'c:36', null, 0, 99, 99]]))
    const decoded = decodeScenarios(payload, codes)!
    expect(decoded[0].selection.maxFactors).toBe(6)
    expect(decoded[0].ridge).toBe(10)
    const many = Array.from({ length: 12 }, () => createConstellation())
    expect(decodeScenarios(encodeScenarios(many), codes)).toHaveLength(MAX_SCENARIOS)
  })

  it('knows when there is nothing worth putting into the URL', () => {
    expect(isDefaultScenarioSet([createConstellation()])).toBe(true)
    expect(isDefaultScenarioSet([createConstellation({ mode: 'ols' })])).toBe(false)
    expect(isDefaultScenarioSet([createConstellation(), createConstellation()])).toBe(false)
    expect(isDefaultScenarioSet([createConstellation({ name: 'x' })])).toBe(false)
  })
})
