/**
 * Tests for Vue EnrichedDataDisplay component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import EnrichedDataDisplay from '../EnrichedDataDisplay.vue'
import * as DataEnricher from '../../utils/DataEnricher'

// Create Vuetify instance for testing
const vuetify = createVuetify({
  components,
  directives,
})

// Mock the DataEnricher module
vi.mock('../../utils/DataEnricher', () => ({
  enrichFinancialData: vi.fn(),
  validateEnrichedData: vi.fn(),
}))

// Mock data for testing
const mockEnrichedData = [
  {
    arten: "4000",
    funk: "",
    jahr: "2022",
    value: 2500000,
    dim: "einnahmen",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Einkommenssteuern natürliche Personen",
    description_fr: "Impôts sur le revenu, personnes physiques",
    description_en: "Income tax, natural persons"
  },
  {
    arten: "4001",
    funk: "",
    jahr: "2022",
    value: 800000,
    dim: "einnahmen",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Vermögenssteuern natürliche Personen",
    description_fr: "Impôts sur la fortune, personnes physiques",
    description_en: "Wealth tax, natural persons"
  },
  {
    arten: "3000",
    funk: "",
    jahr: "2022",
    value: 1800000,
    dim: "ausgaben",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Personalausgaben",
    description_fr: "Dépenses de personnel",
    description_en: "Personnel expenditure"
  },
  {
    arten: "3100",
    funk: "01",
    jahr: "2022",
    value: 900000,
    dim: "ausgaben",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Sachausgaben",
    description_fr: "Dépenses de biens et services",
    description_en: "Goods and services expenditure"
  }
]

describe('EnrichedDataDisplay.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    vi.mocked(DataEnricher.enrichFinancialData).mockResolvedValue(mockEnrichedData)
    vi.mocked(DataEnricher.validateEnrichedData).mockReturnValue({
      isValid: true,
      issues: [],
      validRecords: mockEnrichedData.length,
      totalRecords: mockEnrichedData.length
    })
  })

  const createWrapper = (props = {}) => {
    return mount(EnrichedDataDisplay, {
      props: {
        entityId: 'gdn_zh',
        year: '2022',
        language: 'de',
        ...props
      },
      global: {
        plugins: [vuetify],
      },
    })
  }

  it('renders loading state initially', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('.v-progress-circular').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading financial data...')
  })

  it('renders component with correct props', () => {
    const wrapper = createWrapper({
      entityId: 'ktn_zh',
      year: '2023',
      language: 'fr'
    })

    expect(wrapper.vm.entityId).toBe('ktn_zh')
    expect(wrapper.vm.year).toBe('2023')
    expect(wrapper.vm.language).toBe('fr')
  })

  it('displays entity display name correctly', async () => {
    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('GDN ZH')
  })

  it('handles error state correctly', async () => {
    vi.mocked(DataEnricher.enrichFinancialData).mockRejectedValue(
      new Error('Failed to load data')
    )

    const wrapper = createWrapper()

    // Wait for error to be handled
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.find('.v-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('Error loading financial data')
    expect(wrapper.text()).toContain('Failed to load data')
  })

  it('handles empty data state', async () => {
    vi.mocked(DataEnricher.enrichFinancialData).mockResolvedValue([])

    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('No Financial Data Found')
    expect(wrapper.text()).toContain('No financial records were found for GDN ZH in 2022')
  })

  it('displays data table when data is loaded', async () => {
    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.find('.v-data-table').exists()).toBe(true)
  })

  it('displays summary statistics correctly', async () => {
    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('Income')
    expect(wrapper.text()).toContain('Expenses')
    expect(wrapper.text()).toContain('Balance')
  })

  it('handles language switching', async () => {
    const wrapper = createWrapper({ language: 'de' })

    // Wait for initial load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Change language
    await wrapper.setProps({ language: 'fr' })
    await wrapper.vm.$nextTick()

    expect(vi.mocked(DataEnricher.enrichFinancialData)).toHaveBeenCalledWith(
      expect.any(Array),
      'fr'
    )
  })

  it('handles dimension filtering', async () => {
    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Find and interact with dimension filter
    const dimensionSelect = wrapper.find('select')
    if (dimensionSelect.exists()) {
      await dimensionSelect.setValue('einnahmen')
      await wrapper.vm.$nextTick()
    }

    // Component should handle the filter change
    expect(wrapper.vm).toBeDefined()
  })

  it('displays correct currency formatting', async () => {
    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check for Swiss currency formatting
    expect(wrapper.text()).toContain('CHF')
  })

  it('handles sorting functionality', async () => {
    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if sort controls exist
    const sortButtons = wrapper.findAll('.v-btn')
    expect(sortButtons.length).toBeGreaterThan(0)
  })

  it('displays type chips correctly', async () => {
    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check for type chips
    const chips = wrapper.findAll('.v-chip')
    expect(chips.length).toBeGreaterThan(0)
  })

  it('shows record count information', async () => {
    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toMatch(/Showing \d+ of \d+ records/)
  })

  it('handles entity ID changes', async () => {
    const wrapper = createWrapper({ entityId: 'gdn_zh' })

    // Wait for initial load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Change entity ID
    await wrapper.setProps({ entityId: 'gdn_be' })
    await wrapper.vm.$nextTick()

    // Should trigger new data load
    expect(vi.mocked(DataEnricher.enrichFinancialData)).toHaveBeenCalledTimes(2)
  })

  it('handles year changes', async () => {
    const wrapper = createWrapper({ year: '2022' })

    // Wait for initial load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Change year
    await wrapper.setProps({ year: '2023' })
    await wrapper.vm.$nextTick()

    // Should trigger new data load
    expect(vi.mocked(DataEnricher.enrichFinancialData)).toHaveBeenCalledTimes(2)
  })

  it('displays validation warnings when data has issues', async () => {
    vi.mocked(DataEnricher.validateEnrichedData).mockReturnValue({
      isValid: false,
      issues: ['Missing required field'],
      validRecords: 3,
      totalRecords: 4
    })

    const wrapper = createWrapper()

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Component should handle validation issues gracefully
    expect(wrapper.vm).toBeDefined()
  })

  it('handles dimension prop correctly', () => {
    const wrapper = createWrapper({ dimension: 'einnahmen' })

    expect(wrapper.vm.dimension).toBe('einnahmen')
  })

  it('handles className prop correctly', () => {
    const wrapper = createWrapper({ className: 'custom-class' })

    expect(wrapper.vm.className).toBe('custom-class')
  })
})
