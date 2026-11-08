<template>
  <div ref="root" class="bar-chart" :style="plotPadding" @pointerleave="hideTooltip">
    <div
      v-for="category in categories"
      :key="category.key"
      class="bar-group"
      :data-testid="`bar-group-${category.key}`"
    >
      <!-- The label sits above its bars, so long place names never squeeze the plot on a phone -->
      <div class="bar-category">
        <span class="category-label">{{ category.label }}</span>
        <span v-if="category.sublabel" class="category-sublabel">{{ category.sublabel }}</span>
      </div>
      <div class="bar-plot">
        <span
          v-for="tick in scale.ticks"
          :key="tick"
          class="grid-line"
          :class="{ 'is-zero': tick === 0 }"
          :style="{ left: `${scale.position(tick) * 100}%` }"
          aria-hidden="true"
        ></span>
        <div
          v-for="item in series"
          :key="item.key"
          class="bar-row"
          :style="{ height: `${barHeight}px` }"
        >
          <template v-if="valueOf(category.key, item.key) !== undefined">
            <span
              class="bar"
              :class="{ 'is-negative': valueOf(category.key, item.key)! < 0 }"
              :style="barStyle(valueOf(category.key, item.key)!, item)"
              tabindex="0"
              role="img"
              :aria-label="ariaLabel(category, item)"
              data-testid="bar"
              @pointerenter="showTooltip($event, category, item)"
              @focus="showTooltip($event, category, item)"
              @click="showTooltip($event, category, item)"
              @blur="hideTooltip"
            ></span>
            <span class="bar-value" :style="labelStyle(valueOf(category.key, item.key)!)">
              {{ formatLabel(valueOf(category.key, item.key)!) }}
            </span>
          </template>
          <span
            v-else
            class="bar-value is-missing"
            :style="{ left: `calc(${zeroPosition * 100}% + 0.35rem)` }"
          >
            {{ $t('charts.noValue') }}
          </span>
        </div>
      </div>
    </div>

    <div class="bar-axis" aria-hidden="true">
      <span
        v-for="tick in scale.ticks"
        :key="tick"
        class="axis-tick"
        :style="{ left: `${scale.position(tick) * 100}%` }"
        >{{ formatTick(tick) }}</span
      >
    </div>

    <ChartTooltip :tooltip="tooltip" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { linearScale } from '@/utils/charts/scale'
import { tooltipSide, type ChartCategory, type ChartSeries, type TooltipState } from './chartTypes'

const props = withDefaults(
  defineProps<{
    categories: ChartCategory[]
    series: ChartSeries[]
    /** values[category][series]; undefined = no data */
    values: Record<string, Record<string, number | undefined>>
    /** Short label at the bar tip */
    formatLabel: (value: number) => string
    /** Full value in the tooltip */
    formatValue: (value: number) => string
    formatTick: (value: number) => string
    /** Diverging: positive bars in the "positive" colour, negative ones in the "negative" colour */
    colorBySign?: boolean
    /** Tooltip wording for positive / negative values in diverging mode */
    signLabels?: [string, string]
  }>(),
  { colorBySign: false, signLabels: undefined },
)

const root = ref<HTMLElement | null>(null)
const tooltip = ref<TooltipState | null>(null)

const valueOf = (category: string, series: string) => {
  const value = props.values[category]?.[series]
  return value === undefined || !Number.isFinite(value) ? undefined : value
}

const allValues = computed(() =>
  props.categories.flatMap((category) =>
    props.series.map((item) => valueOf(category.key, item.key)).filter((v) => v !== undefined),
  ),
)

const scale = computed(() => linearScale(allValues.value as number[]))
const zeroPosition = computed(() => scale.value.position(0))
// Thin marks: never more than 24px, thinner when two series share a group
const barHeight = computed(() => (props.series.length > 1 ? 14 : 18))

// Room for the value labels beside the bar tips, on the side(s) the bars grow to
const plotPadding = computed(() => ({
  '--pad-start': allValues.value.some((v) => (v as number) < 0) ? '4.5rem' : '0px',
  '--pad-end': allValues.value.some((v) => (v as number) >= 0) ? '4.5rem' : '0.5rem',
}))

