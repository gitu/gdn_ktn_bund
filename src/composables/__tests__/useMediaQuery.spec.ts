import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { PHONE_QUERY, useMediaQuery } from '../useMediaQuery'

type Listener = (event: MediaQueryListEvent) => void

function mockMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>()
  const list = {
    matches: initial,
    addEventListener: (_: string, fn: Listener) => listeners.add(fn),
    removeEventListener: (_: string, fn: Listener) => listeners.delete(fn),
  }
  window.matchMedia = vi.fn().mockReturnValue(list)
  return {
    listeners,
    emit(matches: boolean) {
      list.matches = matches
      listeners.forEach((fn) => fn({ matches } as MediaQueryListEvent))
    },
  }
}

const Probe = defineComponent({
  setup() {
    const phone = useMediaQuery(PHONE_QUERY)
    return () => h('span', { 'data-phone': String(phone.value) })
  },
})

describe('useMediaQuery', () => {
  const original = window.matchMedia

  afterEach(() => {
    window.matchMedia = original
  })

  it('is false where matchMedia is unavailable (jsdom, SSR)', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia
    expect(mount(Probe).attributes('data-phone')).toBe('false')
  })

  it('reads the current value on first render and follows changes', async () => {
    const media = mockMatchMedia(true)
    const wrapper = mount(Probe)
    expect(wrapper.attributes('data-phone')).toBe('true')

    media.emit(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('data-phone')).toBe('false')
  })

  it('stops listening when the component is unmounted', () => {
    const media = mockMatchMedia(false)
    const wrapper = mount(Probe)
    expect(media.listeners.size).toBe(1)
    wrapper.unmount()
    expect(media.listeners.size).toBe(0)
  })
})
