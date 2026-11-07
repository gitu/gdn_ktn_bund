<script setup lang="ts"></script>

<template>
  <footer class="layout-footer">
    <span>GDN KTN BUND</span>
    <span>{{ $t('footer.sources') }}</span>
    <router-link to="/about">{{ $t('footer.about') }}</router-link>
  </footer>
</template>
