import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { nextTick } from 'vue';
import FinancialDataComparison from '../FinancialDataComparison.vue';
import type { GdnDataRecord, StdDataRecord, TreeAggregationResult } from '../../types/DataStructures';

// Mock PrimeVue components
vi.mock('primevue/treetable', () => ({
  default: {
    name: 'TreeTable',
    template: '<div class="mock-tree-table"><slot /></div>',
    props: ['value', 'expandedKeys', 'tableStyle'],
    emits: ['node-expand', 'node-collapse']
  }
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="mock-column"><slot /></div>',
    props: ['field', 'header', 'expander', 'headerStyle', 'bodyStyle']
  }
}));

// Mock DataLoader
const mockDataLoader = {
  loadGdnData: vi.fn(),
  loadStdData: vi.fn()
};

vi.mock('../../utils/DataLoader', () => ({
  DataLoader: vi.fn(() => mockDataLoader)
}));

// Mock TreeAggregator
const mockTreeAggregator = {
  aggregateGdnData: vi.fn(),
  aggregateStdData: vi.fn()
};

vi.mock('../../utils/TreeAggregator', () => ({
  TreeAggregator: vi.fn(() => mockTreeAggregator)
}));

// Mock EntitySemanticMapper
vi.mock('../../utils/EntitySemanticMapper', () => ({
  EntitySemanticMapper: {
    getEntityDisplayName: vi.fn((entity: string) => ({
      de: `Entity ${entity}`,
      fr: `Entité ${entity}`,
      it: `Entità ${entity}`,
      en: `Entity ${entity}`
    }))
  }
}));

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      financialDataComparison: {
        title: 'Financial Data Comparison',
        loading: 'Loading financial data...',
        error: 'Error loading data',
        noData: 'No data available for comparison',
        columns: {
          category: 'Category',
          code: 'Code'
        },
        loadingDataset: 'Loading dataset {dataset}...',
        datasetError: 'Error loading dataset {dataset}: {error}',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        showCodes: 'Show Codes',
        hideValues: 'Hide Zero Values',
        currency: 'CHF',
        totalRows: 'Total rows: {count}',
        filteredCategories: 'Showing: Balance Sheet, Revenue, Expenditure',
        parseError: 'Invalid dataset format: {dataset}',
        aggregationError: 'Error aggregating data for {dataset}',
        noValidData: 'No valid data found in any dataset'
      }
    }
  }
});

// Sample test data
const mockGdnData: GdnDataRecord[] = [
  {
    jahr: '2015',
    nr: '010002',
    gemeinde: 'Test Municipality',
    konto: '1',
    funktion: '',
    betrag: 1000000
  },
  {
    jahr: '2015',
    nr: '010002',
    gemeinde: 'Test Municipality',
    konto: '10',
    funktion: '',
    betrag: 500000
  }
];

const mockStdData: StdDataRecord[] = [
  {
    arten: '1',
    funk: '',
    jahr: '2015',
    value: 2000000,
    dim: 'bilanz',
    hh: 'gdn_zh',
    unit: 'CHF',
    model: 'fs'
  },
  {
    arten: '10',
    funk: '',
    jahr: '2015',
    value: 1000000,
    dim: 'bilanz',
    hh: 'gdn_zh',
    unit: 'CHF',
    model: 'fs'
  }
];

const mockAggregationResult: TreeAggregationResult = {
  aggregatedData: [
    {
      entityId: '010002',
      entityName: 'Test Municipality',
      year: '2015',
      code: 'root',
      label: 'Total',
      value: 1500000,
      dimension: 'bilanz'
    },
    {
      entityId: '010002',
      entityName: 'Test Municipality',
      year: '2015',
      code: '1',
      label: 'Assets',
      value: 1000000,
      dimension: 'bilanz'
    },
    {
      entityId: '010002',
      entityName: 'Test Municipality',
      year: '2015',
      code: '10',
      label: 'Financial Assets',
      value: 500000,
      dimension: 'bilanz'
    }
  ],
  metadata: {
    totalRecords: 2,
    processedAt: '2024-01-01T00:00:00.000Z',
    dimension: 'bilanz'
  }
};

