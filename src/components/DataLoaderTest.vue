<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>DataLoader Test Component</v-card-title>
          <v-card-subtitle>Testing the updated DataLoader with correct directory structure</v-card-subtitle>
          
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="testEntityId"
                  label="Entity ID"
                  hint="e.g., 010176 (GDN) or ktn_zh (STD)"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="testYear"
                  label="Year"
                  hint="e.g., 2020"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="testModel"
                  label="Model"
                  hint="e.g., fs"
                  variant="outlined"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12">
                <v-btn
                  @click="testDataLoading"
                  color="primary"
                  :loading="isLoading"
                  :disabled="!testEntityId || !testYear"
                >
                  Test Data Loading
                </v-btn>
                
                <v-btn
                  @click="testPathConstruction"
                  color="secondary"
                  class="ml-2"
                  :disabled="!testEntityId || !testYear"
                >
                  Test Path Construction
                </v-btn>
                
                <v-btn
                  @click="clearResults"
                  color="warning"
                  class="ml-2"
                  variant="outlined"
                >
                  Clear Results
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Results Section -->
    <v-row v-if="results.length > 0 || error">
      <v-col cols="12">
        <v-card>
          <v-card-title>Test Results</v-card-title>
          
          <!-- Error Display -->
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="ma-4"
          >
            <v-alert-title>Error</v-alert-title>
            {{ error }}
          </v-alert>
          
          <!-- Success Display -->
          <v-alert
            v-if="results.length > 0 && !error"
            type="success"
            variant="tonal"
            class="ma-4"
          >
            <v-alert-title>Success</v-alert-title>
            Loaded {{ results.length }} records successfully!
          </v-alert>
          
          <!-- Path Information -->
          <v-card-text v-if="constructedPath">
            <v-chip color="info" variant="outlined" class="mb-4">
              <v-icon left>mdi-folder</v-icon>
              Path: {{ constructedPath }}
            </v-chip>
          </v-card-text>
          
          <!-- Data Table -->
          <v-card-text v-if="results.length > 0">
            <v-data-table
              :headers="tableHeaders"
              :items="results.slice(0, 10)"
              :items-per-page="10"
              class="elevation-1"
            >
              <template v-slot:item.betrag="{ item }">
                <span class="font-weight-bold">
                  {{ formatCurrency(item.betrag) }}
                </span>
              </template>
            </v-data-table>
            
            <v-alert
              v-if="results.length > 10"
              type="info"
              variant="text"
              class="mt-4"
            >
              Showing first 10 of {{ results.length }} records
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Cache Information -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Cache Information</v-card-title>
          <v-card-text>
            <v-chip color="primary" variant="outlined" class="mr-2">
              Cache Size: {{ cacheStats.size }}
            </v-chip>
            <v-btn
              @click="refreshCacheStats"
              color="primary"
              variant="text"
              size="small"
            >
              Refresh
            </v-btn>
            
            <div v-if="cacheStats.keys.length > 0" class="mt-4">
              <h4>Cached Keys:</h4>
              <v-chip
                v-for="key in cacheStats.keys"
                :key="key"
                size="small"
                class="ma-1"
                variant="outlined"
              >
                {{ key }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadEntityData, constructDataPath, getCacheStats, type DataLoadError } from '../utils/DataLoader'
import type { RecordType } from '../types'

// Test parameters
const testEntityId = ref('010176')
const testYear = ref('2020')
const testModel = ref('fs')

// Results
const results = ref<RecordType[]>([])
const error = ref<string | null>(null)
const isLoading = ref(false)
const constructedPath = ref<string>('')
const cacheStats = ref({ size: 0, keys: [] as string[] })

// Table headers
const tableHeaders = [
  { title: 'Year', key: 'jahr', sortable: true },
  { title: 'Nr', key: 'nr', sortable: true },
  { title: 'Municipality', key: 'gemeinde', sortable: true },
  { title: 'Account', key: 'konto', sortable: true },
  { title: 'Function', key: 'funktion', sortable: true },
  { title: 'Amount', key: 'betrag', sortable: true, align: 'end' as const },
]

// Test data loading
async function testDataLoading() {
  isLoading.value = true
  error.value = null
  results.value = []
  
  try {
    console.log(`Testing data loading for: ${testEntityId.value}, ${testYear.value}, ${testModel.value}`)
    
    const data = await loadEntityData(testEntityId.value, testYear.value, testModel.value)
    results.value = data
    
    console.log(`✓ Successfully loaded ${data.length} records`)
    
  } catch (err) {
    console.error('✗ Data loading failed:', err)
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Unknown error occurred'
    }
  } finally {
    isLoading.value = false
    refreshCacheStats()
  }
}

// Test path construction
function testPathConstruction() {
  try {
    constructedPath.value = constructDataPath(testEntityId.value, testYear.value, testModel.value)
    console.log(`Constructed path: ${constructedPath.value}`)
  } catch (err) {
    console.error('Path construction failed:', err)
    error.value = err instanceof Error ? err.message : 'Path construction failed'
  }
}

// Clear results
function clearResults() {
  results.value = []
  error.value = null
  constructedPath.value = ''
}

// Refresh cache stats
function refreshCacheStats() {
  cacheStats.value = getCacheStats()
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Initialize
onMounted(() => {
  refreshCacheStats()
})
</script>

<style scoped>
.v-card {
  margin-bottom: 1rem;
}
</style>
