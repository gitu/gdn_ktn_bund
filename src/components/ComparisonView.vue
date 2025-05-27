<template>
  <v-card class="comparison-view">
    <v-card-title>
      <h2 class="text-h5">
        Financial Data Comparison
      </h2>
    </v-card-title>

    <v-card-text>
      <!-- Summary Statistics -->
      <v-row class="mb-6">
        <v-col
          cols="12"
          md="6"
        >
          <v-card
            variant="outlined"
            color="primary"
          >
            <v-card-title class="text-h6">
              Group A Summary
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between">
                <span>Total Records:</span>
                <strong>{{ dataA.length }}</strong>
              </div>
              <div class="d-flex justify-space-between">
                <span>Total Value:</span>
                <strong>{{ formatCurrency(totalValueA) }}</strong>
              </div>
              <div class="d-flex justify-space-between">
                <span>Average Value:</span>
                <strong>{{ formatCurrency(averageValueA) }}</strong>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <v-card
            variant="outlined"
            color="secondary"
          >
            <v-card-title class="text-h6">
              Group B Summary
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between">
                <span>Total Records:</span>
                <strong>{{ dataB.length }}</strong>
              </div>
              <div class="d-flex justify-space-between">
                <span>Total Value:</span>
                <strong>{{ formatCurrency(totalValueB) }}</strong>
              </div>
              <div class="d-flex justify-space-between">
                <span>Average Value:</span>
                <strong>{{ formatCurrency(averageValueB) }}</strong>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Comparison Table -->
      <v-data-table
        :headers="comparisonHeaders"
        :items="comparisonData"
        :items-per-page="15"
        class="elevation-1"
        item-value="id"
      >
        <!-- Category Column -->
        <template #item.category="{ item }">
          <div class="font-weight-medium">
            {{ item.category }}
          </div>
        </template>

        <!-- Group A Value -->
        <template #item.valueA="{ item }">
          <div class="text-right">
            <div class="font-weight-bold text-primary">
              {{ formatCurrency(item.valueA) }}
            </div>
            <div
              v-if="scaleToOne"
              class="text-caption text-grey"
            >
              ({{ formatCurrency(item.originalValueA) }} original)
            </div>
          </div>
        </template>

        <!-- Group B Value -->
        <template #item.valueB="{ item }">
          <div class="text-right">
            <div class="font-weight-bold text-secondary">
              {{ formatCurrency(item.valueB) }}
            </div>
            <div
              v-if="scaleToOne"
              class="text-caption text-grey"
            >
              ({{ formatCurrency(item.originalValueB) }} original)
            </div>
          </div>
        </template>

        <!-- Difference -->
        <template #item.difference="{ item }">
          <div class="text-right">
            <v-chip
              :color="item.difference >= 0 ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              {{ item.difference >= 0 ? '+' : '' }}{{ formatCurrency(item.difference) }}
            </v-chip>
          </div>
        </template>

        <!-- Ratio -->
        <template #item.ratio="{ item }">
          <div class="text-center">
            <v-progress-linear
              :model-value="Math.min(Math.abs(item.ratio) * 100, 100)"
              :color="item.ratio >= 1 ? 'primary' : 'secondary'"
              height="20"
              rounded
            >
              <span class="text-caption font-weight-bold">
                {{ item.ratio.toFixed(2) }}
              </span>
            </v-progress-linear>
          </div>
        </template>
      </v-data-table>

      <!-- Scaling Information -->
      <v-alert
        v-if="scaleToOne"
        type="info"
        variant="tonal"
        class="mt-4"
      >
        <v-alert-title>Scaling Applied</v-alert-title>
        Data has been scaled to match totals for better comparison. 
        Original values are shown in parentheses.
        <br>
        <strong>Scaling Factor A:</strong> {{ scalingFactorA.toFixed(4) }}
        <br>
        <strong>Scaling Factor B:</strong> {{ scalingFactorB.toFixed(4) }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type RecordType } from '../types'

// Props interface
interface Props {
  dataA: RecordType[]
  dataB: RecordType[]
  scaleToOne: boolean
}

const props = defineProps<Props>()

// Table headers
const comparisonHeaders = [
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Group A Value', key: 'valueA', sortable: true, align: 'end' as const },
  { title: 'Group B Value', key: 'valueB', sortable: true, align: 'end' as const },
  { title: 'Difference', key: 'difference', sortable: true, align: 'end' as const },
  { title: 'Ratio (A/B)', key: 'ratio', sortable: true, align: 'center' as const },
]

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Computed properties for summary statistics
const totalValueA = computed(() => {
  return props.dataA.reduce((sum, record) => sum + record.value, 0)
})

const totalValueB = computed(() => {
  return props.dataB.reduce((sum, record) => sum + record.value, 0)
})

const averageValueA = computed(() => {
  return props.dataA.length > 0 ? totalValueA.value / props.dataA.length : 0
})

const averageValueB = computed(() => {
  return props.dataB.length > 0 ? totalValueB.value / props.dataB.length : 0
})

// Scaling factors
const scalingFactorA = computed(() => {
  if (!props.scaleToOne || totalValueA.value === 0) return 1
  const maxTotal = Math.max(totalValueA.value, totalValueB.value)
  return maxTotal / totalValueA.value
})

const scalingFactorB = computed(() => {
  if (!props.scaleToOne || totalValueB.value === 0) return 1
  const maxTotal = Math.max(totalValueA.value, totalValueB.value)
  return maxTotal / totalValueB.value
})

// Comparison data
const comparisonData = computed(() => {
  // Group data by category (arten)
  const categoriesA = new Map<string, number>()
  const categoriesB = new Map<string, number>()

  // Aggregate values by category for Group A
  props.dataA.forEach(record => {
    const current = categoriesA.get(record.arten) || 0
    categoriesA.set(record.arten, current + record.value)
  })

  // Aggregate values by category for Group B
  props.dataB.forEach(record => {
    const current = categoriesB.get(record.arten) || 0
    categoriesB.set(record.arten, current + record.value)
  })

  // Get all unique categories
  const allCategories = new Set([...categoriesA.keys(), ...categoriesB.keys()])

  // Create comparison data
  return Array.from(allCategories).map(category => {
    const originalValueA = categoriesA.get(category) || 0
    const originalValueB = categoriesB.get(category) || 0
    
    const valueA = props.scaleToOne ? originalValueA * scalingFactorA.value : originalValueA
    const valueB = props.scaleToOne ? originalValueB * scalingFactorB.value : originalValueB
    
    const difference = valueA - valueB
    const ratio = valueB !== 0 ? valueA / valueB : (valueA > 0 ? Infinity : 0)

    return {
      id: category,
      category,
      valueA,
      valueB,
      originalValueA,
      originalValueB,
      difference,
      ratio: ratio === Infinity ? 999 : ratio
    }
  }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
})
</script>

<style scoped>
.comparison-view {
  margin-bottom: 1rem;
}

.v-progress-linear {
  border-radius: 10px;
}

.text-caption {
  font-size: 0.75rem;
}
</style>