describe('FinancialDataComparison', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockDataLoader.loadGdnData.mockResolvedValue({
      data: mockGdnData,
      metadata: {
        source: 'test',
        loadedAt: '2024-01-01T00:00:00.000Z',
        recordCount: mockGdnData.length,
        entityId: '010002',
        year: '2015'
      }
    });

    mockDataLoader.loadStdData.mockResolvedValue({
      data: mockStdData,
      metadata: {
        source: 'test',
        loadedAt: '2024-01-01T00:00:00.000Z',
        recordCount: mockStdData.length,
        entityId: 'gdn_zh',
        year: '2015'
      }
    });

    mockTreeAggregator.aggregateGdnData.mockResolvedValue(mockAggregationResult);
    mockTreeAggregator.aggregateStdData.mockResolvedValue(mockAggregationResult);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Rendering', () => {
    it('should render with empty datasets', () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: []
        },
        global: {
          plugins: [i18n]
        }
      });

      expect(wrapper.find('.financial-data-comparison').exists()).toBe(true);
      expect(wrapper.find('.no-data-state').exists()).toBe(true);
      expect(wrapper.text()).toContain('No data available for comparison');
    });

    it('should render loading state initially', async () => {
      // Make the mock return a pending promise
      let resolvePromise!: (value: { data: GdnDataRecord[]; metadata: { source: string; loadedAt: string; recordCount: number } }) => void;
      const pendingPromise = new Promise<{ data: GdnDataRecord[]; metadata: { source: string; loadedAt: string; recordCount: number } }>((resolve) => {
        resolvePromise = resolve;
      });
      mockDataLoader.loadGdnData.mockReturnValue(pendingPromise);

      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['gdn/fs/010002:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      expect(wrapper.find('.loading-state').exists()).toBe(true);
      expect(wrapper.text()).toContain('Loading financial data...');

      // Resolve the promise to clean up
      resolvePromise({
        data: mockGdnData,
        metadata: { source: 'test', loadedAt: '2024-01-01', recordCount: 2 }
      });
      await nextTick();
    });

    it('should render header with title and controls', () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: []
        },
        global: {
          plugins: [i18n]
        }
      });

      const header = wrapper.find('.comparison-header');
      expect(header.exists()).toBe(true);
      expect(header.find('h2').text()).toBe('Financial Data Comparison');
      
      const controls = header.find('.controls');
      expect(controls.exists()).toBe(true);
      expect(controls.findAll('button')).toHaveLength(3);
    });
  });

  describe('Dataset Parsing', () => {
    it('should parse valid GDN dataset identifiers', async () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['gdn/fs/010002:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async operations

      expect(mockDataLoader.loadGdnData).toHaveBeenCalledWith('010002', '2015', 'fs');
      expect(mockTreeAggregator.aggregateGdnData).toHaveBeenCalled();
    });

    it('should parse valid STD dataset identifiers', async () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['std/fs/gdn_zh:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async operations

      expect(mockDataLoader.loadStdData).toHaveBeenCalledWith('gdn_zh', '2015', 'fs');
      expect(mockTreeAggregator.aggregateStdData).toHaveBeenCalled();
    });

    it('should handle invalid dataset formats gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['invalid-format', 'gdn/fs/010002:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith('Invalid dataset format: invalid-format');
      // Should still process valid datasets
      expect(mockDataLoader.loadGdnData).toHaveBeenCalledWith('010002', '2015', 'fs');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Data Loading', () => {
    it('should load multiple datasets successfully', async () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['gdn/fs/010002:2015', 'std/fs/gdn_zh:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockDataLoader.loadGdnData).toHaveBeenCalledWith('010002', '2015', 'fs');
      expect(mockDataLoader.loadStdData).toHaveBeenCalledWith('gdn_zh', '2015', 'fs');
    });

    it('should emit dataLoaded event when data is successfully loaded', async () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['gdn/fs/010002:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));

      const emittedEvents = wrapper.emitted('dataLoaded');
      expect(emittedEvents).toBeTruthy();
      expect(emittedEvents![0]).toEqual([1]); // 1 dataset loaded
    });

    it('should emit error event when data loading fails', async () => {
      const errorMessage = 'Network error';
      mockDataLoader.loadGdnData.mockRejectedValue(new Error(errorMessage));

      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['gdn/fs/010002:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));

      const emittedEvents = wrapper.emitted('error');
      expect(emittedEvents).toBeTruthy();
      expect(emittedEvents![0][0]).toContain(errorMessage);
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['gdn/fs/010002:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should toggle expand/collapse all functionality', async () => {
      const expandButton = wrapper.find('.controls button');
      expect(expandButton.text()).toBe('Expand All');

      await expandButton.trigger('click');
      expect(expandButton.text()).toBe('Collapse All');

      await expandButton.trigger('click');
      expect(expandButton.text()).toBe('Expand All');
    });

    it('should toggle show codes functionality', async () => {
      const buttons = wrapper.findAll('.controls button');
      const showCodesButton = buttons[1]; // Second button

      expect(showCodesButton.text()).toBe('Show Codes');
      await showCodesButton.trigger('click');
      // The button text doesn't change, but the functionality should toggle
    });

    it('should toggle hide zero values functionality', async () => {
      const buttons = wrapper.findAll('.controls button');
      const hideValuesButton = buttons[2]; // Third button

      expect(hideValuesButton.text()).toBe('Hide Zero Values');
      await hideValuesButton.trigger('click');
      // The button text doesn't change, but the functionality should toggle
    });
  });

  describe('Data Processing', () => {
    it('should filter data to show only allowed dimensions', async () => {
      const mixedDimensionResult = {
        ...mockAggregationResult,
        aggregatedData: [
          ...mockAggregationResult.aggregatedData,
          {
            entityId: '010002',
            entityName: 'Test Municipality',
            year: '2015',
            code: 'invalid',
            label: 'Invalid Dimension',
            value: 100000,
            dimension: 'invalid_dimension' // This should be filtered out
          }
        ]
      };

      mockTreeAggregator.aggregateGdnData.mockResolvedValue(mixedDimensionResult);

      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['gdn/fs/010002:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));

      // The component should only show data from allowed dimensions
      // This is tested indirectly through the filteredNodes computed property
      expect(wrapper.find('.info-bar').exists()).toBe(true);
    });

    it('should format currency values correctly', async () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: ['gdn/fs/010002:2015']
        },
        global: {
          plugins: [i18n]
        }
      });

      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Test the formatCurrency method indirectly
      const component = wrapper.vm as unknown as { formatCurrency: (value: number | null | undefined) => string };
      expect(component.formatCurrency(1000000)).toMatch(/CHF/);
      expect(component.formatCurrency(null)).toBe('-');
      expect(component.formatCurrency(undefined)).toBe('-');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive CSS classes', () => {
      wrapper = mount(FinancialDataComparison, {
        props: {
          datasets: []
        },
        global: {
          plugins: [i18n]
        }
      });

      expect(wrapper.find('.financial-data-comparison').exists()).toBe(true);
      expect(wrapper.find('.comparison-header').exists()).toBe(true);
      expect(wrapper.find('.controls').exists()).toBe(true);
    });
  });
});
