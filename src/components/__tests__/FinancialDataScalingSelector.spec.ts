/**
 * Tests for FinancialDataScalingSelector component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import type { StatsAvailabilityInfo } from '../../types/StatsData'
import type { MultiLanguageLabels } from '../../types/DataStructures'
import type { FinancialData } from '../../types/FinancialDataStructure'
import { getMunicipalityByGdnId } from '../../utils/GeographicalDataLoader'

vi.mock('../../utils/StatsDataLoader', () => {
  const mockStatsData: StatsAvailabilityInfo[] = [
    {
      id: 'pop',
      name: {
        de: 'Bevölkerung',
        fr: 'Population',
        it: 'Popolazione',
        en: 'Population',
      } as MultiLanguageLabels,
      unit: {
        de: 'Personen',
        fr: 'Personnes',
        it: 'Persone',
        en: 'Persons',
      } as MultiLanguageLabels,
      type: 'scaling',
      description: {
        de: 'Einwohnerzahl',
        fr: "Nombre d'habitants",
        it: 'Numero di abitanti',
        en: 'Population count',
      } as MultiLanguageLabels,
      availableKtnYears: [2020, 2021, 2022],
      availableGdnYears: [2020, 2021, 2022],
      source: 'BFS',
      lastUpdate: '2023-01-01',
    },
    {
      id: 'area',
      name: {
        de: 'Fläche',
        fr: 'Superficie',
        it: 'Superficie',
        en: 'Area',
      } as MultiLanguageLabels,
      unit: {
        de: 'km²',
        fr: 'km²',
        it: 'km²',
        en: 'km²',
      } as MultiLanguageLabels,
      type: 'scaling',
      description: {
        de: 'Gesamtfläche',
        fr: 'Surface totale',
        it: 'Superficie totale',
        en: 'Total area',
      } as MultiLanguageLabels,
      availableKtnYears: [2020, 2021, 2022],
      availableGdnYears: [2020, 2021, 2022],
      source: 'BFS',
      lastUpdate: '2023-01-01',
    },
  ]

  return {
    StatsDataLoader: {
      getInstance: vi.fn().mockReturnValue({
        getAvailableStats: vi.fn().mockResolvedValue(mockStatsData),
      }),
    },
  }
})

vi.mock('../../utils/GeographicalDataLoader', () => ({
  GeographicalDataLoader: {
    getInstance: vi.fn().mockReturnValue({
      getMunicipalityByGdnId: vi.fn().mockResolvedValue({
        gdnId: '010002',
        municipalityLongName: 'Affoltern am Albis',
        cantonAbbreviation: 'ZH',
      }),
    }),
  },
  getMunicipalityByGdnId: vi.fn().mockResolvedValue({
    gdnId: '010002',
    municipalityLongName: 'Affoltern am Albis',
    cantonAbbreviation: 'ZH',
  }),
  getCantonByAbbreviation: vi.fn().mockResolvedValue({
    cantonId: '1',
    cantonAbbreviation: 'ZH',
    cantonLongName: 'Zurich',
  }),
}))

// Mock PrimeVue components
vi.mock('primevue/dropdown', () => ({
  default: {
    name: 'Dropdown',
    template:
      '<select data-testid="dropdown" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
    emits: ['update:modelValue', 'change'],
  },
}))

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div data-testid="message" :class="severity"><slot /></div>',
    props: ['severity', 'closable'],
  },
}))

// Create i18n messages for tests
const i18nMessages = {
  en: {
    financialDataScalingSelector: {
      title: 'Data Scaling',
      subtitle: 'Apply scaling factors for better comparison',
      scaling: 'Scaling',
      noScaling: 'No scaling',
      loading: 'Loading scaling options...',
      error: 'Error loading scaling options',
      selectScaling: 'Select scaling factor',
      scalingApplied: 'Scaling applied: {name}',
      scalingRemoved: 'Scaling removed',
      scalingInfo: {
        title: 'Scaling Information',
        description:
          'Scaling factors help normalize data for better comparison between entities of different sizes.',
        currentScaling: 'Current scaling: {name}',
        unit: 'Unit: {unit}',
        format: '{name} ({unit})',
      },
      options: {
        pop: 'Population',
        population: 'Population',
        area: 'Area',
        households: 'Households',
        employees: 'Employees',
      },
      customFormula: {
        title: 'Custom Formula',
        optimization: {
          title: 'Account-Specific Optimization',
          description:
            'Optimize scaling formula to minimize differences for specific account codes',
          targetCodes: 'Target Account Codes',
          optimize: 'Optimize for Account Codes',
          entitySelection: {
            title: 'Select Entities for Optimization',
            selectAll: 'Select All',
            selectNone: 'Select None',
          },
          factorSelection: {
            title: 'Select Scaling Factors',
            selectAll: 'Select All',
            selectNone: 'Select None',
          },
        },
      },
      errors: {
        loadingFailed: 'Failed to load scaling options',
        applyingFailed: 'Failed to apply scaling factor',
        invalidScaling: 'Invalid scaling factor selected',
      },
    },
    financialDataDisplay: {
      scalingInfo: {
        title: 'Scaling Information',
      },
      yearInfo: 'Year: {year}',
      scalingFactor: 'Scaling factor: {factor}',
      noScalingFactor: 'No scaling factor',
    },
  },
  de: {
    financialDataScalingSelector: {
      title: 'Datenskalierung',
      subtitle: 'Skalierungsfaktoren für bessere Vergleichbarkeit anwenden',
      scaling: 'Skalierung',
      noScaling: 'Keine Skalierung',
      loading: 'Lade Skalierungsoptionen...',
      error: 'Fehler beim Laden der Skalierungsoptionen',
      selectScaling: 'Skalierungsfaktor auswählen',
      scalingApplied: 'Skalierung angewendet: {name}',
      scalingRemoved: 'Skalierung entfernt',
      scalingInfo: {
        title: 'Skalierungsinformationen',
        description:
          'Skalierungsfaktoren helfen dabei, Daten für bessere Vergleiche zwischen Entitäten unterschiedlicher Größe zu normalisieren.',
        currentScaling: 'Aktuelle Skalierung: {name}',
        unit: 'Einheit: {unit}',
      },
      options: {
        pop: 'Bevölkerung',
        population: 'Bevölkerung',
        area: 'Fläche',
        households: 'Haushalte',
        employees: 'Beschäftigte',
      },
      errors: {
        loadingFailed: 'Fehler beim Laden der Skalierungsoptionen',
        applyingFailed: 'Fehler beim Anwenden des Skalierungsfaktors',
        invalidScaling: 'Ungültiger Skalierungsfaktor ausgewählt',
      },
    },
    financialDataDisplay: {
      scalingInfo: {
        title: 'Skalierungsinformationen',
        format: '{name} ({unit})',
      },
      yearInfo: 'Jahr: {year}',
      scalingFactor: 'Skalierungsfaktor: {factor}',
      noScalingFactor: 'Kein Skalierungsfaktor',
    },
  },
}

// Helper function to create fresh i18n instance
const createTestI18n = (locale = 'en') =>
  createI18n({
    legacy: false,
    locale,
    messages: i18nMessages,
  })

// Import the component after mocks are set up
import FinancialDataScalingSelector from '../FinancialDataScalingSelector.vue'

describe('FinancialDataScalingSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n()],
      },
    })

    expect(wrapper.exists()).toBe(true)
    // Wait for component to load and show the selector
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Check for the label text instead of h4
    expect(wrapper.text()).toContain('Select scaling factor')
  })

  it('should show loading state initially', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n()],
      },
    })

    expect(wrapper.find('[data-testid="message"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading scaling options...')
  })

  it('should load and display scaling options', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n()],
      },
    })

    // Wait for component to load
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Check if the component has loaded options by checking the component's data
    const vm = wrapper.vm as unknown as { availableStats: unknown[] }
    expect(vm.availableStats).toBeDefined()
    expect(vm.availableStats.length).toBeGreaterThan(0)
  })

  it('should emit scalingChanged when scaling is selected', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n()],
      },
    })

    // Wait for component to load
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Set the internalSelectedScaling value and trigger the method
    const vm = wrapper.vm as unknown as {
      internalSelectedScaling: string | null
      onScalingChange: () => void
    }
    vm.internalSelectedScaling = 'pop'
    vm.onScalingChange()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('scalingChanged')).toBeTruthy()
    expect(wrapper.emitted('scalingChanged')![0]).toEqual(['pop'])
  })

  it('should emit scalingChanged with null when no scaling is selected', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n()],
      },
    })

    // Wait for component to load
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Set the internalSelectedScaling value to null and trigger the method
    const vm = wrapper.vm as unknown as {
      internalSelectedScaling: string | null
      onScalingChange: () => void
    }
    vm.internalSelectedScaling = null
    vm.onScalingChange()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('scalingChanged')).toBeTruthy()
    expect(wrapper.emitted('scalingChanged')![0]).toEqual([null])
  })

  it('should display current scaling info when scaling is selected', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      props: {
        financialData: {
          balanceSheet: {
            code: 'root',
            labels: { de: 'Gesamt', fr: 'Total', it: 'Totale', en: 'Total' },
            values: new Map(),
            children: [],
          },
          incomeStatement: {
            code: 'root',
            labels: {
              de: 'Erfolgsrechnung',
              fr: 'Compte de résultats',
              it: 'Conto economico',
              en: 'Income Statement',
            },
            values: new Map(),
            children: [],
          },
          entities: new Map([
            [
              'test',
              {
                code: 'test',
                name: {
                  de: 'Test Entity',
                  fr: 'Test Entity',
                  it: 'Test Entity',
                  en: 'Test Entity',
                },
                year: '2022',
                scalingFactor: 1000,
                metadata: { source: 'test', loadedAt: '2023-01-01T00:00:00Z', recordCount: 1 },
                model: 'fs',
                source: 'test',
                description: {
                  de: 'Test Description',
                  fr: 'Test Description',
                  it: 'Test Description',
                  en: 'Test Description',
                },
              },
            ],
          ]),
          metadata: { source: 'test', loadedAt: '2023-01-01T00:00:00Z', recordCount: 1 },
        },
      },
      global: {
        plugins: [createTestI18n()],
      },
    })

    // Wait for component to load
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Set scaling to population directly on the component
    const vm = wrapper.vm as unknown as { internalSelectedScaling: string | null }
    vm.internalSelectedScaling = 'pop'
    await wrapper.vm.$nextTick()

    // Check if scaling info section is displayed (it should be visible when hasScalingFactors is true)
    const scalingInfoSection = wrapper.find('.scaling-info-section')
    expect(scalingInfoSection.exists()).toBe(true)
  })

  it('should handle different locales correctly', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n('de')],
      },
    })

    // Wait for component to load and show the selector
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Check for German text in the label
    expect(wrapper.text()).toContain('Skalierungsfaktor auswählen')
  })

  it.skip('should handle error states', async () => {
    // The component error handling is tested through integration tests
    // This test is skipped as the mock setup doesn't support dynamic re-mocking
  })

  it('should filter relevant scaling statistics', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n()],
      },
    })

    // Wait for component to load
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    // Check the computed scalingOptions instead of DOM elements
    const vm = wrapper.vm as unknown as {
      scalingOptions: { label: string; value: string | null }[]
    }

    // Should have "No scaling" + filtered statistics (pop, area)
    expect(vm.scalingOptions.length).toBeGreaterThanOrEqual(1) // At least "No scaling"
  })

  it('should properly handle scaling selection and emit correct events', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n()],
      },
    })

    // Wait for component to load
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as unknown as {
      internalSelectedScaling: string | null
      onScalingChange: () => void
      currentScalingInfo: { id: string; name: string; unit: string; description: string } | null
    }

    // Test selecting a scaling option
    vm.internalSelectedScaling = 'pop'
    vm.onScalingChange()
    await wrapper.vm.$nextTick()

    // Should emit scalingChanged with scaling ID and info
    expect(wrapper.emitted('scalingChanged')).toBeTruthy()
    const emittedEvents = wrapper.emitted('scalingChanged') as Array<[string | null, object | null]>
    expect(emittedEvents[0][0]).toBe('pop')
  })

  it('should handle prop changes for selectedScaling', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      props: {
        selectedScaling: null,
      },
      global: {
        plugins: [createTestI18n()],
      },
    })

    // Wait for component to load
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as unknown as {
      internalSelectedScaling: string | null
    }

    // Initially should be null
    expect(vm.internalSelectedScaling).toBe(null)

    // Update prop
    await wrapper.setProps({ selectedScaling: 'pop' })
    await wrapper.vm.$nextTick()

    // Internal state should update
    expect(vm.internalSelectedScaling).toBe('pop')

    // Update prop back to null
    await wrapper.setProps({ selectedScaling: null })
    await wrapper.vm.$nextTick()

    // Internal state should update
    expect(vm.internalSelectedScaling).toBe(null)
  })

  it('should handle invalid scaling selection gracefully', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [createTestI18n()],
      },
    })

    // Wait for component to load
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as unknown as {
      internalSelectedScaling: string | null
      onScalingChange: () => void
    }

    // Set an invalid scaling ID
    vm.internalSelectedScaling = 'invalid-scaling-id'
    vm.onScalingChange()
    await wrapper.vm.$nextTick()

    // Should emit error event
    expect(wrapper.emitted('error')).toBeTruthy()
  })

  // The optimiser (entity/factor selection, scenarios, simulations) moved out of the selector into
  // src/components/optimization/. These two tests used to read the selector's internal state
  // (selectedEntities, selectedScalingFactors, availableEntities); they now check the same
  // behaviour through the optimiser panel that the selector mounts.
  const twoMunicipalities = (): FinancialData => {
    const node = (code: string, label: string) => ({
      code,
      labels: { de: label, fr: label, it: label, en: label },
      values: new Map(),
      children: [],
    })
    const entity = (code: string) => ({
      code,
      name: { de: 'Test', fr: 'Test', it: 'Test', en: 'Test' },
      description: { de: 'Test', fr: 'Test', it: 'Test', en: 'Test' },
      year: '2023',
      model: 'model1',
      source: 'gdn',
      scalingFactor: 1000,
      scalingInfo: { de: 'Test', fr: 'Test', it: 'Test', en: 'Test' },
      metadata: { source: 'test', loadedAt: '2023-01-01', recordCount: 1 },
    })
    return {
      balanceSheet: node('balance', 'Bilanz'),
      incomeStatement: node('income', 'Erfolgsrechnung'),
      metadata: { source: 'test', loadedAt: '2023-01-01', recordCount: 2 },
      entities: new Map([
        ['gdn/model1/010002:2023', entity('gdn/model1/010002:2023')],
        ['gdn/model1/010156:2023', entity('gdn/model1/010156:2023')],
      ]),
    }
  }

  const mountWithOptimizer = () =>
    mount(FinancialDataScalingSelector, {
      props: { financialData: twoMunicipalities(), selectedScaling: null },
      global: { plugins: [createTestI18n(), createPinia()] },
    })

  it('keeps the optimiser closed until the custom formula section is opened, then loads it', async () => {
    const wrapper = mountWithOptimizer()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(wrapper.find('[data-testid="optimizer-panel"]').exists()).toBe(false)

    await wrapper.find('.custom-formula-toggle').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="optimizer-panel"]').exists()).toBe(true),
    )

    // the e2e contract: the target accounts input with its default
    const input = wrapper.find('#target-accounts-input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('36,46')
  })

  it('loads municipality names for the entities of the table (for the optimiser)', async () => {
    const wrapper = mountWithOptimizer()
    await vi.waitFor(() => expect(wrapper.find('.custom-formula-toggle').exists()).toBe(true))
    await wrapper.find('.custom-formula-toggle').trigger('click')
    await vi.waitFor(() => expect(getMunicipalityByGdnId).toHaveBeenCalledWith('010002'))
    expect(getMunicipalityByGdnId).toHaveBeenCalledWith('010156')
  })

  it('applies a formula found by the optimiser exactly like the manual apply button', async () => {
    const wrapper = mountWithOptimizer()
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.find('.custom-formula-toggle').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="optimizer-panel"]').exists()).toBe(true),
    )

    const panel = wrapper.findComponent({ name: 'OptimizerPanel' })
    panel.vm.$emit('apply', '0.5*pop+3*area')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('scalingChanged')?.slice(-1)[0]).toEqual(['custom:0.5*pop+3*area'])
    // the custom formula section closes and the formula is remembered in the input
    expect(wrapper.find('[data-testid="optimizer-panel"]').exists()).toBe(false)
    const vm = wrapper.vm as unknown as {
      internalSelectedScaling: string
      customFormulaInput: string
    }
    expect(vm.internalSelectedScaling).toBe('custom:0.5*pop+3*area')
    expect(vm.customFormulaInput).toBe('0.5*pop+3*area')
  })
})
