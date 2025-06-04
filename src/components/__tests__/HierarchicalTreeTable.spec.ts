import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import HierarchicalTreeTable from '../HierarchicalTreeTable.vue';
import type { TreeStructure, GdnDataRecord, TreeAggregationResult } from '../../types/DataStructures';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      treeTable: {
        title: 'Hierarchische Tabelle',
        expandAll: 'Alle erweitern',
        collapseAll: 'Alle einklappen',
        loading: 'Lade Daten...',
        error: 'Fehler',
        noData: 'Keine Daten verfügbar',
        showCodes: 'Codes anzeigen',
        showValues: 'Werte anzeigen',
        expand: 'Erweitern',
        collapse: 'Einklappen',
        labelColumn: 'Bezeichnung',
        codeColumn: 'Code',
        valueColumn: 'Wert',
        recordsProcessed: '{count} Datensätze verarbeitet',
        rowsDisplayed: '{count} Zeilen angezeigt',
        loadedAt: 'geladen {date}'
      }
    },
    fr: {
      treeTable: {
        title: 'Tableau hiérarchique',
        expandAll: 'Tout développer',
        collapseAll: 'Tout réduire',
        loading: 'Chargement des données...',
        error: 'Erreur',
        noData: 'Aucune donnée disponible',
        showCodes: 'Afficher les codes',
        showValues: 'Afficher les valeurs',
        expand: 'Développer',
        collapse: 'Réduire',
        labelColumn: 'Libellé',
        codeColumn: 'Code',
        valueColumn: 'Valeur',
        recordsProcessed: '{count} enregistrements traités',
        rowsDisplayed: '{count} lignes affichées',
        loadedAt: 'chargé {date}'
      }
    },
    it: {
      treeTable: {
        title: 'Tabella gerarchica',
        expandAll: 'Espandi tutto',
        collapseAll: 'Comprimi tutto',
        loading: 'Caricamento dati...',
        error: 'Errore',
        noData: 'Nessun dato disponibile',
        showCodes: 'Mostra codici',
        showValues: 'Mostra valori',
        expand: 'Espandi',
        collapse: 'Comprimi',
        labelColumn: 'Denominazione',
        codeColumn: 'Codice',
        valueColumn: 'Valore',
        recordsProcessed: '{count} record elaborati',
        rowsDisplayed: '{count} righe visualizzate',
        loadedAt: 'caricato il {date}'
      }
    },
    en: {
      treeTable: {
        title: 'Hierarchical Table',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        loading: 'Loading data...',
        error: 'Error',
        noData: 'No data available',
        showCodes: 'Show Codes',
        showValues: 'Show Values',
        expand: 'Expand',
        collapse: 'Collapse',
        labelColumn: 'Label',
        codeColumn: 'Code',
        valueColumn: 'Value',
        recordsProcessed: '{count} records processed',
        rowsDisplayed: '{count} rows displayed',
        loadedAt: 'loaded {date}'
      }
    }
  }
});

// Mock the DataLoader and TreeAggregator
vi.mock('../../utils/DataLoader');
vi.mock('../../utils/TreeAggregator');

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample test data
const mockTreeStructure: TreeStructure = {
  metadata: {
    dimension: 'aufwand',
    model: 'fs',
    source: 'test',
    generatedAt: '2024-01-01T00:00:00.000Z',
    totalNodes: 4,
    maxDepth: 2
  },
  tree: {
    code: 'root',
    labels: {
      de: 'Gesamt',
      fr: 'Total',
      it: 'Totale',
      en: 'Total'
    },
    level: 0,
    hasValue: true,
    children: [
      {
        code: '3',
        labels: {
          de: 'Aufwand',
          fr: 'Charges',
          it: 'Spese',
          en: 'Expenses'
        },
        level: 1,
        hasValue: true,
        children: [
          {
            code: '30',
            labels: {
              de: 'Personalaufwand',
              fr: 'Charges de personnel',
              it: 'Spese del personale',
              en: 'Personnel expenses'
            },
            level: 2,
            hasValue: true,
            children: []
          }
        ]
      }
    ]
  }
};

const mockGdnData: GdnDataRecord[] = [
  {
    jahr: '2023',
    nr: '001',
    gemeinde: 'Test Municipality',
    konto: '30',
    betrag: '100000'
  },
  {
    jahr: '2023',
    nr: '001',
    gemeinde: 'Test Municipality',
    konto: '3',
    betrag: '50000'
  }
];

const mockAggregationResult: TreeAggregationResult = {
  aggregatedData: [
    {
      entityId: '001',
      entityName: 'Test Municipality',
      year: '2023',
      code: 'root',
      label: 'Gesamt',
      value: 150000,
      dimension: 'aufwand'
    },
    {
      entityId: '001',
      entityName: 'Test Municipality',
      year: '2023',
      code: '3',
      label: 'Aufwand',
      value: 150000,
      dimension: 'aufwand'
    },
    {
      entityId: '001',
      entityName: 'Test Municipality',
      year: '2023',
      code: '30',
      label: 'Personalaufwand',
      value: 100000,
      dimension: 'aufwand'
    }
  ],
  metadata: {
    treeStructure: mockTreeStructure,
    totalRecords: 2,
    processedAt: '2024-01-01T00:00:00.000Z',
    dimension: 'aufwand'
  }
};

