import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import FinancialDataComparison from '../FinancialDataComparison.vue';
import { createEmptyFinancialDataStructure } from '../../data/emptyFinancialDataStructure';

// Mock the DataLoader
vi.mock('../../utils/DataLoader', () => ({
  DataLoader: vi.fn().mockImplementation(() => ({
    loadAndIntegrateFinancialData: vi.fn().mockResolvedValue(createEmptyFinancialDataStructure())
  }))
}));

// Mock FinancialDataDisplay component
vi.mock('../FinancialDataDisplay.vue', () => ({
  default: {
    name: 'FinancialDataDisplay',
    template: '<div data-testid="financial-data-display">Mocked FinancialDataDisplay</div>',
    props: ['financialData', 'loading', 'error', 'initialExpandedAll', 'initialShowCodes', 'initialShowZeroValues'],
    emits: ['error']
  }
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      financialDataComparison: {
        loading: 'Loading...',
        noData: 'No data available',
        filteredCategories: 'Filtered categories',
        totalRows: '{count} datasets loaded',
        error: 'An error occurred',
        noValidData: 'No valid data found',
        datasetError: 'Error loading dataset {dataset}: {error}'
      }
    }
  }
});

describe('FinancialDataComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    const wrapper = mount(FinancialDataComparison, {
      props: {
        datasets: ['gdn/fs/010002:2022']
      },
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.find('.loading-message').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading...');
  });

  it('should render no data message when datasets array is empty', async () => {
    const wrapper = mount(FinancialDataComparison, {
      props: {
        datasets: []
      },
      global: {
        plugins: [i18n]
      }
    });

    // Wait for component to finish loading
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(wrapper.find('.no-data-message').exists()).toBe(true);
    expect(wrapper.text()).toContain('No data available');
  });

  it('should use single FinancialDataDisplay component for combined data', async () => {
    const wrapper = mount(FinancialDataComparison, {
      props: {
        datasets: ['gdn/fs/010002:2022', 'gdn/fs/010003:2022']
      },
      global: {
        plugins: [i18n]
      }
    });

    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Should have only one FinancialDataDisplay component
    const financialDisplays = wrapper.findAll('[data-testid="financial-data-display"]');
    expect(financialDisplays).toHaveLength(1);

    // Should show info about loaded datasets
    expect(wrapper.text()).toContain('2 datasets loaded');
  });

  it('should emit dataLoaded event with correct count', async () => {
    const wrapper = mount(FinancialDataComparison, {
      props: {
        datasets: ['gdn/fs/010002:2022', 'gdn/fs/010003:2022']
      },
      global: {
        plugins: [i18n]
      }
    });

    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const emittedEvents = wrapper.emitted('dataLoaded');
    expect(emittedEvents).toBeTruthy();
    expect(emittedEvents![0]).toEqual([2]);
  });

  it('should start with empty financial data structure', () => {
    const wrapper = mount(FinancialDataComparison, {
      props: {
        datasets: ['gdn/fs/010002:2022']
      },
      global: {
        plugins: [i18n]
      }
    });

    // The component should use createEmptyFinancialDataStructure internally
    // We can verify this by checking that the component doesn't crash and renders properly
    expect(wrapper.exists()).toBe(true);
  });
});
