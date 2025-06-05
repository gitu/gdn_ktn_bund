<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-500 to-purple-600 py-8">
    <div class="max-w-6xl mx-auto px-8">
      <!-- Header Section -->
      <header class="text-center text-white mb-16">
        <h1 class="text-5xl font-bold mb-4 drop-shadow-lg">
          {{ t('aboutView.title') }}
        </h1>
        <p class="text-2xl font-light mb-6 opacity-90">
          {{ t('aboutView.subtitle') }}
        </p>
        <p class="text-lg max-w-4xl mx-auto leading-relaxed opacity-90">
          {{ t('aboutView.description') }}
        </p>
      </header>

      <!-- Features Section -->
      <Card class="mb-8">
        <template #content>
          <h2 class="text-3xl font-semibold text-surface-900 dark:text-surface-50 mb-8 text-center">
            {{ t('aboutView.features.title') }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <div class="text-center p-6 bg-surface-50 dark:bg-surface-800 rounded-lg hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div class="text-5xl mb-4">🌳</div>
              <h3 class="text-lg font-medium text-surface-900 dark:text-surface-50 leading-tight">
                {{ t('aboutView.features.treeNavigation') }}
              </h3>
            </div>
            <div class="text-center p-6 bg-surface-50 dark:bg-surface-800 rounded-lg hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div class="text-5xl mb-4">📊</div>
              <h3 class="text-lg font-medium text-surface-900 dark:text-surface-50 leading-tight">
                {{ t('aboutView.features.tableView') }}
              </h3>
            </div>
            <div class="text-center p-6 bg-surface-50 dark:bg-surface-800 rounded-lg hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div class="text-5xl mb-4">🔍</div>
              <h3 class="text-lg font-medium text-surface-900 dark:text-surface-50 leading-tight">
                {{ t('aboutView.features.dataBrowser') }}
              </h3>
            </div>
            <div class="text-center p-6 bg-surface-50 dark:bg-surface-800 rounded-lg hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div class="text-5xl mb-4">🌐</div>
              <h3 class="text-lg font-medium text-surface-900 dark:text-surface-50 leading-tight">
                {{ t('aboutView.features.multiLanguage') }}
              </h3>
            </div>
            <div class="text-center p-6 bg-surface-50 dark:bg-surface-800 rounded-lg hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div class="text-5xl mb-4">📱</div>
              <h3 class="text-lg font-medium text-surface-900 dark:text-surface-50 leading-tight">
                {{ t('aboutView.features.responsive') }}
              </h3>
            </div>
          </div>
        </template>
      </Card>

      <!-- Data Info Section -->
      <Card class="mb-8">
        <template #content>
          <h2 class="text-3xl font-semibold text-surface-900 dark:text-surface-50 mb-6">
            {{ t('aboutView.dataInfo.title') }}
          </h2>
          <p class="text-lg text-surface-700 dark:text-surface-200 mb-6 leading-relaxed">
            {{ t('aboutView.dataInfo.description') }}
          </p>
          <div class="space-y-3">
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border-l-4 border-primary-500">
              <p class="text-surface-700 dark:text-surface-200">
                {{ t('aboutView.dataInfo.sources') }}
              </p>
            </div>
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border-l-4 border-primary-500">
              <p class="text-surface-700 dark:text-surface-200">
                {{ t('aboutView.dataInfo.coverage') }}
              </p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Technology Section -->
      <Card>
        <template #content>
          <h2 class="text-3xl font-semibold text-surface-900 dark:text-surface-50 mb-6">
            {{ t('aboutView.technology.title') }}
          </h2>
          <p class="text-lg text-surface-700 dark:text-surface-200 mb-6 leading-relaxed">
            {{ t('aboutView.technology.description') }}
          </p>
          <div class="space-y-3">
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border-l-4 border-primary-500">
              <p class="text-surface-700 dark:text-surface-200">
                {{ t('aboutView.technology.frontend') }}
              </p>
            </div>
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border-l-4 border-primary-500">
              <p class="text-surface-700 dark:text-surface-200">
                {{ t('aboutView.technology.testing') }}
              </p>
            </div>
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border-l-4 border-primary-500">
              <p class="text-surface-700 dark:text-surface-200">
                {{ t('aboutView.technology.build') }}
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Card from 'primevue/card';

// Use Vue i18n
const { t } = useI18n();
</script>


