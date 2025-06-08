<template>
  <div class="layout-main" data-testid="about-main">
    <div class="grid grid-cols-12 gap-10">
      <!-- Header Section -->
      <div class="col-span-12">
        <Card class="shadow-2">
          <template #content>
            <div class="text-center">
              <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-50 mb-4">
                {{ t('aboutView.title') }}
              </h1>
              <p class="text-xl text-surface-600 dark:text-surface-300 mb-4">
                {{ t('aboutView.subtitle') }}
              </p>
              <p
                class="text-lg text-surface-700 dark:text-surface-200 leading-relaxed max-w-4xl mx-auto"
              >
                {{ t('aboutView.description') }}
              </p>
            </div>
          </template>
        </Card>
      </div>


      <!-- Data Info and Technology Row -->
      <div class="col-span-12 xl:col-span-6">
        <Card class="shadow-2 h-full">
          <template #content>
            <div class="flex align-items-center justify-content-between mb-4">
              <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-50 m-0">
                {{ t('aboutView.dataInfo.title') }}
              </h2>
              <i class="pi pi-database text-primary-500 text-2xl"></i>
            </div>
            <p class="text-surface-700 dark:text-surface-200 mb-4 leading-relaxed">
              {{ t('aboutView.dataInfo.description') }}
            </p>
            <div class="flex flex-column gap-3">
              <div
                class="surface-50 dark:surface-800 p-3 border-round border-left-3 border-primary"
              >
                <p class="text-surface-700 dark:text-surface-200 m-0">
                  {{ t('aboutView.dataInfo.sources') }}
                </p>
              </div>
              <div
                class="surface-50 dark:surface-800 p-3 border-round border-left-3 border-primary"
              >
                <p class="text-surface-700 dark:text-surface-200 m-0">
                  {{ t('aboutView.dataInfo.coverage') }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-span-12 xl:col-span-6">
        <Card class="shadow-2 h-full">
          <template #content>
            <div class="flex align-items-center justify-content-between mb-4">
              <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-50 m-0">
                {{ t('aboutView.technology.title') }}
              </h2>
              <i class="pi pi-cog text-primary-500 text-2xl"></i>
            </div>
            <p class="text-surface-700 dark:text-surface-200 mb-4 leading-relaxed">
              {{ t('aboutView.technology.description') }}
            </p>
            <div class="flex flex-column gap-3">
              <div
                class="surface-50 dark:surface-800 p-3 border-round border-left-3 border-primary"
              >
                <p class="text-surface-700 dark:text-surface-200 m-0">
                  {{ t('aboutView.technology.frontend') }}
                </p>
              </div>
              <div
                class="surface-50 dark:surface-800 p-3 border-round border-left-3 border-primary"
              >
                <p class="text-surface-700 dark:text-surface-200 m-0">
                  {{ t('aboutView.technology.testing') }}
                </p>
              </div>
              <div
                class="surface-50 dark:surface-800 p-3 border-round border-left-3 border-primary"
              >
                <p class="text-surface-700 dark:text-surface-200 m-0">
                  {{ t('aboutView.technology.build') }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Build Info and Repository Row -->
      <div class="col-span-12 xl:col-span-6">
        <Card class="shadow-2 h-full">
          <template #content>
            <div class="flex align-items-center justify-content-between mb-4">
              <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-50 m-0">
                {{ t('aboutView.buildInfo.title') }}
              </h2>
              <i class="pi pi-clock text-primary-500 text-2xl"></i>
            </div>
            <div class="flex flex-column gap-3">
              <div class="flex align-items-center gap-3">
                <i class="pi pi-calendar text-surface-600"></i>
                <div>
                  <span class="text-surface-600 dark:text-surface-300"
                    >{{ t('aboutView.buildInfo.buildTime') }}:</span
                  >
                  <span class="text-surface-900 dark:text-surface-50 font-medium ml-2">{{
                    buildTimestamp
                  }}</span>
                </div>
              </div>
              <div class="flex align-items-center gap-3">
                <i class="pi pi-code text-surface-600"></i>
                <div>
                  <span class="text-surface-600 dark:text-surface-300"
                    >{{ t('aboutView.buildInfo.commit') }}:</span
                  >
                  <span class="text-surface-900 dark:text-surface-50 font-medium ml-2 font-mono">{{
                    appVersion
                  }}</span>
                </div>
              </div>
              <div class="flex align-items-center gap-3" v-if="fullCommitHash !== appVersion">
                <i class="pi pi-info-circle text-surface-600"></i>
                <div>
                  <span class="text-surface-600 dark:text-surface-300 text-sm"
                    >{{ t('aboutView.buildInfo.fullCommit') }}:</span
                  >
                  <span class="text-surface-700 dark:text-surface-300 text-sm ml-2 font-mono">{{
                    fullCommitHash
                  }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="col-span-12 xl:col-span-6">
        <Card class="shadow-2 h-full">
          <template #content>
            <div class="flex align-items-center justify-content-between mb-4">
              <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-50 m-0">
                {{ t('aboutView.repository.title') }}
              </h2>
              <i class="pi pi-github text-primary-500 text-2xl"></i>
            </div>
            <p class="text-surface-700 dark:text-surface-200 mb-4 leading-relaxed">
              {{ t('aboutView.repository.description') }}
            </p>
            <div class="flex flex-column gap-3">
              <Button
                :label="t('aboutView.repository.viewOnGitHub')"
                icon="pi pi-external-link"
                class="p-button-outlined"
                @click="openGitHubRepository"
              />
              <Button
                :label="t('aboutView.repository.contribute')"
                icon="pi pi-users"
                severity="secondary"
                outlined
                @click="openGitHubRepository"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import Button from 'primevue/button'

// Use Vue i18n
const { t } = useI18n()

// Build timestamp injected during build process
const buildTimestamp = computed(() => {
  try {
    return new Date(__BUILD_TIME__).toLocaleDateString()
  } catch {
    return new Date().toLocaleDateString()
  }
})

// App version (short commit hash) injected during build process
const appVersion = computed(() => {
  return __APP_VERSION__ || 'unknown'
})

// Full Git commit hash
const fullCommitHash = computed(() => {
  return __GIT_COMMIT_HASH__ || 'unknown'
})

// GitHub repository URL
const GITHUB_REPOSITORY_URL = 'https://github.com/gitu/gdn_ktn_bund'

// Open GitHub repository
const openGitHubRepository = () => {
  window.open(GITHUB_REPOSITORY_URL, '_blank', 'noopener,noreferrer')
}
</script>
