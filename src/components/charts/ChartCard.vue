<template>
  <section class="chart-card" :data-testid="testId">
    <header class="chart-head">
      <div class="chart-titles">
        <h3 class="chart-title">{{ title }}</h3>
        <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
      </div>
      <!-- Every chart has a table twin: values without hovering, and for screen readers -->
      <button
        v-if="table"
        type="button"
        class="view-toggle"
        :aria-pressed="showTable"
        data-testid="chart-table-toggle"
        @click="showTable = !showTable"
      >
        <i :class="showTable ? 'pi pi-chart-bar' : 'pi pi-table'" aria-hidden="true"></i>
        <span>{{ showTable ? $t('charts.showChart') : $t('charts.showTable') }}</span>
      </button>
    </header>

    <div v-if="$slots.controls" class="chart-controls">
      <slot name="controls" />
    </div>

    <ul v-if="legend && legend.length > 1 && !showTable" class="chart-legend">
      <li v-for="item in legend" :key="item.key">
        <span
          class="legend-key"
          :class="legendShape === 'line' ? 'key-line' : 'key-rect'"
          :style="{ background: item.color }"
          aria-hidden="true"
        ></span>
        <span>{{ item.label }}</span>
      </li>
    </ul>

    <div v-if="empty" class="chart-empty">{{ empty }}</div>
    <template v-else>
      <div v-show="!showTable" class="chart-body">
        <slot />
      </div>
      <div v-if="showTable && table" class="chart-table-wrap" data-testid="chart-table">
        <table class="chart-table">
          <thead>
            <tr>
              <th v-for="(heading, index) in table.head" :key="index" scope="col">
                {{ heading }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in table.rows" :key="row.key">
              <th scope="row">{{ row.label }}</th>
              <td v-for="(cell, index) in row.cells" :key="index">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <p v-if="$slots.note" class="chart-note">
      <slot name="note" />
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ChartSeries, ChartTable } from './chartTypes'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    legend?: ChartSeries[]
    legendShape?: 'rect' | 'line'
    table?: ChartTable
    /** Message shown instead of the chart when there is nothing to draw */
    empty?: string
    testId?: string
  }>(),
  { legendShape: 'rect' },
)

const showTable = ref(false)
</script>

<style scoped>
.chart-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
  color: var(--gk-ink);
}

@media (min-width: 768px) {
  .chart-card {
    padding: 1.25rem;
  }
}

.chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.chart-titles {
  min-width: 0;
}

.chart-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.3;
}

.chart-subtitle {
  margin: 0.2rem 0 0;
  color: var(--gk-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.view-toggle {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.75rem;
  padding: 0 0.75rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--gk-ink);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 550;
  cursor: pointer;
}

.view-toggle:hover {
  background: var(--gk-surface-2);
}

.view-toggle:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

/* Icon only on narrow phones, the label stays for screen readers through the button text */
@media (max-width: 380px) {
  .view-toggle span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .view-toggle {
    width: 2.75rem;
    justify-content: center;
    padding: 0;
  }
}

.chart-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  margin: 0;
  padding: 0;
  color: var(--gk-muted);
  font-size: 0.8125rem;
  list-style: none;
}

.chart-legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.legend-key {
  flex: none;
}

.key-rect {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 3px;
}

.key-line {
  width: 1rem;
  height: 2px;
  border-radius: 1px;
}

.chart-body {
  min-width: 0;
}

.chart-empty {
  padding: 1.5rem 0.5rem;
  color: var(--gk-muted);
  font-size: 0.875rem;
  text-align: center;
}

.chart-table-wrap {
  max-width: 100%;
  overflow-x: auto;
}

.chart-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.chart-table th,
.chart-table td {
  padding: 0.45rem 0.5rem;
  border-bottom: 1px solid var(--gk-border);
  text-align: right;
  white-space: nowrap;
}

.chart-table th:first-child {
  text-align: left;
  white-space: normal;
}

.chart-table thead th {
  color: var(--gk-muted);
  font-weight: 600;
}

.chart-table td {
  font-variant-numeric: tabular-nums;
}

.chart-note {
  margin: 0;
  color: var(--gk-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}
</style>
