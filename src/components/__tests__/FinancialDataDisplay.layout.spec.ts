/**
 * FinancialDataDisplay: phone layout, toolbar, comparison hint and loading skeleton.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import FinancialDataDisplay from '../FinancialDataDisplay.vue'
import type {
  FinancialData,
  FinancialDataEntity,
  FinancialDataNode,
} from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'

const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      common: { clear: 'Löschen' },
      financialDataDisplay: {
        title: 'Finanzdaten-Anzeige',
        loading: 'Lade Finanzdaten...',
        noData: 'Keine Finanzdaten verfügbar',
        expandAll: 'Alle erweitern',
        collapseAll: 'Alle einklappen',
        showCodes: 'Codes anzeigen',
        codesShown: 'Codes angezeigt',
        freezeFirstColumn: 'Erste Spalte fixieren',
        firstColumnFreezed: 'Erste Spalte fixiert',
        clickToSelectBase: 'Basisspalte zum Vergleichen auswählen',
        clickToCompareWith: 'Mit ausgewählter Spalte vergleichen',
        controls: { title: 'Anzeigeoptionen' },
        columns: { account: 'Konto' },
        accessibility: { financialValue: 'Finanzieller Wert für {entity}', noValue: 'Kein Wert' },
        errors: { invalidData: 'x', noEntities: 'y', processingError: 'z' },
      },
    },
  },
})

const labels = (text: string): MultiLanguageLabels => ({
  de: `${text} (DE)`,
  fr: `${text} (FR)`,
  it: `${text} (IT)`,
  en: `${text} (EN)`,
})

const node = (
  code: string,
  label: string,
  children: FinancialDataNode[] = [],
): FinancialDataNode => ({
  code,
  labels: labels(label),
  values: new Map([
    ['entity1', { value: 1000, unit: 'CHF' }],
    ['entity2', { value: 2000, unit: 'CHF' }],
  ]),
  children,
})

const entity = (code: string, name: string): FinancialDataEntity => ({
  code,
  name: labels(name),
  metadata: { source: 'test', loadedAt: '2023-01-01T00:00:00Z', recordCount: 1 },
  year: '2023',
  model: 'fs',
  source: 'test',
  description: labels(name),
})

const createData = (): FinancialData => ({
  balanceSheet: node('root', 'Total', [
    node('1', 'Assets', [node('10', 'Current')]),
    node('2', 'L'),
  ]),
  incomeStatement: node('root', 'Income', [node('3', 'Expenses'), node('4', 'Revenue')]),
  entities: new Map([
    ['entity1', entity('entity1', 'Entity One')],
    ['entity2', entity('entity2', 'Entity Two')],
  ]),
  metadata: { source: 'test', loadedAt: '2023-01-01T00:00:00Z', recordCount: 1 },
})

/** Controllable `window.matchMedia` (jsdom has none). */
const mockMatchMedia = (initiallyMatches: boolean) => {
  type Listener = (event: { matches: boolean }) => void
  const listeners = new Set<Listener>()
  const query = {
    matches: initiallyMatches,
    media: '',
    addEventListener: vi.fn((_type: string, listener: Listener) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: Listener) => listeners.delete(listener)),
  }
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => query),
  })
  return {
    query,
    listenerCount: () => listeners.size,
    setMatches(matches: boolean) {
      query.matches = matches
      listeners.forEach((listener) => listener({ matches }))
    },
  }
}

interface Vm {
  freezeFirstColumn: boolean
  onFreezeFirstColumnToggle: (value: boolean) => void
  handleColumnClick: (entityCode: string) => void
  expandedKeys: Record<string, boolean>
  selectedColumn: string | null
}

const mountDisplay = (props: Record<string, unknown> = {}) =>
  mount(FinancialDataDisplay, {
    global: { plugins: [i18n] },
    props: { financialData: createData(), ...props },
  })

