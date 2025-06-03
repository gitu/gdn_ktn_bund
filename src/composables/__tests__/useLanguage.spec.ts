import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLanguage, LANGUAGE_OPTIONS, resetGlobalLanguageState, type SupportedLanguage } from '../useLanguage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Reset global state before each test
    resetGlobalLanguageState();
  });

  describe('initialization', () => {
    it('should initialize with German as default language', () => {
      const { currentLanguage } = useLanguage();
      expect(currentLanguage.value).toBe('de');
    });

    it('should load language from localStorage if available', () => {
      localStorageMock.getItem.mockReturnValue('fr');
      const { currentLanguage } = useLanguage();
      expect(currentLanguage.value).toBe('fr');
    });

    it('should fallback to German if localStorage contains invalid language', () => {
      localStorageMock.getItem.mockReturnValue('invalid');
      const { currentLanguage } = useLanguage();
      expect(currentLanguage.value).toBe('de');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { currentLanguage } = useLanguage();
      
      expect(currentLanguage.value).toBe('de');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load language preference from localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('setLanguage', () => {
    it('should set a valid language', () => {
      const { setLanguage, currentLanguage } = useLanguage();
      
      setLanguage('fr');
      expect(currentLanguage.value).toBe('fr');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('gdn-app-language', 'fr');
    });

    it('should not set an invalid language', () => {
      const { setLanguage, currentLanguage } = useLanguage();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      setLanguage('invalid' as SupportedLanguage);
      expect(currentLanguage.value).toBe('de');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Unsupported language: invalid');
      
      consoleSpy.mockRestore();
    });

    it('should handle localStorage save errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { setLanguage, currentLanguage } = useLanguage();
      
      setLanguage('fr');
      expect(currentLanguage.value).toBe('fr');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save language preference to localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getTranslation', () => {
    it('should return translation for current language', () => {
      const { getTranslation, setLanguage } = useLanguage();
      const translations = {
        de: 'Hallo',
        en: 'Hello',
        fr: 'Bonjour',
        it: 'Ciao'
      };

      setLanguage('fr');
      expect(getTranslation(translations)).toBe('Bonjour');
    });

    it('should fallback to German if current language is not available', () => {
      const { getTranslation, setLanguage } = useLanguage();
      const translations = {
        de: 'Hallo',
        en: 'Hello',
        fr: '',
        it: 'Ciao'
      };

      setLanguage('fr');
      expect(getTranslation(translations)).toBe('Hallo');
    });

    it('should return fallback if provided and no translation available', () => {
      const { getTranslation, setLanguage } = useLanguage();
      const translations = {
        de: '',
        en: '',
        fr: '',
        it: ''
      };

      setLanguage('fr');
      expect(getTranslation(translations, 'Fallback')).toBe('Fallback');
    });

    it('should return first available translation if no fallback provided', () => {
      const { getTranslation, setLanguage } = useLanguage();
      const translations = {
        de: '',
        en: 'Hello',
        fr: '',
        it: ''
      };

      setLanguage('fr');
      expect(getTranslation(translations)).toBe('Hello');
    });

    it('should return empty string if no translations available', () => {
      const { getTranslation, setLanguage } = useLanguage();
      const translations = {
        de: '',
        en: '',
        fr: '',
        it: ''
      };

      setLanguage('fr');
      expect(getTranslation(translations)).toBe('');
    });
  });

  describe('currentLanguageOption', () => {
    it('should return correct language option for current language', () => {
      const { currentLanguageOption, setLanguage } = useLanguage();
      
      setLanguage('fr');
      expect(currentLanguageOption.value).toEqual({
        code: 'fr',
        label: 'French',
        nativeLabel: 'Français'
      });
    });

    it('should return German option as fallback', () => {
      const { currentLanguageOption } = useLanguage();
      expect(currentLanguageOption.value).toEqual({
        code: 'de',
        label: 'German',
        nativeLabel: 'Deutsch'
      });
    });
  });

  describe('availableLanguages', () => {
    it('should return all available language options', () => {
      const { availableLanguages } = useLanguage();
      expect(availableLanguages).toEqual(LANGUAGE_OPTIONS);
      expect(availableLanguages).toHaveLength(4);
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      const { isLanguageSupported } = useLanguage();
      
      expect(isLanguageSupported('de')).toBe(true);
      expect(isLanguageSupported('en')).toBe(true);
      expect(isLanguageSupported('fr')).toBe(true);
      expect(isLanguageSupported('it')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      const { isLanguageSupported } = useLanguage();
      
      expect(isLanguageSupported('es')).toBe(false);
      expect(isLanguageSupported('zh')).toBe(false);
      expect(isLanguageSupported('')).toBe(false);
      expect(isLanguageSupported('invalid')).toBe(false);
    });
  });

  describe('reactivity', () => {
    it('should update currentLanguageOption when language changes', () => {
      const { setLanguage, currentLanguageOption } = useLanguage();
      
      expect(currentLanguageOption.value.code).toBe('de');
      
      setLanguage('it');
      expect(currentLanguageOption.value.code).toBe('it');
      expect(currentLanguageOption.value.nativeLabel).toBe('Italiano');
    });
  });
});
