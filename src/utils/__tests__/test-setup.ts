import { vi, expect } from 'vitest';

/**
 * Test setup utilities for TreeAggregator tests
 */

// Mock IntersectionObserver for jsdom environment
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver for jsdom environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia for jsdom environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Create mock tree structure for testing
 */
export function createMockTreeStructure(dimension: string, model?: string) {
  return {
    metadata: {
      dimension,
      model,
      source: 'test',
      generatedAt: '2024-01-01T00:00:00.000Z',
      totalNodes: 3,
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
      children: [
        {
          code: '1',
          labels: {
            de: 'Kategorie 1',
            fr: 'Catégorie 1',
            it: 'Categoria 1',
            en: 'Category 1'
          },
          children: [
            {
              code: '10',
              labels: {
                de: 'Unterkategorie 10',
                fr: 'Sous-catégorie 10',
                it: 'Sottocategoria 10',
                en: 'Subcategory 10'
              },
              children: [],
              level: 2,
              hasValue: false,
              value: null
            }
          ],
          level: 1,
          hasValue: false,
          value: null
        }
      ],
      level: 0,
      hasValue: false,
      value: null
    }
  };
}

/**
 * Create mock GDN data for testing
 */
export function createMockGdnData(overrides: Partial<Record<string, unknown>>[] = []) {
  const defaultData = [
    {
      jahr: '2023',
      nr: '001',
      gemeinde: 'Test Municipality',
      konto: '10',
      betrag: '100000'
    },
    {
      jahr: '2023',
      nr: '001',
      gemeinde: 'Test Municipality',
      konto: '1',
      betrag: '50000'
    }
  ];

  return overrides.length > 0
    ? overrides.map((override, index) => ({ ...defaultData[index] || defaultData[0], ...override }))
    : defaultData;
}

/**
 * Create mock STD data for testing
 */
export function createMockStdData(overrides: Partial<Record<string, unknown>>[] = []) {
  const defaultData = [
    {
      arten: '10',
      funk: '',
      jahr: '2023',
      value: '100000',
      dim: 'test',
      hh: 'test_entity',
      unit: 'CHF',
      model: 'fs'
    },
    {
      arten: '1',
      funk: '',
      jahr: '2023',
      value: '50000',
      dim: 'test',
      hh: 'test_entity',
      unit: 'CHF',
      model: 'fs'
    }
  ];

  return overrides.length > 0
    ? overrides.map((override, index) => ({ ...defaultData[index] || defaultData[0], ...override }))
    : defaultData;
}

/**
 * Mock fetch response helper
 */
export function createMockFetchResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data))
  };
}

/**
 * Setup fetch mock for tree structure loading
 */
export function setupTreeStructureMock(mockFetch: any, treeStructures: Record<string, unknown>) {
  mockFetch.mockImplementation((url: string) => {
    const filename = url.split('/').pop();
    const key = filename?.replace('-tree.json', '') || '';

    if (treeStructures[key]) {
      return Promise.resolve(createMockFetchResponse(treeStructures[key]));
    }

    return Promise.resolve(createMockFetchResponse(null, false, 404));
  });
}

/**
 * Assert aggregated data structure
 */
export function assertAggregatedDataStructure(data: any[]) {
  expect(Array.isArray(data)).toBe(true);

  data.forEach(item => {
    expect(item).toHaveProperty('entityId');
    expect(item).toHaveProperty('year');
    expect(item).toHaveProperty('code');
    expect(item).toHaveProperty('label');
    expect(item).toHaveProperty('value');
    expect(item).toHaveProperty('dimension');
    expect(typeof item.value).toBe('number');
  });
}

/**
 * Assert tree aggregation result structure
 */
export function assertTreeAggregationResult(result: any) {
  expect(result).toHaveProperty('aggregatedData');
  expect(result).toHaveProperty('metadata');
  expect(Array.isArray(result.aggregatedData)).toBe(true);

  expect(result.metadata).toHaveProperty('treeStructure');
  expect(result.metadata).toHaveProperty('totalRecords');
  expect(result.metadata).toHaveProperty('processedAt');
  expect(result.metadata).toHaveProperty('dimension');

  assertAggregatedDataStructure(result.aggregatedData);
}