describe('FinancialDataDisplay layout', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'de'
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia')
  })

  describe('frozen first column default', () => {
    it('is not frozen on desktop', () => {
      mockMatchMedia(false)
      const wrapper = mountDisplay()
      expect((wrapper.vm as unknown as Vm).freezeFirstColumn).toBe(false)
    })

    it('is frozen by default on phones', () => {
      mockMatchMedia(true)
      const wrapper = mountDisplay()
      expect((wrapper.vm as unknown as Vm).freezeFirstColumn).toBe(true)
    })

    it('still honours initialFreezeFirstColumn on desktop', () => {
      mockMatchMedia(false)
      const wrapper = mountDisplay({ initialFreezeFirstColumn: true })
      expect((wrapper.vm as unknown as Vm).freezeFirstColumn).toBe(true)
    })

    it('works where matchMedia does not exist (desktop default)', () => {
      const wrapper = mountDisplay()
      expect((wrapper.vm as unknown as Vm).freezeFirstColumn).toBe(false)
    })

    it('follows the viewport as long as the user has not chosen', async () => {
      const media = mockMatchMedia(false)
      const wrapper = mountDisplay()
      const vm = wrapper.vm as unknown as Vm

      media.setMatches(true)
      await wrapper.vm.$nextTick()
      expect(vm.freezeFirstColumn).toBe(true)

      media.setMatches(false)
      await wrapper.vm.$nextTick()
      expect(vm.freezeFirstColumn).toBe(false)
    })

    it('keeps the explicit choice of the user when the viewport changes', async () => {
      const media = mockMatchMedia(true)
      const wrapper = mountDisplay()
      const vm = wrapper.vm as unknown as Vm
      expect(vm.freezeFirstColumn).toBe(true)

      vm.onFreezeFirstColumnToggle(false)
      media.setMatches(false)
      await wrapper.vm.$nextTick()
      media.setMatches(true)
      await wrapper.vm.$nextTick()

      expect(vm.freezeFirstColumn).toBe(false)
    })

    it('releases the media query listener on unmount', () => {
      const media = mockMatchMedia(true)
      const wrapper = mountDisplay()
      expect(media.listenerCount()).toBe(1)
      wrapper.unmount()
      expect(media.listenerCount()).toBe(0)
    })

    it('disables column resizing on phones (a header tap must not start a resize)', () => {
      mockMatchMedia(true)
      const phone = mountDisplay()
      expect(phone.findComponent({ name: 'TreeTable' }).props('resizableColumns')).toBe(false)

      mockMatchMedia(false)
      const desktop = mountDisplay()
      expect(desktop.findComponent({ name: 'TreeTable' }).props('resizableColumns')).toBe(true)
    })
  })

  describe('toolbar', () => {
    it('is a single toolbar with four labelled controls and no footer duplicate', () => {
      mockMatchMedia(true)
      const wrapper = mountDisplay()

      const toolbars = wrapper.findAll('[role="toolbar"]')
      expect(toolbars).toHaveLength(1)
      expect(toolbars[0].attributes('aria-label')).toBe('Anzeigeoptionen')

      const controls = toolbars[0].findAll('.toolbar-btn')
      expect(controls).toHaveLength(4)
      const names = controls.map((control) => control.attributes('aria-label'))
      expect(names).toEqual([
        'Erste Spalte fixiert', // frozen by default on phones
        'Codes anzeigen',
        'Alle erweitern',
        'Alle einklappen',
      ])

      // Expand/collapse used to be repeated in a footer: now exactly one of each
      expect(wrapper.findAll('button[aria-label="Alle erweitern"]')).toHaveLength(1)
      expect(wrapper.findAll('button[aria-label="Alle einklappen"]')).toHaveLength(1)
    })

    it('expands and collapses all rows from the toolbar', async () => {
      const wrapper = mountDisplay()
      const vm = wrapper.vm as unknown as Vm

      await wrapper.find('button[aria-label="Alle erweitern"]').trigger('click')
      expect(Object.keys(vm.expandedKeys).length).toBeGreaterThan(0)

      await wrapper.find('button[aria-label="Alle einklappen"]').trigger('click')
      expect(Object.keys(vm.expandedKeys)).toHaveLength(0)
    })

    it('toggles the codes via the toolbar button', async () => {
      const wrapper = mountDisplay()
      const toggle = wrapper.find('button[aria-label="Codes anzeigen"]')
      expect(toggle.attributes('aria-pressed')).toBe('false')

      await toggle.trigger('click')

      const pressed = wrapper.find('button[aria-label="Codes angezeigt"]')
      expect(pressed.exists()).toBe(true)
      expect(pressed.attributes('aria-pressed')).toBe('true')
    })
  })

  describe('comparison hint', () => {
    it('is visible without any interaction', () => {
      const wrapper = mountDisplay()
      const hint = wrapper.find('[data-testid="compare-hint"]')
      expect(hint.exists()).toBe(true)
      expect(hint.text()).toContain('Basisspalte zum Vergleichen auswählen')
      expect(hint.classes()).not.toContain('is-active')
      expect(hint.attributes('aria-live')).toBe('polite')
    })

    it('names the selected base column and explains the next step', async () => {
      const wrapper = mountDisplay()
      const vm = wrapper.vm as unknown as Vm

      vm.handleColumnClick('entity1')
      await wrapper.vm.$nextTick()

      const hint = wrapper.find('[data-testid="compare-hint"]')
      expect(hint.classes()).toContain('is-active')
      expect(hint.text()).toContain('Entity One (DE) 2023')
      expect(hint.text()).toContain('Mit ausgewählter Spalte vergleichen')
      expect(hint.text()).not.toContain('Basisspalte zum Vergleichen auswählen')
    })

    it('lets the user cancel the selection from the hint', async () => {
      const wrapper = mountDisplay()
      const vm = wrapper.vm as unknown as Vm
      vm.handleColumnClick('entity1')
      await wrapper.vm.$nextTick()

      await wrapper
        .find('[data-testid="compare-hint"] button[aria-label="Löschen"]')
        .trigger('click')

      expect(vm.selectedColumn).toBeNull()
      expect(wrapper.find('[data-testid="compare-hint"]').classes()).not.toContain('is-active')
    })
  })

  describe('real PrimeVue table', () => {
    const mountReal = () =>
      mount(FinancialDataDisplay, {
        global: { plugins: [i18n], stubs: { TreeTable: false, Column: false } },
        props: { financialData: createData() },
        attachTo: document.body,
      })

    it('renders column headers as keyboard-operable buttons that select a base column', async () => {
      const wrapper = mountReal()
      const headers = wrapper.findAll('.entity-header')
      expect(headers).toHaveLength(2)
      expect(headers[0].attributes('role')).toBe('button')
      expect(headers[0].attributes('tabindex')).toBe('0')
      expect(headers[0].attributes('aria-pressed')).toBe('false')

      await headers[0].trigger('keydown.enter')
      expect(wrapper.findAll('.entity-header')[0].attributes('aria-pressed')).toBe('true')
      expect(wrapper.find('.column-selected').exists()).toBe(true)

      // a second activation on another column creates the comparison
      await wrapper.findAll('.entity-header')[1].trigger('keydown.space')
      expect(wrapper.find('.column-has-comparisons').exists()).toBe(true)
      expect(wrapper.emitted('comparisonChanged')).toBeTruthy()
      wrapper.unmount()
    })

    it('keeps the value cells accessible and right-aligned via the value-column class', () => {
      const wrapper = mountReal()
      const cell = wrapper.find('[aria-label="Finanzieller Wert für Entity One (DE)"]')
      expect(cell.exists()).toBe(true)
      expect(cell.classes()).toContain('financial-value')
      expect(wrapper.find('td.value-column').exists()).toBe(true)
      expect(wrapper.find('th.value-column').exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('loading state', () => {
    it('shows skeleton rows but keeps role=status and the accessible label', () => {
      const wrapper = mountDisplay({ loading: true, financialData: null })

      const status = wrapper.find('.loading-message')
      expect(status.attributes('role')).toBe('status')
      expect(status.attributes('aria-label')).toBe('Lade Finanzdaten...')
      expect(status.text()).toContain('Lade Finanzdaten...')
      expect(status.findAll('.p-skeleton').length).toBeGreaterThanOrEqual(8)
      // the skeleton itself is decoration
      expect(status.find('.skeleton-table').attributes('aria-hidden')).toBe('true')
      // no spinner text-only message any more
      expect(status.find('.pi-spinner').exists()).toBe(false)
    })
  })
})
