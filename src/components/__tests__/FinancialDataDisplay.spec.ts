import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import FinancialDataDisplay from '../FinancialDataDisplay.vue';
import type { FinancialData, FinancialDataNode, FinancialDataEntity } from '@/types/FinancialDataStructure';
import type { MultiLanguageLabels } from '@/types/DataStructures';

// Mock PrimeVue components
vi.mock('primevue/treetable', () => ({
  default: {
    name: 'TreeTable',
    template: '<div class="mock-treetable">TreeTable Mock</div>',
    props: ['value', 'expandedKeys', 'scrollable', 'scrollHeight', 'resizableColumns', 'columnResizeMode'],
    emits: ['node-expand', 'node-collapse']
  }
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="mock-column">Column Mock</div>',
    props: ['field', 'header', 'expander', 'class']
  }
}));

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      financialDataDisplay: {
        title: 'Finanzdaten-Anzeige',
        balanceSheet: 'Bilanz',
        incomeStatement: 'Erfolgsrechnung',
        loading: 'Lade Finanzdaten...',
        error: 'Fehler beim Laden der Daten',
        noData: 'Keine Finanzdaten verfügbar',
        noEntities: 'Keine Entitäten verfügbar',
        expandAll: 'Alle erweitern',
        collapseAll: 'Alle einklappen',
        showCodes: 'Codes anzeigen',
        hideCodes: 'Codes ausblenden',
        showZeroValues: 'Nullwerte anzeigen',
        hideZeroValues: 'Nullwerte ausblenden',
        columns: {
          account: 'Konto',
          code: 'Code',
          description: 'Beschreibung'
        },
        currency: 'CHF',
        metadata: {
          source: 'Quelle',
          loadedAt: 'Geladen am',
          recordCount: 'Anzahl Datensätze',
          entities: 'Entitäten'
        },
        accessibility: {
          expandNode: 'Knoten erweitern',
          collapseNode: 'Knoten einklappen',
          financialValue: 'Finanzieller Wert für {entity}',
          noValue: 'Kein Wert verfügbar'
        },
        errors: {
          invalidData: 'Ungültige Finanzdaten',
          missingBalanceSheet: 'Bilanz fehlt',
          missingIncomeStatement: 'Erfolgsrechnung fehlt',
          processingError: 'Fehler bei der Datenverarbeitung',
          noEntities: 'Keine Entitäten verfügbar'
        }
      }
    },
    en: {
      financialDataDisplay: {
        title: 'Financial Data Display',
        balanceSheet: 'Balance Sheet',
        incomeStatement: 'Income Statement',
        loading: 'Loading financial data...',
        error: 'Error loading data',
        noData: 'No financial data available',
        noEntities: 'No entities available',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        showCodes: 'Show Codes',
        hideCodes: 'Hide Codes',
        showZeroValues: 'Show Zero Values',
        hideZeroValues: 'Hide Zero Values',
        columns: {
          account: 'Account',
          code: 'Code',
          description: 'Description'
        },
        currency: 'CHF',
        metadata: {
          source: 'Source',
          loadedAt: 'Loaded at',
          recordCount: 'Record count',
          entities: 'Entities'
        },
        accessibility: {
          expandNode: 'Expand node',
          collapseNode: 'Collapse node',
          financialValue: 'Financial value for {entity}',
          noValue: 'No value available'
        },
        errors: {
          invalidData: 'Invalid financial data',
          missingBalanceSheet: 'Balance sheet missing',
          missingIncomeStatement: 'Income statement missing',
          processingError: 'Error processing data',
          noEntities: 'No entities available'
        }
      }
    }
  }
});

// Test data factory functions
const createMultiLanguageLabels = (text: string): MultiLanguageLabels => ({
  de: `${text} (DE)`,
  fr: `${text} (FR)`,
  it: `${text} (IT)`,
  en: `${text} (EN)`
});

const createFinancialDataNode = (code: string, label: string, children: FinancialDataNode[] = []): FinancialDataNode => ({
  code,
  labels: createMultiLanguageLabels(label),
  values: new Map([
    ['entity1', { value: 1000, unit: 'CHF' }],
    ['entity2', { value: 2000, unit: 'CHF' }]
  ]),
  children
});

const createFinancialDataEntity = (code: string, name: string): FinancialDataEntity => ({
  code,
  name: createMultiLanguageLabels(name),
  scalingFactor: 1,
  metadata: {
    source: 'test',
    loadedAt: '2023-01-01T00:00:00Z',
    recordCount: 100
  }
});

