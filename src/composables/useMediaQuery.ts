import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Phones: keep in sync with the 767px breakpoint in assets/layout/_bottomnav.scss. */
export const PHONE_QUERY = '(max-width: 767px)'

/**
 * Reactive `window.matchMedia`. Reads the current value synchronously (no layout flash on first
 * render) and stays false where matchMedia does not exist (jsdom, SSR).
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(typeof window !== 'undefined' && window.matchMedia?.(query).matches === true)
  let list: MediaQueryList | undefined

  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }

  onMounted(() => {
    list = window.matchMedia?.(query)
    if (list) {
      matches.value = list.matches
      list.addEventListener('change', onChange)
    }
  })

  onBeforeUnmount(() => list?.removeEventListener('change', onChange))

  return matches
}
