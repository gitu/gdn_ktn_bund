<template>
  <v-container fluid>
    <!-- Page Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-3">mdi-chart-line</v-icon>
            Enriched Financial Data Display
          </v-card-title>
          <v-card-subtitle>
            Detailed financial analysis with multi-language support and interactive filtering
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Entity Loading Status -->
    <v-alert
      v-if="entityLoadingError"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="entityLoadingError = null"
    >
      <v-alert-title>Entity Loading Error</v-alert-title>
      {{ entityLoadingError }}
    </v-alert>

    <v-alert
      v-if="isLoadingEntities"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      <v-alert-title>Loading Entity Options</v-alert-title>
      Please wait while entity options are being loaded from JSON files...
    </v-alert>

    <v-alert
      v-if="!isLoadingEntities && !entityLoadingError && entityOptions.length > 0"
      type="success"
      variant="tonal"
      class="mb-4"
      closable
    >
      <v-alert-title>Entity Options Loaded</v-alert-title>
      Successfully loaded {{ entityOptions.length }} entity options 
      ({{ entityOptions.filter(e => e.type === 'GDN').length }} municipalities, 
      {{ entityOptions.filter(e => e.type === 'STD').length }} standard entities).
    </v-alert>

    <!-- Controls -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Financial Data Controls</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedEntity"
                  :items="entityOptions"
                  item-title="name"
                  item-value="id"
                  label="Entity"
                  variant="outlined"
                  :loading="isLoadingEntities"
                  :disabled="isLoadingEntities || entityLoadingError !== null"
                  :error="entityLoadingError !== null"
                  :error-messages="entityLoadingError"
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedYear"
                  :items="availableYears"
                  label="Year"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="selectedDimension"
                  :items="dimensionOptions"
                  item-title="name"
                  item-value="value"
                  label="Dimension Filter"
                  variant="outlined"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-switch
                  v-model="enableComparison"
                  label="Enable Comparison"
                  color="primary"
                ></v-switch>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Single Entity View -->
    <div v-if="!enableComparison">
      <EnrichedDataDisplay
        :entity-id="selectedEntity"
        :year="selectedYear"
        :dimension="selectedDimension"
        :language="globalLanguage"
      />
    </div>

    <!-- Comparison View -->
    <div v-else>
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title>Entity A</v-card-title>
            <v-card-text>
              <v-select
                v-model="comparisonEntityA"
                :items="entityOptions"
                item-title="name"
                item-value="id"
                label="Select Entity A"
                variant="outlined"
                :loading="isLoadingEntities"
                :disabled="isLoadingEntities || entityLoadingError !== null"
              ></v-select>
            </v-card-text>
          </v-card>
          <EnrichedDataDisplay
            v-if="comparisonEntityA"
            :entity-id="comparisonEntityA"
            :year="selectedYear"
            :dimension="selectedDimension"
            :language="globalLanguage"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title>Entity B</v-card-title>
            <v-card-text>
              <v-select
                v-model="comparisonEntityB"
                :items="entityOptions"
                item-title="name"
                item-value="id"
                label="Select Entity B"
                variant="outlined"
                :loading="isLoadingEntities"
                :disabled="isLoadingEntities || entityLoadingError !== null"
              ></v-select>
            </v-card-text>
          </v-card>
          <EnrichedDataDisplay
            v-if="comparisonEntityB"
            :entity-id="comparisonEntityB"
            :year="selectedYear"
            :dimension="selectedDimension"
            :language="globalLanguage"
          />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import * as DataLoader from '../utils/DataLoader'
import { loadAllEntityOptions, type EntityOption, EntityLoadError } from '../utils/EntityLoader'
import EnrichedDataDisplay from '../components/EnrichedDataDisplay.vue'

// Inject global language from App.vue
const globalLanguage = inject<any>('globalLanguage') || ref('de')

// Financial data state
const selectedYear = ref<string>('2020')
const selectedEntity = ref<string>('ktn_zh')
const selectedDimension = ref<string | undefined>(undefined)
const enableComparison = ref(false)
const comparisonEntityA = ref<string>('ktn_zh')
const comparisonEntityB = ref<string>('gdn_010176')

// Entity options for enriched data display
const entityOptions = ref<EntityOption[]>([])
const entityLoadingError = ref<string | null>(null)
const isLoadingEntities = ref(true)

// Dimension filter options
const dimensionOptions = [
  { name: 'All Dimensions', value: undefined },
  { name: 'Einnahmen (Income)', value: 'einnahmen' },
  { name: 'Ausgaben (Expenses)', value: 'ausgaben' },
  { name: 'Ertrag (Revenue)', value: 'ertrag' },
  { name: 'Aufwand (Expenditure)', value: 'aufwand' },
  { name: 'Ord. Einnahmen Funk', value: 'ord_einnahmen_funk' },
  { name: 'Ord. Ausgaben Funk', value: 'ord_ausgaben_funk' },
]

// Computed properties
const availableYears = computed(() => DataLoader.getAvailableYears())

// Load entity options from JSON files
async function loadEntityOptions() {
  try {
    console.log('Starting entity options loading...')
    isLoadingEntities.value = true
    entityLoadingError.value = null

    const options = await loadAllEntityOptions()
    entityOptions.value = options

    console.log(`✓ Successfully loaded ${options.length} entity options`)
  } catch (error) {
    console.error('✗ Failed to load entity options:', error)

    if (error instanceof EntityLoadError) {
      entityLoadingError.value = error.message
    } else {
      entityLoadingError.value = 'Unknown error occurred while loading entity options'
    }

    entityOptions.value = []
  } finally {
    isLoadingEntities.value = false
  }
}

// Initialize component
onMounted(async () => {
  await loadEntityOptions()
})
</script>

<style scoped>
.v-card {
  margin-bottom: 1rem;
}
</style>
