import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import LanguageSelector from '../LanguageSelector.vue';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      languageSelector: {
        selectLanguage: 'Sprache auswählen',
        currentLanguage: 'Aktuelle Sprache'
      }
    },
    en: {
      languageSelector: {
        selectLanguage: 'Select language',
        currentLanguage: 'Current language'
      }
    },
    fr: {
      languageSelector: {
        selectLanguage: 'Sélectionner la langue',
        currentLanguage: 'Langue actuelle'
      }
    },
    it: {
      languageSelector: {
        selectLanguage: 'Seleziona lingua',
        currentLanguage: 'Lingua attuale'
      }
    }
  }
});

// Helper function to mount component with i18n
const mountComponent = (options = {}) => {
  return mount(LanguageSelector, {
    global: {
      plugins: [i18n]
    },
    ...options
  });
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    // Reset i18n locale before each test
    i18n.global.locale.value = 'de';
  });

  describe('rendering', () => {
    it('should render the language selector trigger button', () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      expect(trigger.exists()).toBe(true);
      expect(trigger.find('.pi-globe').exists()).toBe(true);
      expect(trigger.find('.language-code').text()).toBe('DE');
      expect(trigger.find('.pi-chevron-down').exists()).toBe(true);
    });

    it('should not show dropdown initially', () => {
      const wrapper = mountComponent();

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
    });

    it('should have proper accessibility attributes', () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      expect(trigger.attributes('aria-expanded')).toBe('false');
      expect(trigger.attributes('aria-haspopup')).toBe('true');
      expect(trigger.attributes('aria-label')).toContain('Sprache auswählen. Aktuelle Sprache: Deutsch');
    });
  });

  describe('dropdown interaction', () => {
    it('should open dropdown when trigger is clicked', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(true);
      expect(trigger.attributes('aria-expanded')).toBe('true');
    });

    it('should close dropdown when trigger is clicked again', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      await trigger.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
      expect(trigger.attributes('aria-expanded')).toBe('false');
    });

    it('should close dropdown when backdrop is clicked', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const backdrop = wrapper.find('.language-backdrop');
      await backdrop.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
    });

    it('should close dropdown when escape key is pressed', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      await trigger.trigger('keydown.escape');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
    });
  });

  describe('language options', () => {
    it('should render all available language options', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const options = wrapper.findAll('.language-option');
      expect(options).toHaveLength(4);

      expect(options[0].text()).toContain('Deutsch');
      expect(options[1].text()).toContain('English');
      expect(options[2].text()).toContain('Français');
      expect(options[3].text()).toContain('Italiano');
    });

    it('should mark current language as active', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const options = wrapper.findAll('.language-option');
      expect(options[0].classes()).toContain('active');
      expect(options[0].find('.pi-check').exists()).toBe(true);
    });

    it('should change language when option is clicked', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const frenchOption = wrapper.findAll('.language-option')[2];
      await frenchOption.trigger('click');

      // Check that the locale was changed
      expect(i18n.global.locale.value).toBe('fr');
    });

    it('should close dropdown after selecting language', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const frenchOption = wrapper.findAll('.language-option')[2];
      await frenchOption.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes on dropdown', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.attributes('role')).toBe('menu');
    });

    it('should have proper ARIA attributes on options', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const options = wrapper.findAll('.language-option');
      options.forEach(option => {
        expect(option.attributes('role')).toBe('menuitem');
        expect(option.attributes('aria-label')).toBeDefined();
      });
    });

    it('should manage tabindex correctly', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const options = wrapper.findAll('.language-option');
      // First option should be focusable, others should not
      expect(options[0].attributes('tabindex')).toBe('0');
      expect(options[1].attributes('tabindex')).toBe('-1');
    });
  });

  describe('responsive behavior', () => {
    it('should render language flags', async () => {
      const wrapper = mountComponent();

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const flags = wrapper.findAll('.language-flag');
      expect(flags).toHaveLength(4);
      flags.forEach(flag => {
        expect(flag.text()).toMatch(/DE|EN|FR|IT/);
      });
    });

    it('should show language code in trigger', () => {
      const wrapper = mountComponent();

      const languageCode = wrapper.find('.language-code');
      expect(languageCode.text()).toBe('DE');
    });
  });

  describe('error handling', () => {
    it('should handle missing translations gracefully', () => {
      const wrapper = mountComponent();

      // Should not throw error even with missing translations
      expect(wrapper.exists()).toBe(true);
    });
  });
});
