<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import Button from 'primevue/button'

// Vue i18n (used in template)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { t } = useI18n()
</script>

<template>
  <main class="max-w-6xl mx-auto p-8" data-testid="home-main">
    <!-- Header Section -->
    <Card class="mb-8" data-testid="home-header">
      <template #content>
        <div class="text-center">
          <h1
            class="text-4xl md:text-5xl font-bold text-surface-900 dark:text-surface-50 mb-4"
            data-testid="home-title"
          >
            {{ $t('homeView.title') }}
          </h1>
          <p class="text-xl text-surface-600 dark:text-surface-300" data-testid="home-subtitle">
            {{ $t('homeView.subtitle') }}
          </p>
        </div>
      </template>
    </Card>

    <!-- Description Section -->
    <Card class="mb-8" data-testid="home-description-card">
      <template #content>
        <h2
          class="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-4 text-center"
          data-testid="home-description-title"
        >
          {{ $t('homeView.description.title') }}
        </h2>
        <p
          class="text-lg text-surface-700 dark:text-surface-200 text-center mb-6 leading-relaxed"
          data-testid="home-description-intro"
        >
          {{ $t('homeView.description.intro') }}
        </p>

        <div class="my-6">
          <p class="font-semibold text-surface-800 dark:text-surface-100 mb-4 text-center">
            {{ $t('homeView.description.capabilities') }}
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="home-data-types">
            <Card
              class="hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              data-testid="home-data-type-balance"
            >
              <template #content>
                <h3
                  class="flex items-center gap-2 text-lg font-medium text-surface-900 dark:text-surface-50 mb-3"
                >
                  <i class="pi pi-chart-bar text-primary-500 text-xl"></i>
                  {{ $t('homeView.dimensions.bilanz') }}
                </h3>
                <p class="text-surface-600 dark:text-surface-300 leading-relaxed">
                  {{ $t('homeView.description.bilanzDescription') }}
                </p>
              </template>
            </Card>
            <Card
              class="hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              data-testid="home-data-type-income"
            >
              <template #content>
                <h3
                  class="flex items-center gap-2 text-lg font-medium text-surface-900 dark:text-surface-50 mb-3"
                >
                  <i class="pi pi-trending-up text-primary-500 text-xl"></i>
                  {{ $t('homeView.dimensions.ertrag') }} / {{ $t('homeView.dimensions.aufwand') }}
                </h3>
                <p class="text-surface-600 dark:text-surface-300 leading-relaxed">
                  {{ $t('homeView.description.incomeDescription') }}
                </p>
              </template>
            </Card>
          </div>
        </div>

        <p class="text-center text-surface-600 dark:text-surface-300 italic mt-6">
          {{ $t('homeView.description.footer') }}
        </p>
      </template>
    </Card>

    <!-- CTA Section -->
    <Card data-testid="home-cta-card">
      <template #content>
        <div class="text-center">
          <h3
            class="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-4"
            data-testid="home-cta-title"
          >
            {{ $t('homeView.cta.title') }}
          </h3>
          <p
            class="text-lg text-surface-700 dark:text-surface-200 mb-6"
            data-testid="home-cta-description"
          >
            {{ $t('homeView.cta.description') }}
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              as="router-link"
              to="/financial-comparison"
              icon="pi pi-chart-line"
              :label="$t('homeView.cta.comparisonButtonText')"
              size="large"
              style="min-width: 13rem"
              data-testid="home-cta-button-primary"
            />

            <Button
              as="router-link"
              to="/about"
              icon="pi pi-info-circle"
              :label="$t('homeView.cta.learnMoreButtonText')"
              severity="secondary"
              outlined
              size="large"
              style="min-width: 13rem"
              data-testid="home-cta-button-secondary"
            />
          </div>
        </div>
      </template>
    </Card>
  </main>
</template>
