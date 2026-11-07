<script setup lang="ts">
import { useLayout } from '@/layout/composables/layout'
import LanguageSelector from '@/components/LanguageSelector.vue'
import BrandMark from '@/components/BrandMark.vue'

const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout()
</script>

<template>
  <header class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <button
        type="button"
        class="layout-menu-button layout-topbar-action"
        :aria-label="$t('navigation.openMenu')"
        @click="toggleMenu"
      >
        <i class="pi pi-bars" aria-hidden="true"></i>
      </button>
      <router-link to="/" class="layout-topbar-logo">
        <BrandMark />
        <span class="brand-text">GDN KTN BUND</span>
      </router-link>
    </div>

    <div class="layout-topbar-actions">
      <div class="layout-config-menu">
        <LanguageSelector />
        <button
          type="button"
          class="layout-topbar-action"
          :aria-label="$t('navigation.toggleTheme')"
          :aria-pressed="isDarkTheme"
          @click="toggleDarkMode"
        >
          <i :class="['pi', isDarkTheme ? 'pi-moon' : 'pi-sun']" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </header>
</template>