const barStyle = (value: number, item: ChartSeries) => {
  const zero = zeroPosition.value
  const tip = scale.value.position(value)
  const color = props.colorBySign
    ? value < 0
      ? 'var(--gk-chart-neg)'
      : 'var(--gk-chart-pos)'
    : item.color
  return {
    left: `${Math.min(zero, tip) * 100}%`,
    width: `max(2px, ${Math.abs(tip - zero) * 100}%)`,
    background: color,
  }
}

const labelStyle = (value: number) => {
  const tip = scale.value.position(value)
  return value < 0
    ? { right: `calc(${(1 - tip) * 100}% + 0.35rem)` }
    : { left: `calc(${tip * 100}% + 0.35rem)` }
}

const seriesLabel = (value: number, item: ChartSeries) =>
  props.colorBySign && props.signLabels ? props.signLabels[value < 0 ? 1 : 0] : item.label

const ariaLabel = (category: ChartCategory, item: ChartSeries) => {
  const value = valueOf(category.key, item.key)!
  return [category.label, category.sublabel, seriesLabel(value, item), props.formatValue(value)]
    .filter(Boolean)
    .join(', ')
}

const showTooltip = (event: Event, category: ChartCategory, item: ChartSeries) => {
  const bar = event.currentTarget as HTMLElement | null
  const value = valueOf(category.key, item.key)
  if (!bar || !root.value || value === undefined) return
  const box = root.value.getBoundingClientRect()
  const rect = bar.getBoundingClientRect()
  const x = (value < 0 ? rect.left : rect.right) - box.left
  tooltip.value = {
    x,
    y: rect.top - box.top,
    side: tooltipSide(x, box.width),
    title: [category.label, category.sublabel].filter(Boolean).join(' · '),
    rows: [
      {
        label: seriesLabel(value, item),
        value: props.formatValue(value),
        color: props.colorBySign
          ? value < 0
            ? 'var(--gk-chart-neg)'
            : 'var(--gk-chart-pos)'
          : item.color,
      },
    ],
  }
}

const hideTooltip = () => {
  tooltip.value = null
}
</script>

<style scoped>
.bar-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  padding-bottom: 0.25rem;
}

.bar-group {
  min-width: 0;
}

.bar-category {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.4rem;
  margin-bottom: 0.3rem;
  font-size: 0.8125rem;
  line-height: 1.3;
}

.category-label {
  min-width: 0;
  color: var(--gk-ink);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.category-sublabel {
  color: var(--gk-muted);
  font-variant-numeric: tabular-nums;
}

.bar-plot,
.bar-axis {
  position: relative;
  margin-inline: var(--pad-start) var(--pad-end);
}

.bar-plot {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.grid-line {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 1px;
  background: var(--gk-chart-grid);
}

.grid-line.is-zero {
  background: var(--gk-chart-axis);
}

.bar-row {
  position: relative;
}

.bar {
  position: absolute;
  top: 0;
  bottom: 0;
  /* Rounded data end, square at the baseline */
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.bar.is-negative {
  border-radius: 4px 0 0 4px;
}

.bar:hover,
.bar:focus-visible {
  filter: brightness(1.12) saturate(1.05);
}

.bar:focus-visible {
  outline: 2px solid var(--gk-ink);
  outline-offset: 2px;
}

.bar-value {
  position: absolute;
  top: 50%;
  color: var(--gk-ink);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 550;
  line-height: 1;
  white-space: nowrap;
  transform: translateY(-50%);
  pointer-events: none;
}

.bar-value.is-missing {
  color: var(--gk-muted);
  font-weight: 450;
}

.bar-axis {
  height: 1.1rem;
  margin-top: -0.35rem;
}

.axis-tick {
  position: absolute;
  top: 0;
  color: var(--gk-muted);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transform: translateX(-50%);
}

.axis-tick:first-child {
  transform: none;
}

.axis-tick:last-child {
  transform: translateX(-100%);
}
</style>
