import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LanguageSelector from '../LanguageSelector.vue';

describe('LanguageSelector', () => {
  describe('basic rendering', () => {
    it('should mount without errors', () => {
      expect(() => {
        const wrapper = mount(LanguageSelector);
        expect(wrapper.exists()).toBe(true);
      }).not.toThrow();
    });

  });
});
