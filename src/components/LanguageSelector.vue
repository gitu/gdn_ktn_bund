<template>
  <div class="language-selector">
    <button
      ref="triggerButton"
      type="button"
      class="layout-topbar-action language-trigger"
      @click="toggleDropdown"
      @keydown.escape="closeDropdown"
      @keydown.arrow-down.prevent="focusFirstOption"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-label="getAriaLabel()"
    >
      <i class="pi pi-globe"></i>
      <span class="language-code">{{ $i18n.locale.toUpperCase() }}</span>
      <i class="pi pi-chevron-down dropdown-icon" :class="{ 'rotate-180': isOpen }"></i>
    </button>

    <div
      v-show="isOpen"
      ref="dropdown"
      class="language-dropdown"
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
        class="language-option"
        :class="{
          'active': locale === $i18n.locale,
          'focused': focusedIndex === index
        }"
        role="menuitem"
        :tabindex="focusedIndex === index ? 0 : -1"
        @click="selectLanguage(locale as SupportedLanguage)"
        @mouseenter="focusedIndex = index"
        :aria-label="getOptionAriaLabel(locale)"
      >
        <span class="language-flag">{{ getLanguageFlag(locale as SupportedLanguage) }}</span>
        <span class="language-name">{{ getLanguageNativeName(locale as SupportedLanguage) }}</span>
        <i v-if="locale === $i18n.locale" class="pi pi-check check-icon"></i>
      </button>
    </div>

    <!-- Backdrop for mobile -->
    <div
      v-if="isOpen"
      class="language-backdrop"
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

<style scoped>
.language-selector {
  position: relative;
  display: inline-block;
}

.language-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  font-size: 0.875rem;
  min-width: 4rem;
}

.language-trigger:hover {
  background: var(--highlight-bg);
  color: var(--highlight-text-color);
}

.language-trigger:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.language-code {
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.dropdown-icon {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

.language-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 12rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  box-shadow: var(--overlay-shadow);
  padding: 0.5rem 0;
  margin-top: 0.25rem;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease;
  font-size: 0.875rem;
}

.language-option:hover,
.language-option.focused {
  background: var(--highlight-bg);
  color: var(--highlight-text-color);
}

.language-option.active {
  background: var(--primary-50);
  color: var(--primary-color);
  font-weight: 600;
}

.language-option:focus {
  outline: none;
  background: var(--highlight-bg);
  color: var(--highlight-text-color);
}

.language-flag {
  font-size: 1.125rem;
  line-height: 1;
}

.language-name {
  flex: 1;
}

.check-icon {
  font-size: 0.875rem;
  color: var(--primary-color);
}

.language-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: transparent;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .language-dropdown {
    right: -1rem;
    min-width: 10rem;
  }

  .language-trigger {
    padding: 0.5rem;
    min-width: 3rem;
  }

  .language-code {
    display: none;
  }
}

/* Dark mode adjustments */
:global(.app-dark) .language-dropdown {
  background: var(--surface-900);
  border-color: var(--surface-700);
}

:global(.app-dark) .language-option.active {
  background: var(--primary-900);
  color: var(--primary-100);
}
</style>
