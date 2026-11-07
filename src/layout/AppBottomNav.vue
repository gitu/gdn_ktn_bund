<script setup lang="ts">
// Phone navigation (< 768px, see _bottomnav.scss). Mirrors the sidebar destinations.
</script>

<template>
  <nav class="layout-bottomnav" :aria-label="$t('navigation.main')" data-testid="bottom-nav">
    <router-link to="/">
      <i class="pi pi-home" aria-hidden="true"></i>
      <span>{{ $t('navigation.home') }}</span>
    </router-link>
    <router-link to="/financial-comparison">
      <i class="pi pi-chart-bar" aria-hidden="true"></i>
      <span>{{ $t('navigation.compare') }}</span>
    </router-link>
    <router-link to="/about">
      <i class="pi pi-info-circle" aria-hidden="true"></i>
      <span>{{ $t('navigation.about') }}</span>
    </router-link>
  </nav>
</template>
