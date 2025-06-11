<template>
  <div class="unit-scaling-demo">
    <div class="demo-header">
      <h2>{{ $t('unitScaling.title') }}</h2>
      <p>{{ $t('unitScaling.description') }}</p>
    </div>

    <!-- Configuration Panel -->
    <div class="config-panel">
      <h3>{{ $t('unitScaling.settings.title') }}</h3>
      
      <div class="config-grid">
        <div class="config-item">
          <label class="config-label">
            <input
              type="checkbox"
              v-model="userPreferences.enableScaling"
              @change="toggleScaling"
            />
            {{ $t('unitScaling.settings.enableScaling') }}
          </label>
        </div>

        <div class="config-item">
          <label class="config-label">
            <input
              type="checkbox"
              v-model="userPreferences.preferAbbreviated"
              @change="toggleAbbreviation"
              :disabled="!userPreferences.enableScaling"
            />
            {{ $t('unitScaling.settings.useAbbreviated') }}
          </label>
        </div>

        <div class="config-item">
          <label class="config-label">
            {{ $t('unitScaling.settings.threshold') }}:
            <input
              type="number"
              :value="userPreferences.customThreshold"
              @input="handleThresholdInput"
              :disabled="!userPreferences.enableScaling"
              min="0"
              step="100"
              class="number-input"
            />
          </label>
          <small>{{ $t('unitScaling.settings.thresholdDescription') }}</small>
        </div>

        <div class="config-item">
          <label class="config-label">
            {{ $t('unitScaling.settings.precision') }}:
            <input
              type="number"
              :value="userPreferences.customPrecision"
              @input="handlePrecisionInput"
              :disabled="!userPreferences.enableScaling"
              min="0"
              max="10"
              step="1"
              class="number-input"
            />
          </label>
          <small>{{ $t('unitScaling.settings.precisionDescription') }}</small>
        </div>
      </div>
    </div>

    <!-- Examples Section -->
    <div class="examples-section">
      <h3>{{ $t('unitScaling.examples.title') }}</h3>
      
      <div class="examples-grid">
        <div
          v-for="example in examples"
          :key="example.value"
          class="example-item"
        >
          <div class="example-input">{{ example.value.toLocaleString() }}</div>
          <div class="example-arrow">→</div>
          <div class="example-output">{{ formatNumber(example.value).formatted }}</div>
        </div>
      </div>
    </div>

    <!-- Currency Examples -->
    <div class="currency-section">
      <h3>Currency Formatting</h3>
      
      <div class="currency-grid">
        <div
          v-for="example in currencyExamples"
          :key="example.value"
          class="currency-item"
        >
          <div class="currency-input">{{ example.value.toLocaleString() }} CHF</div>
          <div class="currency-arrow">→</div>
          <div class="currency-output">{{ formatCurrency(example.value, 'CHF').formatted }}</div>
        </div>
      </div>
    </div>

    <!-- Interactive Demo -->
    <div class="interactive-section">
      <h3>Interactive Demo</h3>
      
      <div class="interactive-demo">
        <label class="demo-label">
          Enter a number:
          <input
            type="number"
            v-model.number="customValue"
            class="demo-input"
            placeholder="Enter a number..."
          />
        </label>
        
        <div class="demo-results">
          <div class="demo-result">
            <strong>Number:</strong> {{ formatNumber(customValue).formatted }}
          </div>
          <div class="demo-result">
            <strong>Currency:</strong> {{ formatCurrency(customValue, 'CHF').formatted }}
          </div>
          <div class="demo-result">
            <strong>USD:</strong> {{ formatCurrency(customValue, 'USD').formatted }}
          </div>
        </div>
      </div>
    </div>

    <!-- Technical Details -->
    <div class="technical-section">
      <h3>Technical Details</h3>
      
      <div class="technical-info">
        <div class="tech-item">
          <strong>Current Locale:</strong> {{ currentLocale }}
        </div>
        <div class="tech-item">
          <strong>Scaling Enabled:</strong> {{ userPreferences.enableScaling }}
        </div>
        <div class="tech-item">
          <strong>Threshold:</strong> {{ userPreferences.customThreshold.toLocaleString() }}
        </div>
        <div class="tech-item">
          <strong>Precision:</strong> {{ userPreferences.customPrecision }}
        </div>
        <div class="tech-item">
          <strong>Use Abbreviated:</strong> {{ userPreferences.preferAbbreviated }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfigurableUnitScaling } from '@/composables/useUnitScaling'

// Vue i18n
const { t } = useI18n()

// Unit scaling composable
const {
  formatNumber,
  formatCurrency,
  userPreferences,
  toggleScaling,
  toggleAbbreviation,
  setThreshold,
  setPrecision,
  currentLocale,
} = useConfigurableUnitScaling()

// Demo data
const customValue = ref(1500)

const examples = [
  { value: 999 },
  { value: 1000 },
  { value: 1500 },
  { value: 12500 },
  { value: 1000000 },
  { value: 2500000 },
  { value: 1000000000 },
  { value: 3500000000 },
  { value: 1000000000000 },
]

const currencyExamples = [
  { value: 1500 },
  { value: 25000 },
  { value: 1000000 },
  { value: 2500000000 },
]

// Event handlers
const handleThresholdInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  setThreshold(Number(target.value))
}

const handlePrecisionInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  setPrecision(Number(target.value))
}
</script>

<style scoped>
.unit-scaling-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 2rem;
}

.demo-header h2 {
  color: var(--primary-color, #2563eb);
  margin-bottom: 0.5rem;
}

.config-panel {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.number-input {
  width: 80px;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 4px;
  margin-left: 0.5rem;
}

.examples-section,
.currency-section,
.interactive-section,
.technical-section {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.examples-grid,
.currency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.example-item,
.currency-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-ground, #f8fafc);
  border-radius: 6px;
  font-family: monospace;
}

.example-arrow,
.currency-arrow {
  color: var(--primary-color, #2563eb);
  font-weight: bold;
}

.example-output,
.currency-output {
  color: var(--primary-color, #2563eb);
  font-weight: 600;
}

.interactive-demo {
  margin-top: 1rem;
}

.demo-label {
  display: block;
  font-weight: 500;
  margin-bottom: 1rem;
}

.demo-input {
  display: block;
  width: 200px;
  padding: 0.5rem;
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 4px;
  margin-top: 0.5rem;
  font-size: 1rem;
}

.demo-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.demo-result {
  padding: 0.75rem;
  background: var(--surface-ground, #f8fafc);
  border-radius: 6px;
  font-family: monospace;
}

.technical-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.tech-item {
  padding: 0.5rem;
  background: var(--surface-ground, #f8fafc);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
}

small {
  color: var(--text-color-secondary, #6b7280);
  font-size: 0.75rem;
}

h3 {
  color: var(--text-color, #1f2937);
  margin-bottom: 0.5rem;
}
</style>
