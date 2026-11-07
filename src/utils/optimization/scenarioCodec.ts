/**
 * Compact URL representation of scenario definitions (query parameter `opt`).
 *
 * Only the *definition* is stored, never results: they are recomputed from the loaded data, so a
 * link stays valid when statistics are refreshed. Entities are referenced by their short key
 * ("010261:2024"), account presets as "k:3,4" and free codes as "c:36,46". The payload is
 * base64url-encoded JSON (URL-safe, so the router never re-escapes it); about 80-120 characters
 * per scenario.
 */

import { createConstellation, type Constellation } from './constellation'
import { entityKey } from './scalingFactors'
import type { FitMode } from './types'

export const SCENARIO_URL_PARAM = 'opt'
export const MAX_SCENARIOS = 8
const VERSION = 1
const MODES: FitMode[] = ['ols', 'nonneg', 'robust']

type Packed = [
  name: string,
  entities: string[] | null,
  accounts: string,
  factors: string[] | null,
  flags: number,
  maxFactors: number,
  ridge: number,
]

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (text: string): string => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

function pack(c: Constellation): Packed {
  const accounts =
    c.accounts.kind === 'codes' ? `c:${c.accounts.input}` : `k:${c.accounts.parents.join(',')}`
  // flags: bit0 intercept, bit1 selection, bits2-3 fit mode
  const flags =
    (c.includeIntercept ? 1 : 0) | (c.selection.enabled ? 2 : 0) | (MODES.indexOf(c.mode) << 2)
  return [
    c.name,
    c.entities ? c.entities.map(entityKey) : null,
    accounts,
    c.factors,
    flags,
    c.selection.maxFactors,
    c.ridge,
  ]
}

/** Encode scenarios; returns '' for "nothing worth storing" (the defaults). */
export function encodeScenarios(scenarios: Constellation[]): string {
  if (scenarios.length === 0) return ''
  return toBase64Url(JSON.stringify([VERSION, ...scenarios.slice(0, MAX_SCENARIOS).map(pack)]))
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

/**
 * Decode scenarios. `knownEntityCodes` are the columns currently in the table: keys that match
 * none of them are dropped. Returns null for anything that is not a valid payload.
 */
export function decodeScenarios(
  payload: string,
  knownEntityCodes: string[],
): Constellation[] | null {
  try {
    const raw: unknown = JSON.parse(fromBase64Url(payload))
    if (!Array.isArray(raw) || raw[0] !== VERSION) return null
    const byKey = new Map<string, string[]>()
    for (const code of knownEntityCodes) {
      const key = entityKey(code)
      byKey.set(key, [...(byKey.get(key) ?? []), code])
    }
    const result: Constellation[] = []
    for (const item of raw.slice(1, MAX_SCENARIOS + 1)) {
      if (!Array.isArray(item) || item.length < 7) return null
      const [name, entities, accounts, factors, flags, maxFactors, ridge] = item as unknown[]
      if (
        typeof name !== 'string' ||
        typeof accounts !== 'string' ||
        typeof flags !== 'number' ||
        typeof maxFactors !== 'number' ||
        typeof ridge !== 'number' ||
        !(entities === null || isStringArray(entities)) ||
        !(factors === null || isStringArray(factors))
      ) {
        return null
      }
      const kind = accounts.slice(0, 2)
      const body = accounts.slice(2)
      if (kind !== 'c:' && kind !== 'k:') return null
      const mode = MODES[(flags >> 2) & 3]
      if (!mode) return null
      result.push(
        createConstellation({
          name: name.slice(0, 60),
          entities: entities === null ? null : entities.flatMap((k) => byKey.get(k) ?? []),
          accounts:
            kind === 'c:'
              ? { kind: 'codes', input: body.slice(0, 200) }
              : {
                  kind: 'children',
                  parents: body
                    .split(',')
                    .filter((p) => /^\d+$/.test(p))
                    .slice(0, 8),
                },
          factors:
            factors === null ? null : factors.filter((f) => /^[\w-]{1,40}$/.test(f)).slice(0, 40),
          includeIntercept: (flags & 1) === 1,
          mode,
          ridge: Math.max(0, Math.min(ridge, 10)),
          selection: {
            enabled: (flags & 2) === 2,
            maxFactors: Math.max(1, Math.min(Math.round(maxFactors), 6)),
          },
        }),
      )
    }
    return result
  } catch {
    return null
  }
}

/** True when the scenarios are exactly one untouched default scenario (nothing to put in a URL). */
export function isDefaultScenarioSet(scenarios: Constellation[]): boolean {
  if (scenarios.length !== 1) return false
  const c = scenarios[0]
  const d = createConstellation()
  return (
    c.name === '' &&
    c.entities === null &&
    c.factors === null &&
    c.accounts.kind === 'codes' &&
    d.accounts.kind === 'codes' &&
    c.accounts.input === d.accounts.input &&
    c.includeIntercept === d.includeIntercept &&
    c.mode === d.mode &&
    c.ridge === d.ridge &&
    c.selection.enabled === d.selection.enabled &&
    c.selection.maxFactors === d.selection.maxFactors
  )
}
