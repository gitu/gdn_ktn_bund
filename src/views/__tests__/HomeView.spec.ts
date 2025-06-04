import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import HomeView from '../HomeView.vue';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      homeView: {
        title: 'Schweizer Finanzdaten-Baum-Navigator',
        subtitle: 'Erkunden Sie hierarchische Finanzdatenstrukturen für Schweizer Gemeinden und Kantone',
        dimensionLabel: 'Dimension:',
        dimensions: {
          ertrag: 'Ertrag (Einnahmen)',
          aufwand: 'Aufwand (Ausgaben)',
          bilanz: 'Bilanz (Bilanz)'
        },
        selectedNode: 'Ausgewählter Knoten',
        code: 'Code',
        searchResults: 'Suchergebnisse',
        moreResults: '... und {{count}} weitere Ergebnisse',
        aboutTitle: 'Über die Baumstruktur',
        aboutDescription: 'Dieser Baum-Navigator zeigt die hierarchische Struktur der Schweizer Finanzdaten an.',
        aboutItems: {
          ertrag: 'Einnahmen- und Ertragskategorien',
          aufwand: 'Ausgaben- und Kostenkategorien',
          bilanz: 'Bilanzpositionen (Aktiva und Passiva)'
        },
        aboutFooter: 'Jeder Knoten zeigt den Kontocode, mehrsprachige Bezeichnungen und verfügbare Werte an.'
      },
      treeNavigator: {
        dimensions: {
          bilanz: 'Bilanz',
          aufwand: 'Aufwand',
          ertrag: 'Ertrag'
        }
      }
    },
    en: {
      homeView: {
        title: 'Swiss Financial Data Tree Navigator',
        subtitle: 'Explore hierarchical financial data structures for Swiss municipalities and cantons',
        dimensionLabel: 'Dimension:',
        dimensions: {
          ertrag: 'Revenue (Income)',
          aufwand: 'Expenditure (Costs)',
          bilanz: 'Balance Sheet'
        },
        selectedNode: 'Selected Node',
        code: 'Code',
        searchResults: 'Search Results',
        moreResults: '... and {{count}} more results',
        aboutTitle: 'About the Tree Structure',
        aboutDescription: 'This tree navigator displays the hierarchical structure of Swiss financial data.',
        aboutItems: {
          ertrag: 'Revenue and income categories',
          aufwand: 'Expenditure and cost categories',
          bilanz: 'Balance sheet items (assets and liabilities)'
        },
        aboutFooter: 'Each node shows the account code, multilingual labels, and values where available.'
      },
      treeNavigator: {
        dimensions: {
          bilanz: 'Balance Sheet',
          aufwand: 'Expenditure',
          ertrag: 'Revenue'
        }
      }
    }
  }
});

describe('HomeView i18n Integration', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    // Reset i18n locale
    i18n.global.locale.value = 'de';

    // Mount the component with i18n
    wrapper = mount(HomeView, {
      global: {
        plugins: [i18n],
        stubs: {
          TreeNavigator: {
            template: '<div data-testid="tree-navigator">TreeNavigator Mock</div>',
            props: ['dimension', 'title']
          }
        }
      }
    });
  });

  describe('German translations', () => {
    it('should display German title and subtitle', () => {
      const title = wrapper.find('h1');
      const subtitle = wrapper.find('p');
      
      expect(title.text()).toBe('Schweizer Finanzdaten-Baum-Navigator');
      expect(subtitle.text()).toBe('Erkunden Sie hierarchische Finanzdatenstrukturen für Schweizer Gemeinden und Kantone');
    });

    it('should display German dimension label', () => {
      const label = wrapper.find('label[for="dimension-select"]');
      expect(label.text()).toBe('Dimension:');
    });

    it('should display German dimension options', () => {
      const select = wrapper.find('#dimension-select');
      const options = select.findAll('option');
      
      expect(options).toHaveLength(3);
      expect(options[0].text()).toBe('Ertrag (Einnahmen)');
      expect(options[1].text()).toBe('Aufwand (Ausgaben)');
      expect(options[2].text()).toBe('Bilanz (Bilanz)');
    });

    it('should display German about section', () => {
      const aboutTitle = wrapper.find('.info-box h3');
      expect(aboutTitle.text()).toBe('Über die Baumstruktur');
    });
  });

  describe('English translations', () => {
    beforeEach(async () => {
      i18n.global.locale.value = 'en';
      await wrapper.vm.$nextTick();
    });

    it('should display English title and subtitle', () => {
      const title = wrapper.find('h1');
      const subtitle = wrapper.find('p');
      
      expect(title.text()).toBe('Swiss Financial Data Tree Navigator');
      expect(subtitle.text()).toBe('Explore hierarchical financial data structures for Swiss municipalities and cantons');
    });

    it('should display English dimension label', () => {
      const label = wrapper.find('label[for="dimension-select"]');
      expect(label.text()).toBe('Dimension:');
    });

    it('should display English dimension options', () => {
      const select = wrapper.find('#dimension-select');
      const options = select.findAll('option');
      
      expect(options).toHaveLength(3);
      expect(options[0].text()).toBe('Revenue (Income)');
      expect(options[1].text()).toBe('Expenditure (Costs)');
      expect(options[2].text()).toBe('Balance Sheet');
    });

    it('should display English about section', () => {
      const aboutTitle = wrapper.find('.info-box h3');
      expect(aboutTitle.text()).toBe('About the Tree Structure');
    });
  });

  describe('Reactive dimension labels', () => {
    it('should update dimension options when language changes', async () => {
      // Start with German
      let select = wrapper.find('#dimension-select');
      let options = select.findAll('option');
      expect(options[0].text()).toBe('Ertrag (Einnahmen)');

      // Switch to English
      i18n.global.locale.value = 'en';
      await wrapper.vm.$nextTick();

      select = wrapper.find('#dimension-select');
      options = select.findAll('option');
      expect(options[0].text()).toBe('Revenue (Income)');
    });
  });

  describe('Component functionality', () => {
    it('should render TreeNavigator component', () => {
      const treeNavigator = wrapper.find('[data-testid="tree-navigator"]');
      expect(treeNavigator.exists()).toBe(true);
    });

    it('should allow dimension selection', async () => {
      const select = wrapper.find('#dimension-select');
      
      // Change to 'aufwand'
      await select.setValue('aufwand');
      
      expect(wrapper.vm.selectedDimension).toBe('aufwand');
    });
  });
});
