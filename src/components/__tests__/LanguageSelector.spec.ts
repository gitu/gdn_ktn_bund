import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed } from 'vue';
import LanguageSelector from '../LanguageSelector.vue';
import { useLanguage, type SupportedLanguage } from '@/composables/useLanguage';

// Mock the useLanguage composable
vi.mock('@/composables/useLanguage', () => ({
  useLanguage: vi.fn()
}));

const mockUseLanguage = vi.mocked(useLanguage);

describe('LanguageSelector', () => {
  const mockLanguageComposable = {
    currentLanguage: computed(() => 'de' as SupportedLanguage),
    currentLanguageOption: computed(() => ({
      code: 'de' as const,
      label: 'German',
      nativeLabel: 'Deutsch'
    })),
    availableLanguages: [
      { code: 'de' as SupportedLanguage, label: 'German', nativeLabel: 'Deutsch' },
      { code: 'en' as SupportedLanguage, label: 'English', nativeLabel: 'English' },
      { code: 'fr' as SupportedLanguage, label: 'French', nativeLabel: 'Français' },
      { code: 'it' as SupportedLanguage, label: 'Italian', nativeLabel: 'Italiano' }
    ],
    setLanguage: vi.fn(),
    getTranslation: vi.fn((translations) => translations.de || 'Default'),
    isLanguageSupported: vi.fn((language: string): language is SupportedLanguage => ['de', 'en', 'fr', 'it'].includes(language))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLanguage.mockReturnValue(mockLanguageComposable as unknown as ReturnType<typeof useLanguage>);
  });

  describe('rendering', () => {
    it('should render the language selector trigger button', () => {
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      expect(trigger.exists()).toBe(true);
      expect(trigger.find('.pi-globe').exists()).toBe(true);
      expect(trigger.find('.language-code').text()).toBe('DE');
      expect(trigger.find('.pi-chevron-down').exists()).toBe(true);
    });

    it('should not show dropdown initially', () => {
      const wrapper = mount(LanguageSelector);

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
    });

    it('should have proper accessibility attributes', () => {
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      expect(trigger.attributes('aria-expanded')).toBe('false');
      expect(trigger.attributes('aria-haspopup')).toBe('true');
      expect(trigger.attributes('aria-label')).toContain('Sprache auswählen. Aktuelle Sprache: Deutsch');
    });
  });

  describe('dropdown interaction', () => {
    it('should open dropdown when trigger is clicked', async () => {
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(true);
      expect(trigger.attributes('aria-expanded')).toBe('true');
    });

    it('should close dropdown when trigger is clicked again', async () => {
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      await trigger.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
      expect(trigger.attributes('aria-expanded')).toBe('false');
    });

    it('should close dropdown when backdrop is clicked', async () => {
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const backdrop = wrapper.find('.language-backdrop');
      await backdrop.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
    });

    it('should close dropdown when escape key is pressed', async () => {
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      await trigger.trigger('keydown.escape');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.isVisible()).toBe(false);
    });
  });

  describe('language options', () => {
    it('should render all available language options', async () => {
      const wrapper = mount(LanguageSelector);

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
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const options = wrapper.findAll('.language-option');
      expect(options[0].classes()).toContain('active');
      expect(options[0].find('.pi-check').exists()).toBe(true);
    });

    it('should call setLanguage when option is clicked', async () => {
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const frenchOption = wrapper.findAll('.language-option')[2];
      await frenchOption.trigger('click');

      expect(mockLanguageComposable.setLanguage).toHaveBeenCalledWith('fr');
    });

    it('should close dropdown after selecting language', async () => {
      const wrapper = mount(LanguageSelector);

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
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const dropdown = wrapper.find('.language-dropdown');
      expect(dropdown.attributes('role')).toBe('menu');
    });

    it('should have proper ARIA attributes on options', async () => {
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const options = wrapper.findAll('.language-option');
      options.forEach(option => {
        expect(option.attributes('role')).toBe('menuitem');
        expect(option.attributes('aria-label')).toBeDefined();
      });
    });

    it('should manage tabindex correctly', async () => {
      const wrapper = mount(LanguageSelector);

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
      const wrapper = mount(LanguageSelector);

      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');

      const flags = wrapper.findAll('.language-flag');
      expect(flags).toHaveLength(4);
      flags.forEach(flag => {
        expect(flag.text()).toMatch(/DE|EN|FR|IT/);
      });
    });

    it('should show language code in trigger', () => {
      const wrapper = mount(LanguageSelector);

      const languageCode = wrapper.find('.language-code');
      expect(languageCode.text()).toBe('DE');
    });
  });

  describe('error handling', () => {
    it('should handle missing translations gracefully', () => {
      mockLanguageComposable.getTranslation.mockReturnValue('');

      const wrapper = mount(LanguageSelector);

      // Should not throw error even with empty translations
      expect(wrapper.exists()).toBe(true);
    });
  });
});
