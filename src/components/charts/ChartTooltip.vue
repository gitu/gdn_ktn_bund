<template>
  <div
    v-if="tooltip"
    class="chart-tooltip"
    :style="tooltipStyle(tooltip)"
    role="status"
    aria-live="polite"
    data-testid="chart-tooltip"
  >
    <div class="tooltip-title">{{ tooltip.title }}</div>
    <ul class="tooltip-rows">
      <li v-for="(row, index) in tooltip.rows" :key="index">
        <span
          v-if="row.color"
          class="tooltip-key"
          :class="row.shape === 'line' ? 'key-line' : 'key-rect'"
          :style="{ background: row.color }"
          aria-hidden="true"
        ></span>
        <!-- Values lead, labels follow: the reader knows the series and wants the number -->
        <strong class="tooltip-value">{{ row.value }}</strong>
        <span class="tooltip-label">{{ row.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { tooltipStyle, type TooltipState } from './chartTypes'

defineProps<{ tooltip: TooltipState | null }>()
</script>

<style scoped>
/* Position and maximum width come from tooltipStyle(); the width follows the content */
.chart-tooltip {
  position: absolute;
  z-index: 3;
  box-sizing: border-box;
  width: max-content;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-2);
  color: var(--gk-ink);
  font-size: 0.8125rem;
  line-height: 1.35;
  pointer-events: none;
}

.tooltip-title {
  margin-bottom: 0.25rem;
  color: var(--gk-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.tooltip-rows {
  display: grid;
  gap: 0.2rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tooltip-rows li {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: baseline;
  column-gap: 0.4rem;
  min-width: 0;
}

.tooltip-key {
  align-self: center;
}

.key-rect {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 2px;
}

.key-line {
  width: 0.85rem;
  height: 2px;
  border-radius: 1px;
}

.tooltip-value {
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  white-space: nowrap;
}

/* Long place names wrap instead of being cut off */
.tooltip-label {
  min-width: 0;
  color: var(--gk-muted);
  overflow-wrap: anywhere;
}
</style>
