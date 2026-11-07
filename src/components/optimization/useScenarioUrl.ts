import { onBeforeUnmount, onMounted, watch, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Constellation } from '@/utils/optimization/constellation'
import {
  SCENARIO_URL_PARAM,
  decodeScenarios,
  encodeScenarios,
  isDefaultScenarioSet,
} from '@/utils/optimization/scenarioCodec'

const WRITE_DELAY_MS = 400

/**
 * Keeps the scenario definitions in the URL (`?opt=`), next to `datasets`, `scaling` and
 * `comparisons`, so a link reproduces the exploration. Only definitions are stored, never results.
 * Writes use `router.replace` (no history entry) and are debounced; the untouched default scenario
 * leaves the URL clean.
 */
export function useScenarioUrl(options: {
  definitions: ComputedRef<Constellation[]>
  entityCodes: ComputedRef<string[]>
  /** Called with scenarios read from the URL (a shared link or a reload). */
  onImport: (scenarios: Constellation[]) => void
}) {
  const route = useRoute()
  const router = useRouter()
  let lastSeen = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  const currentParam = (): string => {
    const value = route.query[SCENARIO_URL_PARAM]
    return typeof value === 'string'
      ? value
      : Array.isArray(value) && typeof value[0] === 'string'
        ? value[0]
        : ''
  }

  const withParam = (encoded: string) => {
    const query = { ...route.query }
    if (encoded) query[SCENARIO_URL_PARAM] = encoded
    else delete query[SCENARIO_URL_PARAM]
    return query
  }

  function write() {
    timer = null
    const defs = options.definitions.value
    const encoded = isDefaultScenarioSet(defs) ? '' : encodeScenarios(defs)
    lastSeen = encoded
    if (encoded !== currentParam()) {
      void router.replace({ query: withParam(encoded) })
    }
  }

  function importFromUrl(): boolean {
    const param = currentParam()
    if (!param || param === lastSeen) return false
    const decoded = decodeScenarios(param, options.entityCodes.value)
    if (!decoded || decoded.length === 0) return false
    lastSeen = param
    options.onImport(decoded)
    return true
  }

  /** Absolute URL of the current page with the current scenarios (for "copy link"). */
  function shareUrl(): string {
    const encoded = encodeScenarios(options.definitions.value)
    const href = router.resolve({ query: withParam(encoded) }).href
    return new URL(href, window.location.origin).toString()
  }

  onMounted(() => {
    if (!importFromUrl()) write()
    watch(
      options.definitions,
      () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(write, WRITE_DELAY_MS)
      },
      { deep: true },
    )
    // A different link pasted into the running app / history navigation
    watch(
      () => currentParam(),
      (param) => {
        if (param !== lastSeen) importFromUrl()
      },
    )
  })

  onBeforeUnmount(() => {
    if (timer) {
      clearTimeout(timer)
      write()
    }
  })

  return { shareUrl, hasUrlScenarios: () => currentParam() !== '' }
}
