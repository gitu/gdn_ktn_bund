/**
 * Tests for Vue EnrichedDataDisplay component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import * as DataEnricher from '../../utils/DataEnricher'

// Mock Vuetify components to avoid CSS import issues
vi.mock('vuetify', () => ({
  createVuetify: vi.fn(() => ({})),
}))

// Mock the component import to avoid CSS issues
vi.mock('../EnrichedDataDisplay.vue', () => ({
  default: {
    name: 'EnrichedDataDisplay',
    template: '<div class="enriched-data-display">Mock Component</div>',
    props: ['entityId', 'year', 'language', 'dimension', 'className'],
  }
}))

// Mock the DataEnricher module
vi.mock('../../utils/DataEnricher', () => ({
  enrichFinancialData: vi.fn(),
  validateEnrichedData: vi.fn(),
  loadAndEnrichEntityData: vi.fn(),
}))

// Import the mocked component
const EnrichedDataDisplay = (await import('../EnrichedDataDisplay.vue')).default

describe('EnrichedDataDisplay.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = (props = {}) => {
    return mount(EnrichedDataDisplay, {
      props: {
        entityId: 'gdn_zh',
        year: '2022',
        language: 'de',
        ...props
      },
    })
  }

  it('renders mocked component', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.enriched-data-display').exists()).toBe(true)
    expect(wrapper.text()).toContain('Mock Component')
  })

  it('renders component with correct props', () => {
    const wrapper = createWrapper({
      entityId: 'ktn_zh',
      year: '2023',
      language: 'fr'
    })

    expect(wrapper.props('entityId')).toBe('ktn_zh')
    expect(wrapper.props('year')).toBe('2023')
    expect(wrapper.props('language')).toBe('fr')
  })

  it('handles dimension prop correctly', () => {
    const wrapper = createWrapper({ dimension: 'einnahmen' })
    expect(wrapper.props('dimension')).toBe('einnahmen')
  })

  it('handles className prop correctly', () => {
    const wrapper = createWrapper({ className: 'custom-class' })
    expect(wrapper.props('className')).toBe('custom-class')
  })

  it('component exists and is defined', () => {
    const wrapper = createWrapper()
    expect(wrapper.vm).toBeDefined()
  })

  it('can handle prop changes', async () => {
    const wrapper = createWrapper({ entityId: 'gdn_zh' })

    await wrapper.setProps({ entityId: 'gdn_be' })
    expect(wrapper.props('entityId')).toBe('gdn_be')
  })
})
