<template>
  <div class="relative inline-block" data-testid="language-selector">
    <Button
      ref="triggerButton"
      type="button"
      icon="pi pi-globe"
      @click="toggle"
      class="layout-topbar-action"
      aria-haspopup="true"
      aria-controls="language_menu"
      :aria-label="ariaLabel"
      data-testid="language-selector-trigger"
    >
      <template #default>
        <i class="pi pi-globe"></i>
        <span class="font-semibold text-xs tracking-wider md:inline hidden ml-2" data-testid="language-selector-code">{{ currentLanguageCode }}</span>
      </template>
    </Button>

    <Menu
      ref="menu"
      id="language_menu"
      :model="menuItems"
      :popup="true"
      class="min-w-48"
      data-testid="language-selector-menu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import i18n from "@/i18n";

// Define supported languages type
type SupportedLanguage = 'de' | 'en' | 'fr' | 'it';

// Vue i18n
const { locale, t } = useI18n();

// Component refs
const menu = ref<InstanceType<typeof Menu>>();
const triggerButton = ref<InstanceType<typeof Button>>();

// Language configuration
const languageFlags: Record<SupportedLanguage, string> = {
  de: 'DE',
  en: 'EN',
  fr: 'FR',
  it: 'IT'
};

const languageNativeNames: Record<SupportedLanguage, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano'
};

// Utility methods
const getLanguageFlag = (code: SupportedLanguage): string => {
  return languageFlags[code] || '🌐';
};

const getLanguageNativeName = (code: SupportedLanguage): string => {
  return languageNativeNames[code] || code;
};

// Methods
const toggle = (event: Event): void => {
  menu.value?.toggle(event);
};

const selectLanguage = (language: SupportedLanguage): void => {
  // Update both the global i18n locale and the local reactive locale
  (i18n.global.locale as unknown as { value: string }).value = language;
  locale.value = language;
};

// Create menu items for PrimeVue Menu
const menuItems = computed<MenuItem[]>(() => {
  const supportedLocales: SupportedLanguage[] = ['de', 'en', 'fr', 'it'];
  return supportedLocales.map((localeCode) => {
    const language = localeCode as SupportedLanguage;
    const isSelected = localeCode === locale.value;

    return {
      label: `${getLanguageFlag(language)} ${getLanguageNativeName(language)}`,
      icon: isSelected ? 'pi pi-check' : undefined,
      command: () => selectLanguage(language),
      class: isSelected ? 'font-semibold' : ''
    };
  });
});

// Computed properties for template
const currentLanguageCode = computed(() => {
  return locale.value.toUpperCase();
});

const ariaLabel = computed(() => {
  try {
    const selectText = t('languageSelector.selectLanguage');
    const currentText = t('languageSelector.currentLanguage');
    const currentName = getLanguageNativeName(locale.value as SupportedLanguage);
    return `${selectText}. ${currentText}: ${currentName}`;
  } catch {
    // Fallback for tests or when translations are not available
    return `Select language. Current language: ${getLanguageNativeName(locale.value as SupportedLanguage)}`;
  }
});
</script>


