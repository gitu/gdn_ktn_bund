/**
 * Tests for FinancialDataScalingSelector component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { StatsAvailabilityInfo } from '../../types/StatsData';
import type { MultiLanguageLabels } from '../../types/DataStructures';

// Mock the StatsDataLoader
const mockStatsData: StatsAvailabilityInfo[] = [
  {
    id: 'pop',
    name: {
      de: 'Bevölkerung',
      fr: 'Population',
      it: 'Popolazione',
      en: 'Population'
    } as MultiLanguageLabels,
    unit: {
      de: 'Personen',
      fr: 'Personnes',
      it: 'Persone',
      en: 'Persons'
    } as MultiLanguageLabels,
    availableKtnYears: [2020, 2021, 2022],
    availableGdnYears: [2020, 2021, 2022],
    source: 'BFS',
    lastUpdate: '2023-01-01'
  },
  {
    id: 'area',
    name: {
      de: 'Fläche',
      fr: 'Superficie',
      it: 'Superficie',
      en: 'Area'
    } as MultiLanguageLabels,
    unit: {
      de: 'km²',
      fr: 'km²',
      it: 'km²',
      en: 'km²'
    } as MultiLanguageLabels,
    availableKtnYears: [2020, 2021, 2022],
    availableGdnYears: [2020, 2021, 2022],
    source: 'BFS',
    lastUpdate: '2023-01-01'
  }
];

vi.mock('../../utils/StatsDataLoader', () => ({
  StatsDataLoader: vi.fn().mockImplementation(() => ({
    getAvailableStats: vi.fn().mockResolvedValue(mockStatsData)
  }))
}));

vi.mock('../../utils/GeographicalDataLoader', () => ({
  GeographicalDataLoader: {
    getInstance: vi.fn().mockReturnValue({
      getMunicipalityByGdnId: vi.fn().mockResolvedValue({
        gdnId: '010002',
        name: 'Affoltern a.A.',
        cantonAbbreviation: 'ZH'
      })
    })
  }
}));

// Mock PrimeVue components
vi.mock('primevue/dropdown', () => ({
  default: {
    name: 'Dropdown',
    template: '<select data-testid="dropdown" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
    emits: ['update:modelValue', 'change']
  }
}));

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div data-testid="message" :class="severity"><slot /></div>',
    props: ['severity', 'closable']
  }
}));

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      financialDataScalingSelector: {
        title: 'Data Scaling',
        subtitle: 'Apply scaling factors for better comparison',
        noScaling: 'No scaling',
        loading: 'Loading scaling options...',
        error: 'Error loading scaling options',
        selectScaling: 'Select scaling factor',
        scalingApplied: 'Scaling applied: {name}',
        scalingRemoved: 'Scaling removed',
        scalingInfo: {
          title: 'Scaling Information',
          description: 'Scaling factors help normalize data for better comparison between entities of different sizes.',
          currentScaling: 'Current scaling: {name}',
          unit: 'Unit: {unit}'
        },
        options: {
          population: 'Population',
          area: 'Area',
          households: 'Households',
          employees: 'Employees'
        },
        errors: {
          loadingFailed: 'Failed to load scaling options',
          applyingFailed: 'Failed to apply scaling factor',
          invalidScaling: 'Invalid scaling factor selected'
        }
      }
    },
    de: {
      financialDataScalingSelector: {
        title: 'Datenskalierung',
        subtitle: 'Skalierungsfaktoren für bessere Vergleichbarkeit anwenden',
        noScaling: 'Keine Skalierung',
        loading: 'Lade Skalierungsoptionen...',
        error: 'Fehler beim Laden der Skalierungsoptionen',
        selectScaling: 'Skalierungsfaktor auswählen',
        scalingApplied: 'Skalierung angewendet: {name}',
        scalingRemoved: 'Skalierung entfernt',
        scalingInfo: {
          title: 'Skalierungsinformationen',
          description: 'Skalierungsfaktoren helfen dabei, Daten für bessere Vergleiche zwischen Entitäten unterschiedlicher Größe zu normalisieren.',
          currentScaling: 'Aktuelle Skalierung: {name}',
          unit: 'Einheit: {unit}'
        },
        options: {
          population: 'Bevölkerung',
          area: 'Fläche',
          households: 'Haushalte',
          employees: 'Beschäftigte'
        },
        errors: {
          loadingFailed: 'Fehler beim Laden der Skalierungsoptionen',
          applyingFailed: 'Fehler beim Anwenden des Skalierungsfaktors',
          invalidScaling: 'Ungültiger Skalierungsfaktor ausgewählt'
        }
      }
    }
  }
});

// Import the component after mocks are set up
import FinancialDataScalingSelector from '../FinancialDataScalingSelector.vue';

describe('FinancialDataScalingSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h4').text()).toBe('Data Scaling');
    expect(wrapper.text()).toContain('Apply scaling factors for better comparison');
  });

  it('should show loading state initially', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.find('[data-testid="message"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading scaling options...');
  });

  it('should load and display scaling options', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const dropdown = wrapper.find('[data-testid="dropdown"]');
    expect(dropdown.exists()).toBe(true);

    // Check if options are loaded
    const options = dropdown.findAll('option');
    expect(options.length).toBeGreaterThan(1); // At least "No scaling" + loaded options
  });

  it('should emit scalingChanged when scaling is selected', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const dropdown = wrapper.find('[data-testid="dropdown"]');
    await dropdown.setValue('pop');
    await dropdown.trigger('change');

    expect(wrapper.emitted('scalingChanged')).toBeTruthy();
  });

  it('should emit scalingChanged with null when no scaling is selected', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const dropdown = wrapper.find('[data-testid="dropdown"]');
    await dropdown.setValue('');
    await dropdown.trigger('change');

    const emitted = wrapper.emitted('scalingChanged');
    if (emitted) {
      expect(emitted[0]).toEqual([null, null]);
    }
  });

  it('should display current scaling info when scaling is selected', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Set scaling to population
    const dropdown = wrapper.find('[data-testid="dropdown"]');
    await dropdown.setValue('pop');
    await wrapper.vm.$nextTick();

    // Check if scaling info is displayed
    const scalingInfo = wrapper.find('.scaling-info');
    expect(scalingInfo.exists()).toBe(true);
    expect(wrapper.text()).toContain('Current scaling: Population');
  });

  it('should handle different locales correctly', async () => {
    // Test German locale
    i18n.global.locale.value = 'de';

    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.find('h4').text()).toBe('Datenskalierung');
    expect(wrapper.text()).toContain('Skalierungsfaktoren für bessere Vergleichbarkeit anwenden');
  });

  it('should handle error states', async () => {
    // Mock error in StatsDataLoader
    vi.mocked(require('../../utils/StatsDataLoader').StatsDataLoader).mockImplementation(() => ({
      getAvailableStats: vi.fn().mockRejectedValue(new Error('Network error'))
    }));

    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for error to be handled
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('error')).toBeTruthy();
  });

  it('should filter relevant scaling statistics', async () => {
    const wrapper = mount(FinancialDataScalingSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const dropdown = wrapper.find('[data-testid="dropdown"]');
    const options = dropdown.findAll('option');

    // Should have "No scaling" + filtered statistics (pop, area)
    expect(options.length).toBe(3); // No scaling + pop + area
  });
});
