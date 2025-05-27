<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-title>Swiss Financial Data Viewer</v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- Global Language Selector -->
      <v-select
        v-model="globalLanguage"
        :items="languageOptions"
        item-title="name"
        item-value="code"
        label="Language"
        variant="outlined"
        density="compact"
        style="max-width: 150px;"
        class="mr-4"
      ></v-select>

      <v-btn
        @click="showEnrichedView = !showEnrichedView"
        variant="outlined"
        color="white"
      >
        {{ showEnrichedView ? 'Show Comparison' : 'Show Enriched Data' }}
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
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
          Successfully loaded {{ entityOptions.length }} entity options ({{ entityOptions.filter(e => e.type === 'GDN').length }} municipalities, {{ entityOptions.filter(e => e.type === 'STD').length }} standard entities).
        </v-alert>
        <!-- Enriched Data Display View -->
        <div v-if="showEnrichedView">
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
        </div>

        <!-- Original Comparison View -->
        <div v-else>
          <v-row class="mb-4">
            <v-col cols="12">
              <v-card>
                <v-card-title>Financial Comparison Tool</v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="selectedYear"
                        :items="availableYears"
                        label="Select Year"
                        variant="outlined"
                      ></v-select>
                      <v-chip
                        v-if="selectedYear === latestYear"
                        color="success"
                        size="small"
                        class="mt-2"
                      >
                        Latest
                      </v-chip>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="selectedGroupA"
                        :items="municipalities"
                        label="Select Group A"
                        variant="outlined"
                        multiple
                        chips
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="selectedGroupB"
                        :items="municipalities"
                        label="Select Group B"
                        variant="outlined"
                        multiple
                        chips
                      ></v-select>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-switch
                        v-model="scaleToOne"
                        label="Scale to match totals"
                        color="primary"
                      ></v-switch>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Comparison Results -->
          <div v-if="dataA.length > 0 && dataB.length > 0">
            <ComparisonView
              :data-a="dataA"
              :data-b="dataB"
              :scale-to-one="scaleToOne"
            />
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { type RecordType } from './types'
import * as DataLoader from './utils/DataLoader'
import { loadAllEntityOptions, type EntityOption, EntityLoadError } from './utils/EntityLoader'
import EnrichedDataDisplay from './components/EnrichedDataDisplay.vue'
import ComparisonView from './components/ComparisonView.vue'

// Global state
const globalLanguage = ref<'de' | 'fr' | 'it' | 'en'>('de')
const showEnrichedView = ref(true)

// Language options
const languageOptions = [
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'en', name: 'English' },
] as const

// Financial data state
const selectedYear = ref<string>('2020') // Use a year we know has data
const selectedEntity = ref<string>('ktn_zh')
const selectedDimension = ref<string | undefined>(undefined)
const enableComparison = ref(false)
const comparisonEntityA = ref<string>('ktn_zh')
const comparisonEntityB = ref<string>('gdn_010176')

// Original comparison tool state
const selectedGroupA = ref<string[]>([])
const selectedGroupB = ref<string[]>([])
const scaleToOne = ref(false)
const data = ref<RecordType[]>(DataLoader.getAllDataForYear(selectedYear.value))

// Entity options for enriched data display (loaded from JSON files)
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
const latestYear = computed(() => DataLoader.getLatestYear())
const municipalities = computed(() => DataLoader.getAvailableMunicipalities())

const dataA = computed(() => {
  if (selectedGroupA.value.length === 0) return []
  return data.value.filter(record => selectedGroupA.value.includes(record.gemeinde))
})

const dataB = computed(() => {
  if (selectedGroupB.value.length === 0) return []
  return data.value.filter(record => selectedGroupB.value.includes(record.gemeinde))
})

// Watch for year changes to reload data
watch(selectedYear, (newYear) => {
  data.value = DataLoader.getAllDataForYear(newYear)
})

// Load entity options from JSON files
async function loadEntityOptions() {
  try {
    console.log('Starting entity options loading...')
    isLoadingEntities.value = true
    entityLoadingError.value = null

    const options = await loadAllEntityOptions()
    entityOptions.value = options

    console.log(`✓ Successfully loaded ${options.length} entity options`)
    console.log('Sample entities:', options.slice(0, 3))
  } catch (error) {
    console.error('✗ Failed to load entity options:', error)

    if (error instanceof EntityLoadError) {
      entityLoadingError.value = error.message
    } else {
      entityLoadingError.value = 'Unknown error occurred while loading entity options'
    }

    // Fallback to empty array
    entityOptions.value = []
  } finally {
    isLoadingEntities.value = false
    console.log('Entity loading completed. Loading state:', isLoadingEntities.value)
  }
}

// Initialize component
onMounted(async () => {
  // Set initial data
  data.value = DataLoader.getAllDataForYear(selectedYear.value)

  // Load entity options
  await loadEntityOptions()
})
</script>

<style scoped>
.v-application {
  font-family: 'Roboto', sans-serif;
}

.v-card {
  margin-bottom: 1rem;
}

.v-chip {
  margin: 2px;
}
</style>
