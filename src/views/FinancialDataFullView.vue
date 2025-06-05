<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900">
    <!-- Header with back button -->
    <div class="bg-surface-0 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-6 py-4">
      <div class="flex items-center justify-between max-w-full">
        <div class="flex items-center gap-4">
          <Button
            :label="$t('financialDataFullView.backToComparison')"
            :title="$t('financialDataFullView.backToComparisonTooltip')"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            @click="goBackToComparison"
            class="flex-shrink-0"
          />
          <div>
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {{ $t('financialDataFullView.title') }}
            </h1>
            <p class="text-surface-600 dark:text-surface-300 text-sm">
              {{ $t('financialDataFullView.subtitle') }}
            </p>
          </div>
        </div>
        
        <!-- Dataset count indicator -->
        <div v-if="hasValidData" class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
          <i class="pi pi-database"></i>
          <span>{{ $t('financialDataFullView.datasetsLoaded', { count: datasets.length }) }}</span>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="p-6">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
          <p class="text-lg text-surface-600 dark:text-surface-300">
            {{ $t('financialDataFullView.loadingDatasets') }}
          </p>
        </div>
      </div>

      <!-- No datasets state -->
      <div v-else-if="!hasValidData" class="flex items-center justify-center py-16">
        <Card class="max-w-md">
          <template #content>
            <div class="text-center">
              <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
              <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                {{ $t('financialDataFullView.noDatasets') }}
              </h3>
              <p class="text-surface-600 dark:text-surface-300 mb-6">
                {{ $t('financialDataFullView.noDataMessage') }}
              </p>
              <Button
                :label="$t('financialDataFullView.backToComparison')"
                icon="pi pi-arrow-left"
                @click="goBackToComparison"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Financial data display -->
      <div v-else class="w-full">
        <FinancialDataComparison
          :datasets="datasets"
          @error="handleError"
          @dataLoaded="handleDataLoaded"
        />
      </div>
    </div>

    <!-- Error toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Toast from 'primevue/toast';
import FinancialDataComparison from '@/components/FinancialDataComparison.vue';

// Composables
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const toast = useToast();

// Reactive state
const loading = ref(true);
const datasets = ref<string[]>([]);
const dataLoadedCount = ref(0);

// Computed properties
const hasValidData = computed(() => {
  return datasets.value.length > 0;
});

// Methods
const goBackToComparison = () => {
  // Navigate back to comparison view with current datasets preserved in URL
  const query: Record<string, string> = {};

  if (datasets.value.length > 0) {
    query.datasets = datasets.value.join(',');
  }

  router.push({
    name: 'financial-comparison',
    query: Object.keys(query).length > 0 ? query : undefined
  });
};

const handleError = (error: string) => {
  console.error('FinancialDataFullView error:', error);
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: error,
    life: 5000
  });
};

const handleDataLoaded = (count: number) => {
  dataLoadedCount.value = count;
  console.log(`Loaded ${count} datasets in full view`);
};

const loadDatasetsFromRoute = () => {
  loading.value = true;
  
  try {
    // Get datasets from route query parameters
    const datasetsParam = route.query.datasets;
    
    if (typeof datasetsParam === 'string') {
      // Single dataset or comma-separated list
      datasets.value = datasetsParam.split(',').filter(d => d.trim().length > 0);
    } else if (Array.isArray(datasetsParam)) {
      // Array of datasets
      datasets.value = datasetsParam.filter(d => typeof d === 'string' && d.trim().length > 0) as string[];
    } else {
      // No datasets provided
      datasets.value = [];
    }
    
    console.log('Loaded datasets from route:', datasets.value);
  } catch (error) {
    console.error('Error loading datasets from route:', error);
    handleError(t('financialDataFullView.noDataMessage'));
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadDatasetsFromRoute();
});
</script>

<style scoped>
/* Additional styles for full-screen layout */
.min-h-screen {
  min-height: 100vh;
}
</style>
