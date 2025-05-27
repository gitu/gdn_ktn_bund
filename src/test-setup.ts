import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock CSS imports at the module level
vi.mock('*.css', () => ({}));
vi.mock('*.scss', () => ({}));
vi.mock('*.sass', () => ({}));
vi.mock('*.less', () => ({}));

// Mock specific Vuetify CSS files that are causing issues
vi.mock('/node_modules/vuetify/lib/components/VCode/VCode.css', () => ({}));

// Global test setup for Vue components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
if (!global.IntersectionObserver) {
  const MockIntersectionObserver = class {
    root = null;
    rootMargin = '0px';
    thresholds = [0];

    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };

  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// Mock window.matchMedia
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
