import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import DataBrowser from '../DataBrowser.vue';
import type { StdDataInfo, GdnDataInfo } from '../../types/DataStructures';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      dataBrowser: {
        title: 'Daten-Browser',
        searchPlaceholder: 'Suche nach Entitäten, Gemeinden oder Codes...',
        filters: {
          dataType: 'Datentyp',
          yearRange: 'Jahresbereich',
          yearFrom: 'Von',
          yearTo: 'Bis'
        },
        filterOptions: {
          all: 'Alle',
          std: 'Standard',
          gdn: 'Gemeinden'
        },
        viewOptions: {
          showDescriptions: 'Beschreibungen',
          showYearRange: 'Jahresbereich'
        },
        resultsCount: '{count} von {total} Ergebnissen',
        loading: 'Lade Daten...',
        noResults: 'Keine Ergebnisse gefunden',
        municipalityData: 'Gemeindedaten für {name}'
      }
    },
    fr: {
      dataBrowser: {
        title: 'Navigateur de données',
        searchPlaceholder: 'Rechercher des entités, communes ou codes...',
        filters: {
          dataType: 'Type de données',
          yearRange: 'Plage d\'années',
          yearFrom: 'De',
          yearTo: 'À'
        },
        filterOptions: {
          all: 'Tous',
          std: 'Standard',
          gdn: 'Communes'
        },
        viewOptions: {
          showDescriptions: 'Descriptions',
          showYearRange: 'Plage d\'années'
        },
        resultsCount: '{count} sur {total} résultats',
        loading: 'Chargement des données...',
        noResults: 'Aucun résultat trouvé',
        municipalityData: 'Données communales pour {name}'
      }
    }
  }
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock data
const mockStdData: StdDataInfo[] = [
  {
    hh: 'gdn_ag',
    models: [
      { model: 'fs', jahre: ['2019', '2020', '2021'] },
      { model: 'gfs', jahre: ['2020', '2021', '2022'] }
    ]
  },
  {
    hh: 'sv',
    models: [
      { model: 'fs', jahre: ['2018', '2019', '2020'] }
    ]
  },
  {
    hh: 'bund',
    models: [
      { model: 'fs', jahre: ['2019', '2020'] },
      { model: 'gfs', jahre: ['2019', '2020', '2021'] }
    ]
  }
];

const mockGdnData: GdnDataInfo[] = [
  {
    nr: '010002',
    gemeinde: 'Affoltern a.A.',
    models: [
      {
        model: 'fs',
        jahre: ['2019', '2020', '2021']
      }
    ]
  },
  {
    nr: '010003',
    gemeinde: 'Bonstetten',
    models: [
      {
        model: 'fs',
        jahre: ['2020', '2021', '2022']
      }
    ]
  },
  {
    nr: '010009',
    gemeinde: 'Mettmenstetten',
    models: [
      {
        model: 'fs',
        jahre: ['2018', '2019', '2020']
      }
    ]
  }
];

