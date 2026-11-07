import { createI18n } from 'vue-i18n'

// Import translation files
import de from './locales/de.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import it from './locales/it.json'

export const LOCALE_STORAGE_KEY = 'gk-locale'
const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'it']

/** The language the user picked last time, else German (the default of the data). */
function initialLocale(): string {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return stored && SUPPORTED_LOCALES.includes(stored) ? stored : 'de'
  } catch {
    return 'de'
  }
}

// Type for our messages
export type MessageSchema = typeof de

// Create i18n instance
export const i18n = createI18n<[MessageSchema], string>({
  legacy: false, // Use Composition API mode
  locale: initialLocale(), // Remembered choice, default German
  fallbackLocale: 'de', // Fallback locale
  messages: {
    de,
    en,
    fr,
    it,
  },
  // Disable missing handler in production
  missingWarn: import.meta.env.NODE_ENV !== 'production',
  fallbackWarn: import.meta.env.NODE_ENV !== 'production',
})

// Export the global instance for use in composables
export default i18n
