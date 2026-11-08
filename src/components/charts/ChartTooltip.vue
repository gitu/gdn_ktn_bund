<template>
  <div
    v-if="tooltip"
    class="chart-tooltip"
    :class="`side-${tooltip.side}`"
    :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
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
import type { TooltipState } from './chartTypes'

defineProps<{ tooltip: TooltipState | null }>()
</script>

<style scoped>
.chart-tooltip {
  position: absolute;
  z-index: 3;
  max-width: min(18rem, calc(100% - 1rem));
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-2);
  color: var(--gk-ink);
  font-size: 0.8125rem;
  line-height: 1.35;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 0.5rem));
}

.chart-tooltip.side-start {
  transform: translate(-0.75rem, calc(-100% - 0.5rem));
}

.chart-tooltip.side-end {
  transform: translate(calc(-100% + 0.75rem), calc(-100% - 0.5rem));
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
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.tooltip-key {
  flex: none;
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

.tooltip-label {
  min-width: 0;
  overflow: hidden;
  color: var(--gk-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
