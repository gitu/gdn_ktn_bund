/**
 * Tests for DatasetSelector component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { AvailableDataCatalog } from '../../types/DataStructures';

// Mock the AvailableDataLoader
const mockCatalog: AvailableDataCatalog = [
  {
    id: 'gdn_010002',
    type: 'gdn',
    entityCode: '010002',
    displayName: {
      de: 'Affoltern a.A.',
      fr: 'Affoltern a.A.',
      it: 'Affoltern a.A.',
      en: 'Affoltern a.A.'
    },
    description: {
      de: 'Finanzdaten der Gemeinde Affoltern a.A.',
      fr: 'Données financières de la commune Affoltern a.A.',
      it: 'Dati finanziari del comune Affoltern a.A.',
      en: 'Financial data for municipality Affoltern a.A.'
    },
    availableYears: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
    municipalityNumber: '010002'
  },
  {
    id: 'std_sv_ahv',
    type: 'std',
    entityCode: 'sv_ahv',
    displayName: {
      de: 'Alters- und Hinterlassenenversicherung',
      fr: 'Assurance-vieillesse et survivants',
      it: 'Assicurazione vecchiaia e superstiti',
      en: 'Old Age and Survivors Insurance'
    },
    description: {
      de: 'Sozialversicherungsdaten der Schweiz',
      fr: 'Données des assurances sociales suisses',
      it: 'Dati delle assicurazioni sociali svizzere',
      en: 'Swiss social insurance data'
    },
    availableYears: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
  }
];

vi.mock('../../utils/AvailableDataLoader', () => ({
  loadAvailableDataCatalog: vi.fn().mockResolvedValue([
    {
      id: 'gdn_010002',
      type: 'gdn',
      entityCode: '010002',
      displayName: {
        de: 'Affoltern a.A.',
        fr: 'Affoltern a.A.',
        it: 'Affoltern a.A.',
        en: 'Affoltern a.A.'
      },
      description: {
        de: 'Finanzdaten der Gemeinde Affoltern a.A.',
        fr: 'Données financières de la commune Affoltern a.A.',
        it: 'Dati finanziari del comune Affoltern a.A.',
        en: 'Financial data for municipality Affoltern a.A.'
      },
      availableYears: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
      municipalityNumber: '010002'
    },
    {
      id: 'std_sv_ahv',
      type: 'std',
      entityCode: 'sv_ahv',
      displayName: {
        de: 'Alters- und Hinterlassenenversicherung',
        fr: 'Assurance-vieillesse et survivants',
        it: 'Assicurazione vecchiaia e superstiti',
        en: 'Old Age and Survivors Insurance'
      },
      description: {
        de: 'Sozialversicherungsdaten der Schweiz',
        fr: 'Données des assurances sociales suisses',
        it: 'Dati delle assicurazioni sociali svizzere',
        en: 'Swiss social insurance data'
      },
      availableYears: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
    }
  ]),
  filterByType: vi.fn((catalog, type) => catalog.filter((entry: typeof mockCatalog[0]) => entry.type === type)),
  filterByYear: vi.fn((catalog, year) => catalog.filter((entry: typeof mockCatalog[0]) => entry.availableYears.includes(year))),
  searchByName: vi.fn((catalog, query) => catalog.filter((entry: typeof mockCatalog[0]) =>
    entry.displayName.de.toLowerCase().includes(query.toLowerCase())
  )),
  getAllAvailableYears: vi.fn(() => ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'])
}));

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div data-testid="data-table"><slot /></div>',
    props: ['value', 'paginator', 'rows', 'rowsPerPageOptions', 'paginatorTemplate', 'currentPageReportTemplate', 'scrollHeight', 'scrollDirection']
  }
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div data-testid="column"><slot /></div>',
    props: ['field', 'header']
  }
}));

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template: '<input data-testid="input-text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue']
  }
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button data-testid="button" @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['icon', 'severity', 'disabled', 'label', 'size', 'text', 'outlined'],
    emits: ['click']
  }
}));

vi.mock('primevue/dropdown', () => ({
  default: {
    name: 'Dropdown',
    template: '<select data-testid="dropdown" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
    emits: ['update:modelValue']
  }
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span data-testid="tag" :class="severity">{{ value }}</span>',
    props: ['value', 'severity', 'size']
  }
}));

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div data-testid="message" :class="severity"><slot /></div>',
    props: ['severity', 'closable']
  }
}));

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div data-testid="progress-spinner"></div>',
    props: ['size']
  }
}));

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      datasetSelector: {
        title: 'Dataset Selection',
        subtitle: 'Select datasets for comparison',
        searchPlaceholder: 'Search for datasets...',
        availableDatasets: 'Available Datasets',
        selectedDatasets: 'Selected Datasets',
        resultsCount: '{count} of {total} datasets',
        selectedCount: '{count} selected',
        yearCount: '{count} years',
        loading: 'Loading data catalog...',
        selectYear: 'Select year',
        addDataset: 'Add',
        removeDataset: 'Remove {name}',
        clearAll: 'Clear all',
        compareDatasets: 'Compare datasets',
        pageReportTemplate: 'Showing {first} to {last} of {totalRecords} entries',
        filters: {
          dataType: 'Data type',
          year: 'Year',
          all: 'All',
          allYears: 'All years',
          gdn: 'Municipalities',
          std: 'Standard'
        },
        types: {
          gdn: 'Municipality',
          std: 'Standard'
        },
        columns: {
          name: 'Name',
          description: 'Description',
          years: 'Available Years',
          actions: 'Actions'
        },
        errors: {
          loadingFailed: 'Failed to load data catalog',
          duplicateDataset: 'This dataset is already selected'
        }
      }
    }
  }
});

// Import the component after mocks are set up
import DatasetSelector from '../DatasetSelector.vue';

describe('DatasetSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-testid="input-text"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="data-table"]').exists()).toBe(true);
  });

  it('should show loading state initially', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Should show loading spinner initially
    expect(wrapper.find('[data-testid="progress-spinner"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading data catalog...');
  });

  it('should emit datasetsChanged when datasets are selected', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Simulate adding a dataset
    await wrapper.vm.addDataset(mockCatalog[0]);

    expect(wrapper.emitted('datasetsChanged')).toBeTruthy();
  });

  it('should handle search functionality', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const searchInput = wrapper.find('[data-testid="input-text"]');
    await searchInput.setValue('Affoltern');

    // Should trigger search
    expect(wrapper.vm.searchQuery).toBe('Affoltern');
  });

  it('should handle type filtering', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Change type filter
    wrapper.vm.selectedType = 'gdn';
    await wrapper.vm.$nextTick();

    // Should filter by type
    expect(wrapper.vm.selectedType).toBe('gdn');
  });

  it('should prevent duplicate dataset selection', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Add dataset twice using the new method that auto-selects latest year
    await wrapper.vm.addDatasetWithDefaultYear(mockCatalog[0]);
    await wrapper.vm.addDatasetWithDefaultYear(mockCatalog[0]);

    // Should only have one dataset
    expect(wrapper.vm.selectedDatasets.length).toBe(1);
  });

  it('should clear all selected datasets', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Add a dataset using the new method
    await wrapper.vm.addDatasetWithDefaultYear(mockCatalog[0]);

    expect(wrapper.vm.selectedDatasets.length).toBe(1);

    // Clear all
    await wrapper.vm.clearAllDatasets();

    expect(wrapper.vm.selectedDatasets.length).toBe(0);
  });

  it('should handle initial datasets prop', async () => {
    const initialDatasets = ['gdn/fs/010002:2022'];

    const wrapper = mount(DatasetSelector, {
      props: {
        initialDatasets
      },
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Should have initialized with the provided datasets
    expect(wrapper.vm.selectedDatasets.length).toBe(1);
  });

  it('should automatically select the latest year as default', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Test setDefaultYear method
    const testEntry = mockCatalog[1]; // STD entry with years 2015-2023
    wrapper.vm.setDefaultYear(testEntry);

    // Should select 2023 (latest year)
    expect(wrapper.vm.selectedYears[testEntry.id]).toBe('2023');
  });

  it('should show latest year in button label when no year selected', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const testEntry = mockCatalog[1]; // STD entry with years 2015-2023
    const buttonLabel = wrapper.vm.getAddButtonLabel(testEntry);

    // Should show "Add latest (2023)"
    expect(buttonLabel).toContain('2023');
  });

  it('should get latest year correctly', async () => {
    const wrapper = mount(DatasetSelector, {
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const testEntry = mockCatalog[1]; // STD entry with years 2015-2023
    const latestYear = wrapper.vm.getLatestYear(testEntry);

    expect(latestYear).toBe('2023');
  });
});
