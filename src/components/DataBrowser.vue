<template>
  <div class="data-browser">
    <div class="browser-header">
      <h3>{{ title || t('dataBrowser.title') }}</h3>
    </div>

    <div class="search-section">
      <div class="search-input-group">
        <input
          v-model="filters.searchQuery"
          type="text"
          :placeholder="t('dataBrowser.searchPlaceholder')"
          class="search-input"
          @input="handleSearch"
        />
        <button @click="clearSearch" class="clear-button" v-if="filters.searchQuery">×</button>
      </div>

      <div class="filter-controls">
        <div class="filter-group">
          <label>{{ t('dataBrowser.filters.dataType') }}:</label>
          <select v-model="filters.dataType" @change="handleFilterChange">
            <option value="all">{{ t('dataBrowser.filterOptions.all') }}</option>
            <option value="std">{{ t('dataBrowser.filterOptions.std') }}</option>
            <option value="gdn">{{ t('dataBrowser.filterOptions.gdn') }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>{{ t('dataBrowser.filters.yearRange') }}:</label>
          <div class="year-range">
            <input
              v-model="filters.yearRange.start"
              type="number"
              :placeholder="t('dataBrowser.filters.yearFrom')"
              min="2015"
              max="2023"
              class="year-input"
              @input="handleFilterChange"
            />
            <span>-</span>
            <input
              v-model="filters.yearRange.end"
              type="number"
              :placeholder="t('dataBrowser.filters.yearTo')"
              min="2015"
              max="2023"
              class="year-input"
              @input="handleFilterChange"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="results-section">
      <div class="results-header">
        <span class="results-count">
          {{
            t('dataBrowser.resultsCount', {
              count: filteredResults.length,
              total: searchResults.length,
            })
          }}
        </span>
        <div class="view-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.showDescriptions" />
            {{ t('dataBrowser.viewOptions.showDescriptions') }}
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.showYearRange" />
            {{ t('dataBrowser.viewOptions.showYearRange') }}
          </label>
        </div>
      </div>

      <div v-if="loading" class="loading">
        {{ t('dataBrowser.loading') }}
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else-if="filteredResults.length === 0" class="no-results">
        {{ t('dataBrowser.noResults') }}
      </div>

      <div v-else class="results-list">
        <div
          v-for="result in paginatedResults"
          :key="result.id"
          class="result-item"
          :class="{ 'std-item': result.type === 'std', 'gdn-item': result.type === 'gdn' }"
          @click="selectResult(result)"
        >
          <div class="result-header">
            <h4 class="result-title">
              {{ result.displayName[locale as keyof MultiLanguageLabels] }}
            </h4>
            <span class="result-type">{{ result.type.toUpperCase() }}</span>
          </div>

          <div v-if="config.showDescriptions" class="result-description">
            {{ result.description[locale as keyof MultiLanguageLabels] }}
          </div>

          <div class="result-metadata">
            <span v-if="config.showYearRange" class="year-range">
              {{ getYearRangeText(result.availableYears) }}
            </span>
            <span v-if="result.municipalityNumber" class="municipality-number">
              Nr. {{ result.municipalityNumber }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-button"
        >
          ‹
        </button>
        <span class="page-info"> {{ currentPage }} / {{ totalPages }} </span>
        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-button"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  StdDataInfo,
  GdnDataInfo,
  AvailableDataEntry,
  DataBrowserFilters,
  DataBrowserConfig,
  MultiLanguageLabels,
} from '../types/DataStructures'
import { EntitySemanticMapper } from '../utils/EntitySemanticMapper'

interface Props {
  title?: string
  initialConfig?: Partial<DataBrowserConfig>
  maxResultsPerPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Data Browser',
  maxResultsPerPage: 20,
})

const emit = defineEmits<{
  resultSelected: [result: AvailableDataEntry]
  error: [error: string]
}>()

// Use Vue i18n
const { locale, t } = useI18n()

// Reactive state
const loading = ref(false)
const error = ref<string | null>(null)
const stdData = ref<StdDataInfo[]>([])
const gdnData = ref<GdnDataInfo[]>([])
const searchResults = ref<AvailableDataEntry[]>([])
const currentPage = ref(1)

// Configuration (removed language since it's now handled by i18n)
const config = ref<Omit<DataBrowserConfig, 'language'>>({
  showDescriptions: true,
  showYearRange: true,
  maxResults: 100,
  ...props.initialConfig,
})

// Filters
const filters = ref<DataBrowserFilters>({
  searchQuery: '',
  dataType: 'all',
  yearRange: {},
})

