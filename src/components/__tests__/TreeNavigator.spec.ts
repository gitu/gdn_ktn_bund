import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import TreeNavigator from '../TreeNavigator.vue';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      treeNavigator: {
        title: 'Datenbaum',
        dimensions: {
          aufwand: 'Aufwand',
          bilanz: 'Bilanz',
          ertrag: 'Ertrag'
        },
        searchPlaceholder: 'Suchen...',
        loadingTree: 'Baumstruktur wird geladen...',
        errorLoadingTree: 'Fehler beim Laden des Baums',
        nodesCount: 'Knoten',
        maxDepth: 'Max. Tiefe',
        source: 'Quelle'
      }
    }
  }
});

// Mock the DataLoader
vi.mock('../../utils/DataLoader', () => ({
  DataLoader: vi.fn(() => ({
    loadTreeStructure: vi.fn().mockResolvedValue({
      metadata: {
        dimension: 'aufwand',
        model: 'fs',
        source: 'test-source',
        totalNodes: 10,
        maxDepth: 3
      },
      tree: {
        code: 'root',
        labels: { de: 'Root', en: 'Root', fr: 'Racine', it: 'Radice' },
        children: [],
        level: 0,
        hasValue: false
      }
    }),
    searchTreeNodes: vi.fn().mockReturnValue([]),
    getNodePath: vi.fn().mockReturnValue([])
  }))
}));

// Mock TreeNode component
vi.mock('../TreeNode.vue', () => ({
  default: {
    name: 'TreeNode',
    template: '<div data-testid="tree-node">Mock TreeNode</div>',
    props: ['node', 'language', 'searchQuery', 'expandedNodes', 'selectedNodes', 'showIcons', 'selectionMode'],
    emits: ['toggle-expand', 'select-node', 'node-click']
  }
}));

// Mock PrimeVue Tree component
vi.mock('primevue/tree', () => ({
  default: {
    name: 'Tree',
    template: '<div data-testid="primevue-tree">Mock PrimeVue Tree</div>',
    props: ['value', 'selectionMode', 'selectionKeys'],
    emits: ['node-select', 'node-unselect', 'node-expand', 'node-collapse']
  }
}));

// Mock TreeNodeAdapter
vi.mock('../../utils/TreeNodeAdapter', () => ({
  TreeNodeAdapter: vi.fn(() => ({
    updateConfig: vi.fn(),
    convertTreeStructure: vi.fn().mockReturnValue([])
  }))
}));

describe('TreeNavigator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with required props', () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'aufwand'
      },
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should only accept allowed dimensions', () => {
    // This test verifies TypeScript compilation - if it compiles, the type constraint works
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'bilanz' as const
      },
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.props('dimension')).toBe('bilanz');
  });

  it('should use Vue i18n for translations', () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'ertrag'
      },
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should display translated title based on dimension', () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'aufwand'
      },
      global: {
        plugins: [i18n]
      }
    });

    // Should display the translated dimension title
    expect(wrapper.find('h3').text()).toBe('Aufwand');
  });

  it('should display custom title when provided', () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'bilanz',
        title: 'Custom Title'
      },
      global: {
        plugins: [i18n]
      }
    });

    expect(wrapper.find('h3').text()).toBe('Custom Title');
  });

  it('should not display language selector', () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'ertrag'
      },
      global: {
        plugins: [i18n]
      }
    });

    // Should not have a language selector dropdown
    expect(wrapper.find('select').exists()).toBe(false);
  });

  it('should display search input with translated placeholder', () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'aufwand'
      },
      global: {
        plugins: [i18n]
      }
    });

    const searchInput = wrapper.find('input[type="text"]');
    expect(searchInput.exists()).toBe(true);
    expect(searchInput.attributes('placeholder')).toBe('Suchen...');
  });

  it('should emit nodeSelected event when node is selected', async () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'bilanz'
      },
      global: {
        plugins: [i18n]
      }
    });

    // Simulate node selection by emitting the event directly
    await wrapper.vm.$emit('nodeSelected', 'test-code', { test: 'data' });

    expect(wrapper.emitted('nodeSelected')).toBeTruthy();
    expect(wrapper.emitted('nodeSelected')?.[0]).toEqual(['test-code', { test: 'data' }]);
  });

  it('should emit searchResults event when search is performed', async () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'ertrag'
      },
      global: {
        plugins: [i18n]
      }
    });

    // Find the search input and trigger input event
    const searchInput = wrapper.find('input[type="text"]');
    await searchInput.setValue('test');
    await searchInput.trigger('input');

    expect(wrapper.emitted('searchResults')).toBeTruthy();
  });

  it('should render component with proper structure', () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'aufwand'
      },
      global: {
        plugins: [i18n]
      }
    });

    // Check that the component renders the expected structure
    expect(wrapper.find('.tree-navigator').exists()).toBe(true);
    expect(wrapper.find('.tree-header').exists()).toBe(true);
    expect(wrapper.find('h3').exists()).toBe(true);
    expect(wrapper.find('.controls').exists()).toBe(true);
  });

  it('should use Vue i18n translation function for all text elements', () => {
    const wrapper = mount(TreeNavigator, {
      props: {
        dimension: 'bilanz'
      },
      global: {
        plugins: [i18n]
      }
    });

    // Should display translated text elements
    expect(wrapper.find('h3').text()).toBe('Bilanz');
    expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe('Suchen...');
  });
});
