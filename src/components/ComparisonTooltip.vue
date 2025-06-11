<template>
  <div
    v-if="comparison && showTooltip"
    class="comparison-tooltip"
    :class="tooltipClasses"
  >
    <div class="tooltip-content">
      <div class="comparison-header">
        <span class="comparison-type">{{ comparisonTypeLabel }}</span>
        <button
          @click="$emit('remove')"
          class="remove-button"
          :title="$t('comparison.removeComparison')"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
      
      <div class="comparison-details">
        <div class="comparison-values">
          <div class="value-row">
            <span class="label">{{ $t('comparison.base') }}:</span>
            <span class="value">{{ formatValue(comparison.base.value) }}</span>
            <span class="entity">{{ comparison.base.displayName }}</span>
          </div>
          <div class="value-row">
            <span class="label">{{ $t('comparison.target') }}:</span>
            <span class="value">{{ formatValue(comparison.target.value) }}</span>
            <span class="entity">{{ comparison.target.displayName }}</span>
          </div>
        </div>
        
        <div class="comparison-result">
          <div class="percentage-change" :class="changeClasses">
            <i :class="changeIcon"></i>
            <span class="change-value">{{ formattedPercentageChange }}</span>
          </div>
          
          <div v-if="showAbsoluteChange" class="absolute-change">
            <span class="change-label">{{ $t('comparison.absoluteChange') }}:</span>
            <span class="change-value">{{ formattedAbsoluteChange }}</span>
          </div>
        </div>
        
        <div v-if="!comparison.isValid" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ $t('comparison.calculationError') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ActiveComparison } from '@/types/FinancialComparison'

interface Props {
  comparison: ActiveComparison | null
  showTooltip?: boolean
  showAbsoluteChange?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface Emits {
  remove: []
}

const props = withDefaults(defineProps<Props>(), {
  showTooltip: true,
  showAbsoluteChange: false,
  position: 'top'
})

defineEmits<Emits>()
const { t, locale } = useI18n()

const comparisonTypeLabel = computed(() => {
  if (!props.comparison) return ''
  return props.comparison.base.type === 'cell-to-cell' 
    ? t('comparison.cellToCell')
    : t('comparison.columnToColumn')
})

const formattedPercentageChange = computed(() => {
  if (!props.comparison || !props.comparison.isValid) return 'N/A'
  
  const change = props.comparison.percentageChange
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
})

const formattedAbsoluteChange = computed(() => {
  if (!props.comparison || !props.comparison.isValid) return 'N/A'
  
  const change = props.comparison.absoluteChange
  const sign = change >= 0 ? '+' : ''
  return `${sign}${formatValue(Math.abs(change))}`
})

const changeClasses = computed(() => {
  if (!props.comparison || !props.comparison.isValid) return 'neutral'
  
  const change = props.comparison.percentageChange
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return 'neutral'
})

const changeIcon = computed(() => {
  if (!props.comparison || !props.comparison.isValid) return 'pi pi-minus'
  
  const change = props.comparison.percentageChange
  if (change > 0) return 'pi pi-arrow-up'
  if (change < 0) return 'pi pi-arrow-down'
  return 'pi pi-minus'
})

const tooltipClasses = computed(() => [
  `tooltip-${props.position}`,
  {
    'tooltip-error': props.comparison && !props.comparison.isValid
  }
])

const formatValue = (value: number): string => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
</script>

<style scoped>
.comparison-tooltip {
  position: absolute;
  z-index: 1000;
  background: var(--surface-overlay);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  min-width: 280px;
  max-width: 400px;
  font-size: 0.875rem;
  line-height: 1.4;
}

.tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
}

.tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
}

.tooltip-error {
  border-color: var(--red-500);
  background: var(--red-50);
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--surface-border);
}

.comparison-type {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.remove-button {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  transition: all 0.2s;
}

.remove-button:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.comparison-values {
  margin-bottom: 10px;
}

.value-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
}

.value-row .label {
  font-weight: 500;
  color: var(--text-color-secondary);
  min-width: 40px;
}

.value-row .value {
  font-family: monospace;
  font-weight: 600;
  color: var(--text-color);
  text-align: right;
}

.value-row .entity {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comparison-result {
  padding: 8px;
  background: var(--surface-ground);
  border-radius: 4px;
  margin-bottom: 6px;
}

.percentage-change {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 1rem;
}

.percentage-change.positive {
  color: var(--green-600);
}

.percentage-change.negative {
  color: var(--red-600);
}

.percentage-change.neutral {
  color: var(--text-color-secondary);
}

.absolute-change {
  margin-top: 4px;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.change-label {
  margin-right: 4px;
}

.change-value {
  font-family: monospace;
  font-weight: 600;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--red-600);
  font-size: 0.75rem;
  background: var(--red-50);
  padding: 6px;
  border-radius: 3px;
  border: 1px solid var(--red-200);
}
</style>
