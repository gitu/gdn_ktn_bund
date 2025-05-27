<template>
  <v-container fluid>
    <!-- Hero Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card
          class="pa-8 text-center"
          color="primary"
          dark
        >
          <v-card-title class="text-h3 mb-4">
            Swiss Financial Data Viewer
          </v-card-title>
          <v-card-subtitle class="text-h6 mb-6">
            Comprehensive analysis and comparison of Swiss financial data for municipalities, cantons, and federal entities
          </v-card-subtitle>
          <v-btn
            size="large"
            variant="outlined"
            color="white"
            class="mr-4"
            @click="$router.push('/enriched-data')"
          >
            <v-icon left>
              mdi-chart-line
            </v-icon>
            Explore Data
          </v-btn>
          <v-btn
            size="large"
            variant="outlined"
            color="white"
            @click="$router.push('/comparison')"
          >
            <v-icon left>
              mdi-compare
            </v-icon>
            Compare Entities
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Feature Cards -->
    <v-row>
      <v-col
        cols="12"
        md="4"
      >
        <v-card
          class="h-100"
          hover
          @click="$router.push('/enriched-data')"
        >
          <v-card-title class="d-flex align-center">
            <v-icon
              color="primary"
              class="mr-3"
            >
              mdi-chart-line
            </v-icon>
            Enriched Data Display
          </v-card-title>
          <v-card-text>
            <p>
              View detailed financial data with enriched descriptions in multiple languages.
              Analyze income, expenses, and balances for any Swiss entity.
            </p>
            <v-chip-group>
              <v-chip
                size="small"
                color="primary"
                variant="outlined"
              >
                Multi-language
              </v-chip>
              <v-chip
                size="small"
                color="primary"
                variant="outlined"
              >
                Interactive
              </v-chip>
              <v-chip
                size="small"
                color="primary"
                variant="outlined"
              >
                Detailed
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="text"
            >
              Explore Data
              <v-icon right>
                mdi-arrow-right
              </v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-card
          class="h-100"
          hover
          @click="$router.push('/comparison')"
        >
          <v-card-title class="d-flex align-center">
            <v-icon
              color="success"
              class="mr-3"
            >
              mdi-compare
            </v-icon>
            Comparison Tool
          </v-card-title>
          <v-card-text>
            <p>
              Compare financial data between different municipalities, cantons, or entities.
              Side-by-side analysis with scaling options.
            </p>
            <v-chip-group>
              <v-chip
                size="small"
                color="success"
                variant="outlined"
              >
                Side-by-side
              </v-chip>
              <v-chip
                size="small"
                color="success"
                variant="outlined"
              >
                Scalable
              </v-chip>
              <v-chip
                size="small"
                color="success"
                variant="outlined"
              >
                Visual
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="success"
              variant="text"
            >
              Start Comparing
              <v-icon right>
                mdi-arrow-right
              </v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-card
          class="h-100"
          hover
          @click="$router.push('/csv-test')"
        >
          <v-card-title class="d-flex align-center">
            <v-icon
              color="info"
              class="mr-3"
            >
              mdi-file-table
            </v-icon>
            CSV Test Page
          </v-card-title>
          <v-card-text>
            <p>
              Test and validate CSV data loading functionality.
              Useful for developers and data verification.
            </p>
            <v-chip-group>
              <v-chip
                size="small"
                color="info"
                variant="outlined"
              >
                Testing
              </v-chip>
              <v-chip
                size="small"
                color="info"
                variant="outlined"
              >
                Validation
              </v-chip>
              <v-chip
                size="small"
                color="info"
                variant="outlined"
              >
                Development
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="info"
              variant="text"
            >
              Test CSV
              <v-icon right>
                mdi-arrow-right
              </v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Statistics Section -->
    <v-row class="mt-8">
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-center">
            <v-icon
              color="primary"
              class="mr-2"
            >
              mdi-chart-bar
            </v-icon>
            Data Overview
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                cols="12"
                md="3"
                class="text-center"
              >
                <div class="text-h4 text-primary">
                  {{ entityCount }}
                </div>
                <div class="text-subtitle-1">
                  Total Entities
                </div>
              </v-col>
              <v-col
                cols="12"
                md="3"
                class="text-center"
              >
                <div class="text-h4 text-success">
                  {{ availableYears.length }}
                </div>
                <div class="text-subtitle-1">
                  Available Years
                </div>
              </v-col>
              <v-col
                cols="12"
                md="3"
                class="text-center"
              >
                <div class="text-h4 text-info">
                  4
                </div>
                <div class="text-subtitle-1">
                  Languages
                </div>
              </v-col>
              <v-col
                cols="12"
                md="3"
                class="text-center"
              >
                <div class="text-h4 text-warning">
                  {{ latestYear }}
                </div>
                <div class="text-subtitle-1">
                  Latest Year
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as DataLoader from '../utils/DataLoader'
import { loadAllEntityOptions } from '../utils/EntityLoader'

// Reactive data
const entityCount = ref(0)

// Computed properties
const availableYears = computed(() => DataLoader.getAvailableYears())
const latestYear = computed(() => DataLoader.getLatestYear())

// Load entity count
onMounted(async () => {
  try {
    const entities = await loadAllEntityOptions()
    entityCount.value = entities.length
  } catch (error) {
    console.error('Failed to load entity count:', error)
    entityCount.value = 0
  }
})
</script>

<style scoped>
.v-card {
  transition: transform 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
}

.h-100 {
  height: 100%;
}
</style>
