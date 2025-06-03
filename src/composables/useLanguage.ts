import { ref, computed, watch, type Ref } from 'vue';
import type { MultiLanguageLabels } from '@/types/DataStructures';

export type SupportedLanguage = 'de' | 'en' | 'fr' | 'it';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

// Available language options
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' }
];

// Storage key for localStorage
const STORAGE_KEY = 'gdn-app-language';

// Global language state - initialized once
let globalLanguageState: {
  currentLanguage: Ref<SupportedLanguage>;
  initialized: boolean;
} | null = null;

/**
 * Reset global state (for testing)
 */
export const resetGlobalLanguageState = (): void => {
  globalLanguageState = null;
};

/**
 * Initialize global language state
 */
const initializeGlobalState = (): void => {
  if (globalLanguageState) return;

  const currentLanguage = ref<SupportedLanguage>('de');

  // Initialize language from localStorage or default to German
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LANGUAGE_OPTIONS.some(opt => opt.code === stored)) {
        currentLanguage.value = stored as SupportedLanguage;
      }
    }
  } catch (error) {
    console.warn('Failed to load language preference from localStorage:', error);
  }

  globalLanguageState = {
    currentLanguage,
    initialized: true
  };
};

/**
 * Global language management composable
 * Provides centralized language state with localStorage persistence
 */
export function useLanguage() {
  // Ensure global state is initialized
  initializeGlobalState();

  const { currentLanguage } = globalLanguageState!;

  // Save language preference to localStorage
  const saveLanguagePreference = (language: SupportedLanguage): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, language);
      }
    } catch (error) {
      console.warn('Failed to save language preference to localStorage:', error);
    }
  };

  // Set the current language
  const setLanguage = (language: SupportedLanguage): void => {
    if (LANGUAGE_OPTIONS.some(opt => opt.code === language)) {
      currentLanguage.value = language;
      saveLanguagePreference(language);
    } else {
      console.warn(`Unsupported language: ${language}`);
    }
  };

  // Get translation for a given key from a translations object
  const getTranslation = (
    translations: MultiLanguageLabels,
    fallback?: string
  ): string => {
    const translation = translations[currentLanguage.value as keyof MultiLanguageLabels];
    if (translation && translation.trim()) {
      return translation;
    }
    
    // Fallback to German if current language is not available
    if (currentLanguage.value !== 'de' && translations.de && translations.de.trim()) {
      return translations.de;
    }
    
    // Return fallback or first available translation
    if (fallback) {
      return fallback;
    }
    
    const firstAvailable = Object.values(translations).find(t => t && t.trim());
    return firstAvailable || '';
  };

  // Get current language option object
  const currentLanguageOption = computed((): LanguageOption => {
    return LANGUAGE_OPTIONS.find(opt => opt.code === currentLanguage.value) || LANGUAGE_OPTIONS[0];
  });

  // Watch for language changes and persist them
  watch(currentLanguage, (newLanguage) => {
    saveLanguagePreference(newLanguage);
  });

  return {
    // State
    currentLanguage: computed(() => currentLanguage.value),
    currentLanguageOption,
    availableLanguages: LANGUAGE_OPTIONS,
    
    // Actions
    setLanguage,
    getTranslation,
    
    // Utilities
    isLanguageSupported: (language: string): language is SupportedLanguage => {
      return LANGUAGE_OPTIONS.some(opt => opt.code === language);
    }
  };
}

// Export a singleton instance for global use
export const globalLanguage = useLanguage();
