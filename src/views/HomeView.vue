<script setup lang="ts">
import Card from 'primevue/card'
import Button from 'primevue/button'
</script>

<template>
  <main class="max-w-4xl mx-auto p-6" data-testid="home-main">
    <!-- Header Section -->
    <Card class="mb-8 shadow-2" data-testid="home-header">
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

    <!-- Main Description Section -->
    <Card class="mb-8 shadow-2" data-testid="home-description-card">
      <template #content>
        <div class="text-center">
          <h2
            class="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-4"
            data-testid="home-description-title"
          >
            {{ $t('homeView.description.title') }}
          </h2>
          <p
            class="text-lg text-surface-700 dark:text-surface-200 mb-6 leading-relaxed max-w-3xl mx-auto"
            data-testid="home-description-intro"
          >
            {{ $t('homeView.description.intro') }}
          </p>

          <!-- Scaling Feature Highlight -->
          <div
            class="surface-50 dark:surface-800 p-4 border-round border-left-3 border-primary mb-6"
          >
            <div class="flex align-items-center gap-3 justify-content-center">
              <i class="pi pi-arrows-alt text-primary-500 text-xl"></i>
              <p class="text-surface-700 dark:text-surface-200 m-0 font-medium">
                {{ $t('homeView.description.scalingFeature') }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Call-to-Action Section -->
    <Card class="shadow-2" data-testid="home-cta-card">
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
              :label="$t('homeView.cta.startButtonText')"
              size="large"
              class="min-w-[13rem]"
              data-testid="home-cta-button-primary"
            />

            <Button
              as="router-link"
              to="/about"
              icon="pi pi-info-circle"
              :label="$t('homeView.cta.aboutButtonText')"
              severity="secondary"
              outlined
              size="large"
              class="min-w-[13rem]"
              data-testid="home-cta-button-secondary"
            />
          </div>
        </div>
      </template>
    </Card>
  </main>
</template>
