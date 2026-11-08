<template>
  <div
    ref="root"
    class="line-chart"
    tabindex="0"
    role="group"
    :aria-label="ariaLabel"
    data-testid="line-chart"
    @pointermove="onPointer"
    @pointerdown="onPointer"
    @pointerleave="activeIndex = null"
    @keydown="onKey"
    @blur="activeIndex = null"
  >
    <svg :width="width" :height="HEIGHT" class="line-svg" aria-hidden="true">
      <!-- Gridlines and y ticks -->
      <g>
        <template v-for="tick in scale.ticks" :key="tick">
          <line
            :x1="PAD.left"
            :x2="width - PAD.right"
            :y1="yOf(tick)"
            :y2="yOf(tick)"
            :class="tick === 0 ? 'axis-line' : 'grid-line'"
          />
          <text :x="PAD.left - 8" :y="yOf(tick)" class="tick-label" text-anchor="end" dy="0.32em">
            {{ formatTick(tick) }}
          </text>
        </template>
      </g>

      <!-- Years -->
      <g>
        <text
          v-for="(label, index) in x"
          v-show="showXLabel(index)"
          :key="label"
          :x="xOf(index)"
          :y="HEIGHT - 6"
          class="tick-label"
          :text-anchor="index === 0 ? 'start' : index === x.length - 1 ? 'end' : 'middle'"
        >
          {{ label }}
        </text>
      </g>

      <!-- Crosshair -->
      <line
        v-if="activeIndex !== null"
        :x1="xOf(activeIndex)"
        :x2="xOf(activeIndex)"
        :y1="PAD.top"
        :y2="HEIGHT - PAD.bottom"
        class="crosshair"
      />

      <!-- One path per series; a missing year breaks the line -->
      <g v-for="item in series" :key="item.key" :data-testid="`line-${item.key}`">
        <path :d="pathOf(item.values)" class="series-line" :style="{ stroke: item.color }" />
        <!-- A lone point between gaps would be invisible as a line: draw it as a dot -->
        <template v-for="(value, index) in item.values" :key="index">
          <circle
            v-if="
              value !== undefined &&
              (isLonely(item.values, index) || isLast(item.values, index) || index === activeIndex)
            "
            :cx="xOf(index)"
            :cy="yOf(value)"
            r="4"
            class="series-dot"
            :style="{ fill: item.color }"
          />
        </template>
      </g>
    </svg>

    <ChartTooltip :tooltip="tooltip" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ChartTooltip from './ChartTooltip.vue'
import { linearScale } from '@/utils/charts/scale'
import { tooltipSide, type ChartSeries, type TooltipState } from './chartTypes'

export interface LineSeries extends ChartSeries {
  /** One value per x position; undefined = no data that year */
  values: (number | undefined)[]
}

const props = defineProps<{
  /** x positions, e.g. the years */
  x: string[]
  series: LineSeries[]
  formatValue: (value: number) => string
  formatTick: (value: number) => string
  /** Accessible name of the chart */
  label: string
}>()

const { t } = useI18n()

const HEIGHT = 260
const PAD = { top: 12, right: 14, bottom: 26, left: 58 }

const root = ref<HTMLElement | null>(null)
const width = ref(600)
const activeIndex = ref<number | null>(null)