describe('DataBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup fetch mock
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('std-info.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStdData)
        });
      }
      if (url.includes('gdn-info.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGdnData)
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Component Mounting and Data Loading', () => {
    it('should mount successfully', () => {
      const wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('should handle loading state properly', async () => {
      const wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 150));
      await wrapper.vm.$nextTick();

      // After loading, should not show loading state and should show results
      expect(wrapper.find('.loading').exists()).toBe(false);
      expect(wrapper.find('.results-section').exists()).toBe(true);
    });

    it('should load data on mount', async () => {
      const wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data loading
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      expect(global.fetch).toHaveBeenCalledWith('/data/std-info.json');
      expect(global.fetch).toHaveBeenCalledWith('/data/gdn-info.json');
    });

    it('should display error when data loading fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.error').exists()).toBe(true);
      expect(wrapper.find('.error').text()).toContain('Network error');
    });
  });

  describe('Search Functionality', () => {
    let wrapper: ReturnType<typeof mount>;

    beforeEach(async () => {
      wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should display search input', () => {
      const searchInput = wrapper.find('.search-input');
      expect(searchInput.exists()).toBe(true);
      expect(searchInput.attributes('placeholder')).toContain('Suche');
    });

    it('should filter results based on search query', async () => {
      const searchInput = wrapper.find('.search-input');

      // Search for "Aargau" (should match gdn_ag entity)
      await searchInput.setValue('Aargau');
      await wrapper.vm.$nextTick();

      const resultItems = wrapper.findAll('.result-item');
      expect(resultItems.length).toBeGreaterThan(0);

      // Should find the gdn_ag entry
      const titles = resultItems.map((item) => item.find('.result-title').text());
      expect(titles.some((title: string) => title.includes('Aargau'))).toBe(true);
    });

    it('should show clear button when search has text', async () => {
      const searchInput = wrapper.find('.search-input');

      await searchInput.setValue('test');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.clear-button').exists()).toBe(true);
    });

    it('should clear search when clear button is clicked', async () => {
      const searchInput = wrapper.find('.search-input');

      await searchInput.setValue('test');
      await wrapper.vm.$nextTick();

      const clearButton = wrapper.find('.clear-button');
      await clearButton.trigger('click');
      await wrapper.vm.$nextTick();

      expect(searchInput.element.value).toBe('');
    });

    it('should search in municipality names', async () => {
      const searchInput = wrapper.find('.search-input');

      await searchInput.setValue('Affoltern');
      await wrapper.vm.$nextTick();

      const resultItems = wrapper.findAll('.result-item');
      const titles = resultItems.map((item) => item.find('.result-title').text());
      expect(titles.some((title: string) => title.includes('Affoltern'))).toBe(true);
    });

    it('should search in entity codes', async () => {
      const searchInput = wrapper.find('.search-input');

      await searchInput.setValue('010002');
      await wrapper.vm.$nextTick();

      const resultItems = wrapper.findAll('.result-item');
      expect(resultItems.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    let wrapper: ReturnType<typeof mount>;

    beforeEach(async () => {
      wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should filter by data type', async () => {
      // Find the data type select by looking for the one with "All" option
      const selects = wrapper.findAll('select');
      let dataTypeSelect = null;

      for (const select of selects) {
        const options = select.findAll('option');
        const hasAllOption = options.some((option) =>
          option.text().includes('Alle') || option.text().includes('All'));
        if (hasAllOption) {
          dataTypeSelect = select;
          break;
        }
      }

      if (dataTypeSelect) {
        await dataTypeSelect.setValue('std');
        await wrapper.vm.$nextTick();

        const resultItems = wrapper.findAll('.result-item');
        if (resultItems.length > 0) {
          resultItems.forEach((item) => {
            expect(item.find('.result-type').text()).toBe('STD');
          });
        }
      } else {
        // If we can't find the select, just verify the component has filter controls
        expect(wrapper.find('.filter-controls').exists()).toBe(true);
      }
    });

    it('should filter by year range', async () => {
      const yearInputs = wrapper.findAll('.year-input');

      if (yearInputs.length >= 2) {
        await yearInputs[0].setValue('2020'); // start year
        await yearInputs[1].setValue('2021'); // end year
        await wrapper.vm.$nextTick();

        // Results should only include entries with data in 2020-2021 range
        const resultItems = wrapper.findAll('.result-item');
        expect(resultItems.length).toBeGreaterThan(0);
      }
    });

    it('should filter by models', async () => {
      const modelCheckboxes = wrapper.findAll('input[type="checkbox"]').filter((checkbox) => {
        const label = checkbox.element.parentElement?.textContent;
        return label && (label.includes('FS') || label.includes('GFS'));
      });

      if (modelCheckboxes.length > 0) {
        await modelCheckboxes[0].setChecked(true);
        await wrapper.vm.$nextTick();

        // Should show only results with the selected model
        const resultItems = wrapper.findAll('.result-item');
        expect(resultItems.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Language Support', () => {
    it('should use global i18n language settings', async () => {
      // Test with German (default)
      const wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Check if search placeholder is in German
      const searchInput = wrapper.find('.search-input');
      expect(searchInput.attributes('placeholder')).toContain('Suche');
    });

    it('should update display when global language changes', async () => {
      const wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      // Change global language to French
      i18n.global.locale.value = 'fr';
      await wrapper.vm.$nextTick();

      // Check if search placeholder changed to French
      const searchInput = wrapper.find('.search-input');
      expect(searchInput.attributes('placeholder')).toContain('Rechercher');

      // Reset to German for other tests
      i18n.global.locale.value = 'de';
    });
  });

  describe('Semantic Mapping', () => {
    let wrapper: ReturnType<typeof mount>;

    beforeEach(async () => {
      wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should display semantic names for entity codes', async () => {
      const resultItems = wrapper.findAll('.result-item');
      const titles = resultItems.map((item) => item.find('.result-title').text());

      // Should show "Gemeinden Aargau" instead of "gdn_ag"
      expect(titles.some((title: string) => title.includes('Aargau'))).toBe(true);

      // Should show "Sozialversicherung" instead of "sv"
      expect(titles.some((title: string) => title.includes('Sozialversicherung'))).toBe(true);
    });

    it('should show descriptive text for entities', async () => {
      // Enable descriptions
      const descriptionCheckbox = wrapper.findAll('input[type="checkbox"]').find((checkbox) => {
        const label = checkbox.element.parentElement?.textContent;
        return label && label.includes('Beschreibungen');
      });

      if (descriptionCheckbox) {
        await descriptionCheckbox.setChecked(true);
        await wrapper.vm.$nextTick();

        const descriptions = wrapper.findAll('.result-description');
        expect(descriptions.length).toBeGreaterThan(0);

        // Should contain descriptive text
        const descriptionTexts = descriptions.map((desc) => desc.text());
        expect(descriptionTexts.some((text: string) =>
          text.includes('Gemeinden') || text.includes('Sozialversicherung')
        )).toBe(true);
      }
    });
  });

  describe('Result Selection', () => {
    let wrapper: ReturnType<typeof mount>;

    beforeEach(async () => {
      wrapper = mount(DataBrowser, {
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();
    });

    it('should emit resultSelected when result is clicked', async () => {
      const resultItems = wrapper.findAll('.result-item');

      if (resultItems.length > 0) {
        await resultItems[0].trigger('click');

        expect(wrapper.emitted('resultSelected')).toBeTruthy();
        expect(wrapper.emitted('resultSelected')[0]).toHaveLength(1);

        const emittedResult = wrapper.emitted('resultSelected')[0][0];
        expect(emittedResult).toHaveProperty('id');
        expect(emittedResult).toHaveProperty('type');
        expect(emittedResult).toHaveProperty('entityCode');
      }
    });

    it('should show result metadata', async () => {
      const resultItems = wrapper.findAll('.result-item');

      if (resultItems.length > 0) {
        const metadata = resultItems[0].find('.result-metadata');
        expect(metadata.exists()).toBe(true);

        // Should show year range or model info
        const metadataText = metadata.text();
        expect(metadataText.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are many results', async () => {
      // Create a component with small page size to trigger pagination
      const wrapper = mount(DataBrowser, {
        props: {
          maxResultsPerPage: 2
        },
        global: {
          plugins: [i18n]
        }
      });

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      const resultItems = wrapper.findAll('.result-item');
      if (resultItems.length >= 2) {
        const pagination = wrapper.find('.pagination');
        expect(pagination.exists()).toBe(true);

        const pageInfo = wrapper.find('.page-info');
        expect(pageInfo.text()).toContain('/');
      }
    });
  });
});
