import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
global.localStorage = localStorageMock as Storage

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'en',
  messages: {
    de: {
      languageSelector: {
        selectLanguage: 'Sprache auswählen',
        currentLanguage: 'Aktuelle Sprache',
      },
      financialDataDisplay: {
        expandAll: 'Alle erweitern',
        collapseAll: 'Alle einklappen',
        showCodes: 'Codes anzeigen',
        hideCodes: 'Codes ausblenden',
        showZeroValues: 'Nullwerte anzeigen',
        hideZeroValues: 'Nullwerte ausblenden',
      },
    },
    en: {
      languageSelector: {
        selectLanguage: 'Select language',
        currentLanguage: 'Current language',
      },
      financialDataDisplay: {
        expandAll: 'Expand all',
        collapseAll: 'Collapse all',
        showCodes: 'Show codes',
        hideCodes: 'Hide codes',
        showZeroValues: 'Show zero values',
        hideZeroValues: 'Hide zero values',
      },
      financialDataComparison: {
        comparisonDescription: 'Comparing {count} selected datasets',
        openFullView: 'Open Full View',
        openFullViewTooltip: 'Opens the current comparison view in a dedicated full-screen mode',
      },
    },
    fr: {
      languageSelector: {
        selectLanguage: 'Sélectionner la langue',
        currentLanguage: 'Langue actuelle',
      },
    },
    it: {
      languageSelector: {
        selectLanguage: 'Seleziona lingua',
        currentLanguage: 'Lingua corrente',
      },
    },
  },
})

// Create a mock router for tests
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/financial-comparison', component: { template: '<div>Financial Comparison</div>' } },
    { path: '/financial-data/full-view', component: { template: '<div>Full View</div>' } },
  ],
})

// Configure Vue Test Utils global plugins
config.global.plugins = [
  [
    PrimeVue,
    {
      preset: Aura,
      options: {
        darkModeSelector: '.app-dark',
      },
    },
  ],
  i18n,
  mockRouter,
]

// Mock PrimeVue components globally
config.global.stubs = {
  Select: {
    name: 'Select',
    template:
      '<select data-testid="select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
    emits: ['update:modelValue'],
  },
  Button: {
    name: 'Button',
    template:
      '<button data-testid="button" @click="$emit(\'click\')" :disabled="disabled" :class="severity" :aria-label="ariaLabel" :aria-expanded="ariaExpanded" :aria-haspopup="ariaHaspopup" :aria-controls="ariaControls"><slot /></button>',
    props: [
      'icon',
      'severity',
      'disabled',
      'label',
      'size',
      'text',
      'outlined',
      'ariaLabel',
      'ariaExpanded',
      'ariaHaspopup',
      'ariaControls',
    ],
    emits: ['click'],
  },
  Menu: {
    name: 'Menu',
    template: '<div data-testid="menu"></div>',
    props: ['id', 'model', 'popup', 'class'],
    methods: {
      toggle() {},
      show() {},
      hide() {},
    },
  },
  InputText: {
    name: 'InputText',
    template:
      '<input data-testid="input-text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
  },
  TreeTable: {
    name: 'TreeTable',
    template: '<div data-testid="tree-table" class="mock-treetable"><slot /></div>',
    props: [
      'value',
      'expandedKeys',
      'scrollable',
      'scrollHeight',
      'resizableColumns',
      'columnResizeMode',
    ],
    emits: ['node-expand', 'node-collapse'],
  },
  Column: {
    name: 'Column',
    template: '<div data-testid="column" class="mock-column"><slot /></div>',
    props: ['field', 'header', 'expander', 'class'],
  },
  DataTable: {
    name: 'DataTable',
    template: '<div data-testid="data-table"><slot /></div>',
    props: [
      'value',
      'paginator',
      'rows',
      'rowsPerPageOptions',
      'paginatorTemplate',
      'currentPageReportTemplate',
      'scrollHeight',
      'scrollDirection',
    ],
  },
  Tag: {
    name: 'Tag',
    template: '<span data-testid="tag" :class="severity">{{ value }}</span>',
    props: ['value', 'severity', 'size'],
  },
  Message: {
    name: 'Message',
    template: '<div data-testid="message" :class="severity"><slot /></div>',
    props: ['severity', 'closable'],
  },
  ProgressSpinner: {
    name: 'ProgressSpinner',
    template: '<div data-testid="progress-spinner"></div>',
    props: ['size'],
  },
}