describe('HierarchicalTreeTable', () => {
  let wrapper: VueWrapper;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock DataLoader
    const { DataLoader } = await import('../../utils/DataLoader');
    vi.mocked(DataLoader).mockImplementation(() => ({
      loadGdnData: vi.fn().mockResolvedValue({
        data: mockGdnData,
        metadata: {
          source: '/data/gdn/fs/001/2023.csv',
          loadedAt: '2024-01-01T00:00:00.000Z',
          recordCount: 2,
          entityId: '001',
          year: '2023',
          model: 'fs'
        }
      }),
      loadStdData: vi.fn().mockResolvedValue({
        data: [],
        metadata: {
          source: '/data/std/fs/001/2023.csv',
          loadedAt: '2024-01-01T00:00:00.000Z',
          recordCount: 0,
          entityId: '001',
          year: '2023'
        }
      })
    } as ReturnType<typeof DataLoader>));

    // Mock TreeAggregator
    const { TreeAggregator } = await import('../../utils/TreeAggregator');
    vi.mocked(TreeAggregator).mockImplementation(() => ({
      aggregateGdnData: vi.fn().mockResolvedValue(mockAggregationResult),
      aggregateStdData: vi.fn().mockResolvedValue(mockAggregationResult)
    } as ReturnType<typeof TreeAggregator>));
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Mounting', () => {
    it('should mount successfully with required props', () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.hierarchical-tree-table').exists()).toBe(true);
    });

    it('should display the title', () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023',
          title: 'Test Table'
        },
        global: {
          plugins: [i18n]
        }
      });

      expect(wrapper.find('.table-header h3').text()).toBe('Test Table');
    });

    it('should use default title when not provided', () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      expect(wrapper.find('.table-header h3').text()).toBe('Hierarchical Data Table');
    });
  });

  describe('Data Path Parsing', () => {
    it('should parse GDN data path correctly', async () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/fs/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for component to process the data path
      await wrapper.vm.$nextTick();

      const parsedPath = wrapper.vm.parsedDataPath;
      expect(parsedPath.type).toBe('gdn');
      expect(parsedPath.model).toBe('fs');
      expect(parsedPath.entityId).toBe('001');
      expect(parsedPath.year).toBe('2023');
    });

    it('should parse STD data path correctly', async () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'std/fs/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      await wrapper.vm.$nextTick();

      const parsedPath = wrapper.vm.parsedDataPath;
      expect(parsedPath.type).toBe('std');
      expect(parsedPath.model).toBe('fs');
      expect(parsedPath.entityId).toBe('001');
      expect(parsedPath.year).toBe('2023');
    });
  });

  describe('Controls', () => {
    beforeEach(async () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should render expand/collapse button', () => {
      const expandButton = wrapper.find('.expand-button');
      expect(expandButton.exists()).toBe(true);
      expect(expandButton.text()).toBe('Alle erweitern'); // Default locale is 'de'
    });

    it('should render show codes checkbox', () => {
      const showCodesCheckbox = wrapper.find('input[type="checkbox"]');
      expect(showCodesCheckbox.exists()).toBe(true);
    });

    it('should toggle expand all when button is clicked', async () => {
      const expandButton = wrapper.find('.expand-button');

      expect(expandButton.text()).toBe('Alle erweitern'); // Default locale is 'de'

      await expandButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(expandButton.text()).toBe('Alle einklappen'); // Default locale is 'de'
    });

    it('should toggle show codes when checkbox is clicked', async () => {
      const showCodesCheckbox = wrapper.find('input[type="checkbox"]');

      expect((showCodesCheckbox.element as HTMLInputElement).checked).toBe(false);

      await showCodesCheckbox.setValue(true);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.config.showCodes).toBe(true);
    });
  });

  describe('Table Rendering', () => {
    beforeEach(async () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should render table headers', () => {
      const headers = wrapper.findAll('.tree-table th');
      expect(headers).toHaveLength(2); // Label and Value columns (codes hidden by default)
      expect(headers[0].text()).toBe('Bezeichnung'); // German label
      expect(headers[1].text()).toBe('Wert'); // German value
    });

    it('should show code column when enabled', async () => {
      await wrapper.find('input[type="checkbox"]').setValue(true);
      await wrapper.vm.$nextTick();

      const headers = wrapper.findAll('.tree-table th');
      expect(headers).toHaveLength(3); // Label, Code, and Value columns
      expect(headers[1].text()).toBe('Code');
    });

    it('should render tree rows with proper hierarchy', () => {
      const rows = wrapper.findAll('.tree-row');
      expect(rows.length).toBeGreaterThan(0);

      // Check if rows have proper level classes
      const levelClasses = rows.map(row => {
        const classList = Array.from(row.element.classList);
        return classList.find(cls => cls.startsWith('level-'));
      });

      expect(levelClasses).toContain('level-0');
    });
  });

  describe('Row Expansion', () => {
    beforeEach(async () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should toggle row expansion when expand button is clicked', async () => {
      const expandToggle = wrapper.find('.expand-toggle');
      if (expandToggle.exists()) {
        const initialText = expandToggle.text();

        await expandToggle.trigger('click');
        await wrapper.vm.$nextTick();

        const newText = expandToggle.text();
        expect(newText).not.toBe(initialText);
      }
    });
  });

  describe('Value Formatting', () => {
    beforeEach(async () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should format numbers correctly', () => {
      const formatValue = wrapper.vm.formatValue;

      // Use regex to match the formatted number with any apostrophe character
      expect(formatValue(1000)).toMatch(/1.000/);
      expect(formatValue(1000000)).toMatch(/1.000.000/);
      expect(formatValue(null)).toBe('');
      expect(formatValue(undefined)).toBe('');
    });

    it('should include unit when provided', () => {
      const formatValue = wrapper.vm.formatValue;

      expect(formatValue(1000, 'CHF')).toMatch(/1.000 CHF/);
    });
  });

  describe('Language Support', () => {
    beforeEach(async () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should change header labels when language changes', async () => {
      // Initial state (de)
      let headers = wrapper.findAll('.tree-table th');
      expect(headers[0].text()).toBe('Bezeichnung');
      expect(headers[1].text()).toBe('Wert');

      // Change to French
      i18n.global.locale.value = 'fr';
      await wrapper.vm.$nextTick();
      // Adding a minimal timeout to ensure DOM updates related to i18n take effect
      await new Promise(resolve => setTimeout(resolve, 0));

      headers = wrapper.findAll('.tree-table th');
      expect(headers[0].text()).toBe('Libellé');
      expect(headers[1].text()).toBe('Valeur');
    });

    it('should provide correct header labels for all languages', async () => {
      const getHeaderLabel = wrapper.vm.getHeaderLabel;

      // Test German
      i18n.global.locale.value = 'de';
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(getHeaderLabel('label')).toBe('Bezeichnung');
      expect(getHeaderLabel('code')).toBe('Code');
      expect(getHeaderLabel('value')).toBe('Wert');

      // Test French
      i18n.global.locale.value = 'fr';
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(getHeaderLabel('label')).toBe('Libellé');
      expect(getHeaderLabel('code')).toBe('Code');
      expect(getHeaderLabel('value')).toBe('Valeur');

      // Test Italian
      i18n.global.locale.value = 'it';
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(getHeaderLabel('label')).toBe('Denominazione');
      expect(getHeaderLabel('code')).toBe('Codice');
      expect(getHeaderLabel('value')).toBe('Valore');

      // Test English
      i18n.global.locale.value = 'en';
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(getHeaderLabel('label')).toBe('Label');
      expect(getHeaderLabel('code')).toBe('Code');
      expect(getHeaderLabel('value')).toBe('Value');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      // Mock DataLoader to throw an error
      const { DataLoader } = await import('../../utils/DataLoader');
      vi.mocked(DataLoader).mockImplementation(() => ({
        loadGdnData: vi.fn().mockRejectedValue(new Error('Network error'))
      } as ReturnType<typeof DataLoader>));

      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for error to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.error').exists()).toBe(true);
      expect(wrapper.find('.error').text()).toContain('Network error');
    });

    it('should emit error event when data loading fails', async () => {
      // Mock DataLoader to throw an error
      const { DataLoader } = await import('../../utils/DataLoader');
      vi.mocked(DataLoader).mockImplementation(() => ({
        loadGdnData: vi.fn().mockRejectedValue(new Error('Test error'))
      } as ReturnType<typeof DataLoader>));

      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for error to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('error')).toBeTruthy();
      expect(wrapper.emitted('error')?.[0]).toEqual(['Test error']);
    });
  });

  describe('Events', () => {
    beforeEach(async () => {
      wrapper = mount(HierarchicalTreeTable, {
        props: {
          dataPath: 'gdn/001/2023'
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should emit dataLoaded event when data is successfully loaded', () => {
      expect(wrapper.emitted('dataLoaded')).toBeTruthy();
      expect(wrapper.emitted('dataLoaded')?.[0]?.[0]).toEqual(mockAggregationResult);
    });

    it('should emit rowToggled event when row is expanded/collapsed', async () => {
      const expandToggle = wrapper.find('.expand-toggle');
      if (expandToggle.exists()) {
        await expandToggle.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('rowToggled')).toBeTruthy();
      }
    });
  });
});