let observer: ResizeObserver | null = null
onMounted(() => {
  const measure = () => {
    if (root.value && root.value.clientWidth > 0) width.value = root.value.clientWidth
  }
  measure()
  if (typeof ResizeObserver !== 'undefined' && root.value) {
    observer = new ResizeObserver(measure)
    observer.observe(root.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())

const values = computed(() =>
  props.series.flatMap((item) => item.values.filter((v): v is number => v !== undefined)),
)

// Lines do not need a zero baseline: the scale hugs the data so that changes stay visible
const scale = computed(() => {
  const finite = values.value.filter(Number.isFinite)
  if (finite.length === 0) return linearScale([])
  const low = Math.min(...finite)
  const high = Math.max(...finite)
  // A little air above and below, without crossing zero when all values are on one side of it
  const pad = (high - low || Math.abs(high) || 1) * 0.08
  return linearScale(
    [
      low >= 0 ? Math.max(0, low - pad) : low - pad,
      high <= 0 ? Math.min(0, high + pad) : high + pad,
    ],
    4,
    false,
  )
})

const plotWidth = computed(() => Math.max(1, width.value - PAD.left - PAD.right))
const plotHeight = HEIGHT - PAD.top - PAD.bottom

const xOf = (index: number) =>
  PAD.left +
  (props.x.length <= 1 ? plotWidth.value / 2 : (index / (props.x.length - 1)) * plotWidth.value)
const yOf = (value: number) => PAD.top + (1 - scale.value.position(value)) * plotHeight

// Thin out the year labels when they would collide (about 38px per label), counting back from the
// newest year so that it is always labelled and never crowds its neighbour
const xLabelStep = computed(() => Math.max(1, Math.ceil((props.x.length * 38) / plotWidth.value)))
const showXLabel = (index: number) => (props.x.length - 1 - index) % xLabelStep.value === 0

const pathOf = (series: (number | undefined)[]) => {
  let d = ''
  let drawing = false
  series.forEach((value, index) => {
    if (value === undefined || !Number.isFinite(value)) {
      drawing = false
      return
    }
    d += `${drawing ? 'L' : 'M'}${xOf(index).toFixed(1)},${yOf(value).toFixed(1)}`
    drawing = true
  })
  return d
}

const isLonely = (series: (number | undefined)[], index: number) =>
  series[index - 1] === undefined && series[index + 1] === undefined

const isLast = (series: (number | undefined)[], index: number) =>
  series.slice(index + 1).every((v) => v === undefined)

const onPointer = (event: PointerEvent) => {
  if (!root.value || props.x.length === 0) return
  const box = root.value.getBoundingClientRect()
  const position = (event.clientX - box.left - PAD.left) / plotWidth.value
  const index = Math.round(position * (props.x.length - 1))
  activeIndex.value = Math.min(props.x.length - 1, Math.max(0, index))
}

const onKey = (event: KeyboardEvent) => {
  if (props.x.length === 0) return
  const last = props.x.length - 1
  const current = activeIndex.value
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault()
    const step = event.key === 'ArrowRight' ? 1 : -1
    activeIndex.value =
      current === null ? (step > 0 ? 0 : last) : Math.min(last, Math.max(0, current + step))
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    activeIndex.value = event.key === 'Home' ? 0 : last
  } else if (event.key === 'Escape') {
    activeIndex.value = null
  }
}

// One readout for every series at the year, largest value first
const tooltip = computed<TooltipState | null>(() => {
  const index = activeIndex.value
  if (index === null) return null
  const rows = props.series
    .map((item) => ({ item, value: item.values[index] }))
    .filter((row): row is { item: LineSeries; value: number } => row.value !== undefined)
    .sort((a, b) => b.value - a.value)
    .map(({ item, value }) => ({
      label: item.label,
      value: props.formatValue(value),
      color: item.color,
      shape: 'line' as const,
    }))
  const x = xOf(index)
  return {
    x,
    y: PAD.top + 8,
    side: tooltipSide(x, width.value),
    title: props.x[index],
    rows: rows.length > 0 ? rows : [{ label: '', value: t('charts.noValue') }],
  }
})

const ariaLabel = computed(() => `${props.label}. ${t('charts.lineKeyboardHint')}`)
</script>

<style scoped>
.line-chart {
  position: relative;
  min-width: 0;
  border-radius: var(--radius-md);
  touch-action: pan-y;
}

.line-chart:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 4px;
}

.line-svg {
  display: block;
  overflow: visible;
}

.grid-line {
  stroke: var(--gk-chart-grid);
  stroke-width: 1;
}

.axis-line {
  stroke: var(--gk-chart-axis);
  stroke-width: 1;
}

.tick-label {
  fill: var(--gk-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.crosshair {
  stroke: var(--gk-chart-axis);
  stroke-width: 1;
}

.series-line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* The ring in the surface colour keeps dots legible where lines cross */
.series-dot {
  stroke: var(--gk-surface);
  stroke-width: 2;
}
</style>
