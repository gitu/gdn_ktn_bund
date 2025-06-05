<template>
  <div class="relative inline-block">
    <button
      ref="triggerButton"
      type="button"
      @click="toggleDropdown"
      @keydown.escape="closeDropdown"
      @keydown.arrow-down.prevent="focusFirstOption"
      class="layout-topbar-action"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-label="getAriaLabel()"
    >
      <i class="pi pi-globe"></i>
      <span class="font-semibold text-xs tracking-wider md:inline hidden">{{ $i18n.locale.toUpperCase() }}</span>
    </button>

    <div
      v-show="isOpen"
      ref="dropdown"
      class="absolute top-full right-0 z-50 min-w-48 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-md shadow-lg py-2 mt-1"
      role="menu"
      :aria-labelledby="triggerId"
      @keydown.escape="closeDropdown"
      @keydown.arrow-up.prevent="focusPreviousOption"
      @keydown.arrow-down.prevent="focusNextOption"
      @keydown.enter.prevent="selectFocusedOption"
      @keydown.space.prevent="selectFocusedOption"
    >
      <button
        v-for="(locale, index) in $i18n.availableLocales"
        :key="locale"
        ref="optionButtons"
        type="button"
        class="flex items-center gap-3 w-full px-4 py-3 border-0 bg-transparent text-surface-700 dark:text-surface-200 cursor-pointer text-left transition-colors duration-200 text-sm hover:bg-surface-100 dark:hover:bg-surface-800 focus:outline-none focus:bg-surface-100 dark:focus:bg-surface-800"
        :class="{
          'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-100 font-semibold': locale === $i18n.locale,
          'bg-surface-100 dark:bg-surface-800': focusedIndex === index
        }"
        role="menuitem"
        :tabindex="focusedIndex === index ? 0 : -1"
        @click="selectLanguage(locale as SupportedLanguage)"
        @mouseenter="focusedIndex = index"
        :aria-label="getOptionAriaLabel(locale)"
      >
        <span class="text-lg leading-none">{{ getLanguageFlag(locale as SupportedLanguage) }}</span>
        <span class="flex-1">{{ getLanguageNativeName(locale as SupportedLanguage) }}</span>
        <i v-if="locale === $i18n.locale" class="pi pi-check text-sm text-primary-600 dark:text-primary-400"></i>
      </button>
    </div>

    <!-- Backdrop for mobile -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-transparent md:hidden"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import i18n from "@/i18n";

// Define supported languages type
type SupportedLanguage = 'de' | 'en' | 'fr' | 'it';

// Vue i18n
const { locale, availableLocales, t } = useI18n();

// Component state
const isOpen = ref(false);
const focusedIndex = ref(-1);
const triggerButton = ref<HTMLButtonElement>();
const dropdown = ref<HTMLDivElement>();
const optionButtons = ref<HTMLButtonElement[]>([]);

// Generate unique ID for accessibility
const triggerId = `language-trigger-${Math.random().toString(36).substr(2, 9)}`;

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

// Methods
const toggleDropdown = (): void => {
  if (isOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
};

const openDropdown = async (): Promise<void> => {
  isOpen.value = true;
  focusedIndex.value = availableLocales.findIndex(loc => loc === locale.value);

  await nextTick();

  // Focus the current language option
  if (focusedIndex.value >= 0 && optionButtons.value[focusedIndex.value]) {
    optionButtons.value[focusedIndex.value].focus();
  }
};

const closeDropdown = (): void => {
  isOpen.value = false;
  focusedIndex.value = -1;
  triggerButton.value?.focus();
};

const selectLanguage = (language: SupportedLanguage): void => {
  // Update both the global i18n locale and the local reactive locale
  (i18n.global.locale as unknown as { value: string }).value = language;
  locale.value = language;
  closeDropdown();
};

const focusFirstOption = (): void => {
  focusedIndex.value = 0;
  optionButtons.value[0]?.focus();
};

const focusPreviousOption = (): void => {
  if (focusedIndex.value > 0) {
    focusedIndex.value--;
    optionButtons.value[focusedIndex.value]?.focus();
  }
};

const focusNextOption = (): void => {
  if (focusedIndex.value < availableLocales.length - 1) {
    focusedIndex.value++;
    optionButtons.value[focusedIndex.value]?.focus();
  }
};

const selectFocusedOption = (): void => {
  if (focusedIndex.value >= 0) {
    const selectedLocale = availableLocales[focusedIndex.value] as SupportedLanguage;
    selectLanguage(selectedLocale);
  }
};

const getLanguageFlag = (code: SupportedLanguage): string => {
  return languageFlags[code] || '🌐';
};

const getLanguageNativeName = (code: SupportedLanguage): string => {
  return languageNativeNames[code] || code;
};

const getAriaLabel = (): string => {
  const selectText = t('languageSelector.selectLanguage');
  const currentText = t('languageSelector.currentLanguage');
  const currentName = getLanguageNativeName(locale.value as SupportedLanguage);
  return `${selectText}. ${currentText}: ${currentName}`;
};

const getOptionAriaLabel = (localeCode: string): string => {
  const isSelected = localeCode === locale.value;
  const nativeName = getLanguageNativeName(localeCode as SupportedLanguage);
  return `${nativeName}${isSelected ? ' (selected)' : ''}`;
};

// Handle clicks outside the dropdown
const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as Node;
  if (isOpen.value && dropdown.value && !dropdown.value.contains(target) &&
      triggerButton.value && !triggerButton.value.contains(target)) {
    closeDropdown();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>


