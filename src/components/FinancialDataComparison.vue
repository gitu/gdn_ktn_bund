<template>
  <div class="financial-data-comparison">
    <!-- Loading state -->
    <div v-if="loading" class="loading-message" role="status" :aria-label="$t('financialDataComparison.loading')">
      <i class="pi pi-spin pi-spinner"></i>
      <span>{{ $t('financialDataComparison.loading') }}</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-message" role="alert">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- No data state -->
    <div v-else-if="!hasValidData" class="no-data-message">
      <i class="pi pi-info-circle"></i>
      <span>{{ $t('financialDataComparison.noData') }}</span>
    </div>

    <!-- Main comparison content -->
    <div v-else class="comparison-content">
      <div class="info-bar">
        <span>{{ $t('financialDataComparison.filteredCategories') }}</span>
        <span>{{ $t('financialDataComparison.totalRows', { count: loadedDatasetCount }) }} datasets loaded</span>
      </div>

      <!-- Single FinancialDataDisplay for combined data -->
      <div class="combined-data-container">
        <FinancialDataDisplay
          :financial-data="combinedFinancialData!"
          :loading="false"
          :error="null"
          :initial-expanded-all="expandedAll"
          :initial-show-codes="showCodes"
          :initial-show-zero-values="!hideZeroValues"
          @error="handleDatasetError"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FinancialDataDisplay from './FinancialDataDisplay.vue';
import { DataLoader } from '@/utils/DataLoader';
import { createEmptyFinancialDataStructure } from '@/data/emptyFinancialDataStructure';
import type { FinancialData } from '@/types/FinancialDataStructure';

// Props
interface Props {
  datasets: string[];
}

const props = defineProps<Props>();

// Emits
interface Emits {
  error: [error: string];
  dataLoaded: [count: number];
}

const emit = defineEmits<Emits>();

// Vue i18n
const { t } = useI18n();

// Reactive state
const loading = ref(false);
const error = ref<string | null>(null);
const combinedFinancialData = ref<FinancialData | null>(null);
const loadedDatasetCount = ref(0);
const expandedAll = ref(false);
const showCodes = ref(true);
const hideZeroValues = ref(true);

// Computed properties
const hasValidData = computed(() => {
  return combinedFinancialData.value !== null && loadedDatasetCount.value > 0;
});

// Methods
const loadDatasets = async () => {
  if (props.datasets.length === 0) return;

  loading.value = true;
  error.value = null;
  loadedDatasetCount.value = 0;

  try {
    // Start with empty financial data structure
    combinedFinancialData.value = createEmptyFinancialDataStructure();
    const dataLoader = new DataLoader();

    // Load each dataset into the combined structure
    for (const dataset of props.datasets) {
      try {
        // Parse dataset identifier (e.g., 'gdn/fs/010002:2016')
        const parts = dataset.split('/');
        if (parts.length !== 3) {
          throw new Error(`Invalid dataset identifier format: ${dataset}`);
        }

        const source = parts[0] as 'gdn' | 'std';
        const model = parts[1];
        const entityAndYear = parts[2];
        const [entity, year] = entityAndYear.split(':');

        if (!entity || !year) {
          throw new Error(`Invalid entity:year format in dataset: ${dataset}`);
        }

        // Load and integrate data into the combined structure
        await dataLoader.loadAndIntegrateFinancialData(
          entity,
          model,
          year,
          combinedFinancialData.value,
          source
        );

        loadedDatasetCount.value++;

      } catch (error) {
        console.error(`Error loading dataset ${dataset}:`, error);
        emit('error', t('financialDataComparison.datasetError', {
          dataset,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    }

    if (loadedDatasetCount.value === 0) {
      error.value = t('financialDataComparison.noValidData');
      combinedFinancialData.value = null;
    } else {
      emit('dataLoaded', loadedDatasetCount.value);
    }
  } catch {
    error.value = t('financialDataComparison.error');
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
};



// Event handlers
const handleDatasetError = (errorMessage: string) => {
  console.error('Dataset error:', errorMessage);
  emit('error', errorMessage);
};

// Watch for dataset changes
watch(() => props.datasets, () => {
  loadDatasets();
}, { immediate: true });
</script>

<style scoped>
.financial-data-comparison {
  width: 100%;
  max-width: 100%;
}

/* Messages */
.loading-message,
.error-message,
.no-data-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
}

.loading-message {
  background: var(--blue-50);
  color: var(--blue-700);
  border: 1px solid var(--blue-200);
}

.error-message {
  background: var(--red-50);
  color: var(--red-700);
  border: 1px solid var(--red-200);
}

.no-data-message {
  background: var(--surface-100);
  color: var(--text-color-secondary);
  border: 1px solid var(--surface-border);
}

/* Info bar */
.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--surface-section);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

/* Combined data container */
.combined-data-container {
  width: 100%;
}

/* Responsive design */
@media (max-width: 768px) {
  .info-bar {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .loading-message {
    background: var(--blue-900);
    color: var(--blue-100);
    border-color: var(--blue-700);
  }

  .error-message {
    background: var(--red-900);
    color: var(--red-100);
    border-color: var(--red-700);
  }
}
</style>
