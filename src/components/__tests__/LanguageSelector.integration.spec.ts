import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LanguageSelector from '../LanguageSelector.vue';
import { resetGlobalLanguageState } from '@/composables/useLanguage';

describe('LanguageSelector Integration', () => {
  let wrapper: any;

  beforeEach(() => {
    // Reset global language state before each test
    resetGlobalLanguageState();
    // Clear localStorage before each test
    localStorage.clear();

    // Mount the component without mocking useLanguage
    wrapper = mount(LanguageSelector);
  });

  describe('Real functionality', () => {
    it('should render with default German language', () => {
      const trigger = wrapper.find('.language-trigger');
      expect(trigger.exists()).toBe(true);
      expect(trigger.find('.language-code').text()).toBe('DE');
    });

    it('should show dropdown when clicked', async () => {
      const trigger = wrapper.find('.language-trigger');

      // Initially dropdown should be hidden
      expect(wrapper.find('.language-dropdown').exists()).toBe(true);
      expect(trigger.attributes('aria-expanded')).toBe('false');

      // Click to open dropdown
      await trigger.trigger('click');
      await nextTick();

      // Dropdown should now be visible (check aria-expanded instead of CSS visibility)
      expect(trigger.attributes('aria-expanded')).toBe('true');
      expect(wrapper.find('.language-dropdown').exists()).toBe(true);
    });

    it('should display all language options', async () => {
      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      
      const options = wrapper.findAll('.language-option');
      expect(options).toHaveLength(4);
      
      // Check that all expected languages are present
      const languageTexts = options.map((option: any) => option.text());
      expect(languageTexts.some((text: string) => text.includes('Deutsch'))).toBe(true);
      expect(languageTexts.some((text: string) => text.includes('English'))).toBe(true);
      expect(languageTexts.some((text: string) => text.includes('Français'))).toBe(true);
      expect(languageTexts.some((text: string) => text.includes('Italiano'))).toBe(true);
    });

    it('should change language when option is selected', async () => {
      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      
      // Find and click the French option
      const options = wrapper.findAll('.language-option');
      const frenchOption = options.find((option: any) => 
        option.text().includes('Français')
      );
      
      expect(frenchOption).toBeDefined();
      await frenchOption!.trigger('click');
      
      // Wait for reactivity to update
      await nextTick();
      
      // Language code should now show FR
      expect(trigger.find('.language-code').text()).toBe('FR');
      
      // Dropdown should be closed
      expect(wrapper.find('.language-dropdown').isVisible()).toBe(false);
    });

    it('should persist language selection in localStorage', async () => {
      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      
      // Select Italian
      const options = wrapper.findAll('.language-option');
      const italianOption = options.find((option: any) => 
        option.text().includes('Italiano')
      );
      
      await italianOption!.trigger('click');
      await nextTick();
      
      // Check localStorage
      expect(localStorage.getItem('gdn-app-language')).toBe('it');
    });

    it('should load language from localStorage on mount', async () => {
      // Reset global state and set French in localStorage
      resetGlobalLanguageState();
      localStorage.setItem('gdn-app-language', 'fr');

      // Mount a new component instance
      const newWrapper = mount(LanguageSelector);
      await nextTick();

      // Should show French
      expect(newWrapper.find('.language-code').text()).toBe('FR');
    });

    it('should show language flags', async () => {
      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      await nextTick();

      const flags = wrapper.findAll('.language-flag');
      expect(flags).toHaveLength(4);

      // Check that flags contain text codes (not emoji)
      const flagTexts = flags.map((flag: any) => flag.text());
      expect(flagTexts.some((text: string) => text.includes('DE'))).toBe(true);
      expect(flagTexts.some((text: string) => text.includes('EN'))).toBe(true);
      expect(flagTexts.some((text: string) => text.includes('FR'))).toBe(true);
      expect(flagTexts.some((text: string) => text.includes('IT'))).toBe(true);
    });

    it('should close dropdown when clicking outside', async () => {
      const trigger = wrapper.find('.language-trigger');
      await trigger.trigger('click');
      await nextTick();

      // Dropdown should be open
      expect(trigger.attributes('aria-expanded')).toBe('true');

      // Click the backdrop
      const backdrop = wrapper.find('.language-backdrop');
      await backdrop.trigger('click');
      await nextTick();

      // Dropdown should be closed
      expect(trigger.attributes('aria-expanded')).toBe('false');
    });

    it('should have proper accessibility attributes', () => {
      const trigger = wrapper.find('.language-trigger');
      
      expect(trigger.attributes('aria-expanded')).toBe('false');
      expect(trigger.attributes('aria-haspopup')).toBe('true');
      expect(trigger.attributes('aria-label')).toBeDefined();
    });

    it('should update accessibility attributes when dropdown opens', async () => {
      const trigger = wrapper.find('.language-trigger');
      
      // Initially closed
      expect(trigger.attributes('aria-expanded')).toBe('false');
      
      // Open dropdown
      await trigger.trigger('click');
      
      // Should be expanded
      expect(trigger.attributes('aria-expanded')).toBe('true');
    });
  });
});