const createMockFinancialData = (): FinancialData => {
  const balanceSheet = createFinancialDataNode('1', 'Assets', [
    createFinancialDataNode('10', 'Current Assets'),
    createFinancialDataNode('11', 'Non-Current Assets')
  ]);

  const incomeStatement = createFinancialDataNode('4', 'Revenue', [
    createFinancialDataNode('40', 'Operating Revenue'),
    createFinancialDataNode('41', 'Non-Operating Revenue')
  ]);

  const entities = new Map([
    ['entity1', createFinancialDataEntity('entity1', 'Entity One')],
    ['entity2', createFinancialDataEntity('entity2', 'Entity Two')]
  ]);

  return {
    balanceSheet,
    incomeStatement,
    entities,
    metadata: {
      source: 'test-source',
      loadedAt: '2023-01-01T00:00:00Z',
      recordCount: 200
    }
  };
};

describe('FinancialDataDisplay', () => {
  let mockFinancialData: FinancialData;

  beforeEach(() => {
    mockFinancialData = createMockFinancialData();
  });

  describe('Component Rendering', () => {
    it('renders the component title correctly', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      expect(wrapper.find('.title').text()).toBe('Finanzdaten-Anzeige');
    });

    it('renders control buttons', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const buttons = wrapper.findAll('.control-button');
      expect(buttons).toHaveLength(3);
      expect(buttons[0].text()).toContain('Alle erweitern');
      expect(buttons[1].text()).toContain('Codes ausblenden');
      expect(buttons[2].text()).toContain('Nullwerte anzeigen'); // Default is false, so it shows "show"
    });

    it('displays metadata section when financial data has metadata', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const metadataSection = wrapper.find('.metadata-section');
      expect(metadataSection.exists()).toBe(true);
      expect(metadataSection.text()).toContain('Quelle: test-source');
      expect(metadataSection.text()).toContain('Anzahl Datensätze: 200');
      expect(metadataSection.text()).toContain('Entitäten: 2');
    });

    it('renders balance sheet section when balance sheet data exists', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const balanceSheetSection = wrapper.find('.section');
      expect(balanceSheetSection.exists()).toBe(true);
      expect(balanceSheetSection.find('.section-title').text()).toBe('Bilanz');
    });
  });

  describe('Loading and Error States', () => {
    it('displays loading message when loading prop is true', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          loading: true
        }
      });

      const loadingMessage = wrapper.find('.loading-message');
      expect(loadingMessage.exists()).toBe(true);
      expect(loadingMessage.text()).toContain('Lade Finanzdaten...');
    });

    it('displays error message when error prop is provided', () => {
      const errorText = 'Test error message';
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          error: errorText
        }
      });

      const errorMessage = wrapper.find('.error-message');
      expect(errorMessage.exists()).toBe(true);
      expect(errorMessage.text()).toContain(errorText);
    });

    it('displays no data message when financial data is null', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: null
        }
      });

      const noDataMessage = wrapper.find('.no-data-message');
      expect(noDataMessage.exists()).toBe(true);
      expect(noDataMessage.text()).toContain('Keine Finanzdaten verfügbar');
    });
  });

  describe('Control Button Interactions', () => {
    it('toggles expand all button text when clicked', async () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const expandButton = wrapper.findAll('.control-button')[0];
      expect(expandButton.text()).toContain('Alle erweitern');

      await expandButton.trigger('click');
      expect(expandButton.text()).toContain('Alle einklappen');
    });

    it('toggles show codes button text when clicked', async () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const codesButton = wrapper.findAll('.control-button')[1];
      expect(codesButton.text()).toContain('Codes ausblenden');

      await codesButton.trigger('click');
      expect(codesButton.text()).toContain('Codes anzeigen');
    });

    it('toggles show zero values button text when clicked', async () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const zeroValuesButton = wrapper.findAll('.control-button')[2];
      expect(zeroValuesButton.text()).toContain('Nullwerte anzeigen'); // Default is false

      await zeroValuesButton.trigger('click');
      expect(zeroValuesButton.text()).toContain('Nullwerte ausblenden');
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('emits error when financial data is invalid', async () => {
      const invalidData = {
        balanceSheet: null,
        incomeStatement: null,
        entities: new Map(),
        metadata: {
          source: 'test',
          loadedAt: '2023-01-01T00:00:00Z',
          recordCount: 0
        }
      } as unknown as FinancialData;

      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: invalidData
        }
      });

      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('error')).toBeTruthy();
    });

    it('handles missing entities gracefully', async () => {
      const dataWithoutEntities = {
        ...mockFinancialData,
        entities: new Map()
      };

      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: dataWithoutEntities
        }
      });

      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('error')).toBeTruthy();
    });

    it('handles missing balance sheet and income statement', () => {
      const dataWithoutStatements = {
        ...mockFinancialData,
        balanceSheet: null,
        incomeStatement: null
      } as unknown as FinancialData;

      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: dataWithoutStatements
        }
      });

      const noDataMessage = wrapper.find('.no-data-message');
      expect(noDataMessage.exists()).toBe(true);
    });
  });

  describe('Internationalization', () => {
    it('displays content in English when locale is changed', async () => {
      i18n.global.locale.value = 'en';

      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      expect(wrapper.find('.title').text()).toBe('Financial Data Display');
      expect(wrapper.find('.section-title').text()).toBe('Balance Sheet');
    });

    it('falls back to German when translation is missing', () => {
      // Set locale to German for this test
      i18n.global.locale.value = 'de';

      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      // Test that node labels fall back to German
      const vm = wrapper.vm as unknown as { getNodeLabel: (node: FinancialDataNode) => string };
      const testNode = createFinancialDataNode('test', 'Test Label');
      const label = vm.getNodeLabel(testNode);
      expect(label).toBe('Test Label (DE)');
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency values correctly', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const vm = wrapper.vm as unknown as { formatCurrency: (value: number) => string };
      const formattedValue = vm.formatCurrency(1234.56);
      expect(formattedValue).toMatch(/CHF/);
      expect(formattedValue).toMatch(/1[,.]?235/); // Allow for different locale formatting
    });

    it('handles zero values correctly', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const vm = wrapper.vm as unknown as { formatCurrency: (value: number) => string };
      const formattedValue = vm.formatCurrency(0);
      expect(formattedValue).toMatch(/0.*CHF|CHF.*0/); // Allow for different locale formatting
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const vm = wrapper.vm as unknown as { formatDate: (dateString: string) => string };
      const formattedDate = vm.formatDate('2023-01-01T12:30:00Z');
      expect(formattedDate).toMatch(/2023/);
      expect(formattedDate).toMatch(/01/);
    });

    it('handles invalid dates gracefully', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const vm = wrapper.vm as unknown as { formatDate: (dateString: string) => string };
      const invalidDate = 'invalid-date';
      const formattedDate = vm.formatDate(invalidDate);
      expect(formattedDate).toBe(invalidDate);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on control buttons', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData
        }
      });

      const buttons = wrapper.findAll('.control-button');
      buttons.forEach(button => {
        expect(button.attributes('aria-label')).toBeTruthy();
      });
    });

    it('has proper role attributes for messages', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          error: 'Test error'
        }
      });

      const errorMessage = wrapper.find('.error-message');
      expect(errorMessage.attributes('role')).toBe('alert');
    });

    it('has proper role attribute for loading message', () => {
      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          loading: true
        }
      });

      const loadingMessage = wrapper.find('.loading-message');
      expect(loadingMessage.attributes('role')).toBe('status');
    });
  });

  describe('Props and Initial State', () => {
    it('respects initialExpandedAll prop', () => {
      // Set locale to German for this test
      i18n.global.locale.value = 'de';

      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData,
          initialExpandedAll: true
        }
      });

      const expandButton = wrapper.findAll('.control-button')[0];
      expect(expandButton.text()).toContain('Alle einklappen');
    });

    it('respects initialShowCodes prop', () => {
      // Set locale to German for this test
      i18n.global.locale.value = 'de';

      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData,
          initialShowCodes: false
        }
      });

      const codesButton = wrapper.findAll('.control-button')[1];
      expect(codesButton.text()).toContain('Codes anzeigen');
    });

    it('respects initialShowZeroValues prop', () => {
      // Set locale to German for this test
      i18n.global.locale.value = 'de';

      const wrapper = mount(FinancialDataDisplay, {
        global: {
          plugins: [i18n]
        },
        props: {
          financialData: mockFinancialData,
          initialShowZeroValues: true
        }
      });

      const zeroValuesButton = wrapper.findAll('.control-button')[2];
      expect(zeroValuesButton.text()).toContain('Nullwerte ausblenden');
    });
  });
});
