<template>
  <div class="financial-data-scaling-selector">
    <!-- Header -->
    <div class="selector-header mb-4">
      <h4 class="text-lg font-semibold mb-2">{{ $t('financialDataScalingSelector.title') }}</h4>
      <p class="text-sm">{{ $t('financialDataScalingSelector.subtitle') }}</p>
    </div>

    <!-- Loading state -->
    <Message v-if="loading" severity="info" :closable="false" class="mb-4">
      <template #icon>
        <i class="pi pi-spin pi-spinner"></i>
      </template>
      {{ $t('financialDataScalingSelector.loading') }}
    </Message>

    <!-- Error state -->
    <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
    </Message>

    <!-- Scaling selector -->
    <div v-else class="scaling-controls">
      <div class="field">
        <label for="scaling-selector" class="block text-sm font-medium mb-2">
          {{ $t('financialDataScalingSelector.selectScaling') }}
        </label>
        <Dropdown
          id="scaling-selector"
          v-model="selectedScaling"
          :options="scalingOptions"
          option-label="label"
          option-value="value"
          :placeholder="$t('financialDataScalingSelector.selectScaling')"
          class="w-full"
          @change="onScalingChange"
          data-testid="scaling-dropdown"
        />
      </div>

      <!-- Current scaling info -->
      <div v-if="currentScalingInfo" class="scaling-info mt-4 p-3 rounded-lg border">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-info-circle"></i>
          <span class="font-medium">{{ $t('financialDataScalingSelector.scalingInfo.currentScaling', { name: currentScalingInfo.name }) }}</span>
        </div>
        <div class="text-sm">
          {{ $t('financialDataScalingSelector.scalingInfo.unit', { unit: currentScalingInfo.unit }) }}
        </div>
        <div class="text-sm mt-1">
          {{ currentScalingInfo.description }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import { StatsDataLoader } from '@/utils/StatsDataLoader';
import { GeographicalDataLoader } from '@/utils/GeographicalDataLoader';
import type { StatsAvailabilityInfo } from '@/types/StatsData';
import type { FinancialData } from '@/types/FinancialDataStructure';
import type { MultiLanguageLabels } from '@/types/DataStructures';

// Props
interface Props {
  financialData?: FinancialData | null;
}

const props = defineProps<Props>();

// Suppress unused variable warning - props is used in template
void props;

// Emits
interface Emits {
  scalingChanged: [scalingId: string | null, scalingInfo: ScalingInfo | null];
  error: [error: string];
}

const emit = defineEmits<Emits>();

// Vue i18n
const { locale, t } = useI18n();

// Types
interface ScalingOption {
  label: string;
  value: string | null;
  statsId?: string;
  unit?: MultiLanguageLabels;
  description?: MultiLanguageLabels;
}

interface ScalingInfo {
  id: string;
  name: string;
  unit: string;
  description: string;
  factor?: number;
}

// Reactive state
const loading = ref(true);
const error = ref<string | null>(null);
const selectedScaling = ref<string | null>(null);
const availableStats = ref<StatsAvailabilityInfo[]>([]);
const statsDataLoader = StatsDataLoader.getInstance();
const geoDataLoader = GeographicalDataLoader.getInstance();

// Suppress unused variable warning - geoDataLoader is available for future use
void geoDataLoader;

// Computed properties
const scalingOptions = computed<ScalingOption[]>(() => {
  const options: ScalingOption[] = [
    {
      label: t('financialDataScalingSelector.noScaling'),
      value: null
    }
  ];

  // Add available statistics as scaling options
  availableStats.value.forEach(stat => {
    const currentLocale = locale.value as keyof MultiLanguageLabels;
    options.push({
      label: stat.name[currentLocale] || stat.name.en || stat.id,
      value: stat.id,
      statsId: stat.id,
      unit: stat.unit,
      description: stat.name
    });
  });

  return options;
});

const currentScalingInfo = computed<ScalingInfo | null>(() => {
  if (!selectedScaling.value) return null;

  const stat = availableStats.value.find(s => s.id === selectedScaling.value);
  if (!stat) return null;

  const currentLocale = locale.value as keyof MultiLanguageLabels;
  return {
    id: stat.id,
    name: stat.name[currentLocale] || stat.name.en || stat.id,
    unit: stat.unit[currentLocale] || stat.unit.en || '',
    description: t('financialDataScalingSelector.scalingInfo.description')
  };
});

// Methods
const loadAvailableStats = async () => {
  try {
    loading.value = true;
    error.value = null;

    const stats = await statsDataLoader.getAvailableStats();
    
    // Filter for relevant scaling statistics (population, area, etc.)
    availableStats.value = stats.filter((stat: StatsAvailabilityInfo) => {
      const id = stat.id.toLowerCase();
      return id.includes('pop') || id.includes('area') || id.includes('household') || id.includes('employee');
    });

  } catch (err) {
    console.error('Error loading available statistics:', err);
    error.value = t('financialDataScalingSelector.errors.loadingFailed');
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
};

const onScalingChange = async () => {
  try {
    if (!selectedScaling.value) {
      // No scaling selected - remove scaling
      emit('scalingChanged', null, null);
      return;
    }

    const scalingInfo = currentScalingInfo.value;
    if (!scalingInfo) {
      throw new Error('Invalid scaling selection');
    }

    emit('scalingChanged', selectedScaling.value, scalingInfo);

  } catch (err) {
    console.error('Error applying scaling:', err);
    const errorMessage = t('financialDataScalingSelector.errors.applyingFailed');
    error.value = errorMessage;
    emit('error', errorMessage);
  }
};

// Lifecycle hooks
onMounted(() => {
  loadAvailableStats();
});

// Watch for locale changes to update labels
watch(() => locale.value, () => {
  // Force reactivity update for computed properties by triggering a re-render
  if (selectedScaling.value) {
    const currentValue = selectedScaling.value;
    selectedScaling.value = null;
    selectedScaling.value = currentValue;
  }
});
</script>

<style scoped>
.financial-data-scaling-selector {
  width: 100%;
}
</style>