// Computed properties
const filteredResults = computed(() => {
  let results = searchResults.value

  // Apply data type filter
  if (filters.value.dataType !== 'all') {
    results = results.filter((result: AvailableDataEntry) => result.type === filters.value.dataType)
  }

  // Apply year range filter
  if (filters.value.yearRange.start || filters.value.yearRange.end) {
    results = results.filter((result: AvailableDataEntry) => {
      const years = result.availableYears.map((y: string) => parseInt(y))
      const minYear = Math.min(...years)
      const maxYear = Math.max(...years)

      if (filters.value.yearRange.start && maxYear < parseInt(filters.value.yearRange.start)) {
        return false
      }
      if (filters.value.yearRange.end && minYear > parseInt(filters.value.yearRange.end)) {
        return false
      }
      return true
    })
  }

  return results.slice(0, config.value.maxResults)
})

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / props.maxResultsPerPage)
})

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * props.maxResultsPerPage
  const end = start + props.maxResultsPerPage
  return filteredResults.value.slice(start, end)
})

// Methods
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    // Load STD data info
    const stdResponse = await fetch('/data/std-info.json')
    if (!stdResponse.ok) throw new Error('Failed to load STD data info')
    stdData.value = await stdResponse.json()

    // Load GDN data info
    const gdnResponse = await fetch('/data/gdn-info.json')
    if (!gdnResponse.ok) throw new Error('Failed to load GDN data info')
    gdnData.value = await gdnResponse.json()

    // Process data into search results
    processDataIntoResults()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error loading data'
    error.value = errorMessage
    emit('error', errorMessage)
  } finally {
    loading.value = false
  }
}

const processDataIntoResults = () => {
  const results: AvailableDataEntry[] = []

  // Process STD data - only include 'fs' model data
  stdData.value.forEach((entry) => {
    if (!entry.models || !Array.isArray(entry.models)) return // Skip entries without models array

    const fsModel = entry.models.find((model) => model.model === 'fs')
    if (!fsModel) return // Skip entries without 'fs' model

    const displayName = EntitySemanticMapper.getEntityDisplayName(entry.hh)
    const description = EntitySemanticMapper.getEntityDescription(entry.hh)
    const availableYears = fsModel.jahre ? fsModel.jahre.sort() : []

    results.push({
      id: `std-${entry.hh}`,
      type: 'std',
      entityCode: entry.hh,
      displayName,
      description,
      availableYears,
    })
  })

  // Process GDN data - only include 'fs' model data
  gdnData.value.forEach((entry) => {
    if (!entry.models || !Array.isArray(entry.models)) return // Skip entries without models array

    const fsModel = entry.models.find((m) => m.model === 'fs')
    if (!fsModel) return // Skip entries without 'fs' model

    const displayName: MultiLanguageLabels = {
      de: entry.gemeinde,
      fr: entry.gemeinde,
      it: entry.gemeinde,
      en: entry.gemeinde,
    }
    const description: MultiLanguageLabels = {
      de: t('dataBrowser.municipalityData', { name: entry.gemeinde }),
      fr: t('dataBrowser.municipalityData', { name: entry.gemeinde }),
      it: t('dataBrowser.municipalityData', { name: entry.gemeinde }),
      en: t('dataBrowser.municipalityData', { name: entry.gemeinde }),
    }

    results.push({
      id: `gdn-${entry.nr}`,
      type: 'gdn',
      entityCode: entry.nr,
      displayName,
      description,
      availableYears: fsModel.jahre ? fsModel.jahre.sort() : [],
      municipalityNumber: entry.nr,
    })
  })

  searchResults.value = results
}

const handleSearch = () => {
  currentPage.value = 1
  performSearch()
}

const performSearch = () => {
  if (!filters.value.searchQuery.trim()) {
    return // All results are already shown
  }

  const query = filters.value.searchQuery.toLowerCase()
  searchResults.value = searchResults.value.filter((result: AvailableDataEntry) => {
    // Search in display name
    const displayName = result.displayName[locale.value as keyof MultiLanguageLabels].toLowerCase()
    if (displayName.includes(query)) return true

    // Search in description
    const description = result.description[locale.value as keyof MultiLanguageLabels].toLowerCase()
    if (description.includes(query)) return true

    // Search in entity code
    if (result.entityCode.toLowerCase().includes(query)) return true

    // Search in municipality number for GDN entries
    if (result.municipalityNumber && result.municipalityNumber.includes(query)) return true

    return false
  })
}

const clearSearch = () => {
  filters.value.searchQuery = ''
  processDataIntoResults() // Reset to all results
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const selectResult = (result: AvailableDataEntry) => {
  emit('resultSelected', result)
}

const getYearRangeText = (years: string[]): string => {
  if (years.length === 0) return ''
  const sortedYears = years.sort()
  const first = sortedYears[0]
  const last = sortedYears[sortedYears.length - 1]
  return first === last ? first : `${first}-${last}`
}

// Watchers
watch(
  () => filters.value.searchQuery,
  () => {
    if (filters.value.searchQuery.trim()) {
      performSearch()
    } else {
      processDataIntoResults()
    }
  },
)

watch(locale, () => {
  // Re-process results when language changes to update display names
  processDataIntoResults()
})

// Lifecycle
onMounted(() => {
  loadData()
})

// Expose methods for parent components
defineExpose({
  loadData,
  clearSearch,
  selectResult: (id: string) => {
    const result = searchResults.value.find((r: AvailableDataEntry) => r.id === id)
    if (result) selectResult(result)
  },
})
</script>
