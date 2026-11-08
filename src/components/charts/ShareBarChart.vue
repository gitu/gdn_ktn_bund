<template>
  <div ref="root" class="share-chart" @pointerleave="hideTooltip">
    <div
      v-for="category in categories"
      :key="category.key"
      class="share-group"
      :data-testid="`share-group-${category.key}`"
    >
      <div class="share-category">
        <span class="category-label">{{ category.label }}</span>
        <span v-if="category.sublabel" class="category-sublabel">{{ category.sublabel }}</span>
      </div>
      <div v-if="sharesOf(category.key).length > 0" class="share-track">
        <span
          v-for="part in sharesOf(category.key)"
          :key="part.key"
          class="share-segment"
          :style="{
            flexGrow: part.share,
            background: groupOf(part.key)?.color,
            color: groupOf(part.key)?.ink,
          }"
          tabindex="0"
          role="img"
          :aria-label="ariaLabel(category, part)"
          data-testid="share-segment"
          @pointerenter="showTooltip($event, category, part)"
          @focus="showTooltip($event, category, part)"
          @click="showTooltip($event, category, part)"
          @blur="hideTooltip"
        >
          <!-- Only labelled when the percentage fits comfortably inside the segment -->
          <span v-if="part.share >= labelThreshold" class="segment-label">
            {{ formatShare(part.share) }}
          </span>
        </span>
      </div>
      <div v-else class="share-missing">{{ $t('charts.noValue') }}</div>
    </div>

    <ChartTooltip :tooltip="tooltip" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChartTooltip from './ChartTooltip.vue'
import { tooltipSide, type ChartCategory, type ChartSeries, type TooltipState } from './chartTypes'
import type { GroupShare } from '@/utils/charts/financialFigures'

const props = withDefaults(
  defineProps<{
    categories: ChartCategory[]
    /** The groups in their fixed order and colour */
    groups: ChartSeries[]
    shares: Record<string, GroupShare[]>
    formatShare: (share: number) => string
    formatValue: (value: number) => string
    /** Segments narrower than this share get no inline label (legend and tooltip carry them) */
    labelThreshold?: number
  }>(),
  { labelThreshold: 0.12 },
)

const root = ref<HTMLElement | null>(null)
const tooltip = ref<TooltipState | null>(null)

// Empty groups take no room and get no focus stop
const sharesOf = (category: string) =>
  (props.shares[category] ?? []).filter((part) => part.share > 0)

const groupOf = (key: string) => props.groups.find((group) => group.key === key)

const ariaLabel = (category: ChartCategory, part: GroupShare) =>
  [
    category.label,
    category.sublabel,
    groupOf(part.key)?.label,
    props.formatShare(part.share),
    props.formatValue(part.value),
  ]
    .filter(Boolean)
    .join(', ')

const showTooltip = (event: Event, category: ChartCategory, part: GroupShare) => {
  const segment = event.currentTarget as HTMLElement | null
  if (!segment || !root.value) return
  const box = root.value.getBoundingClientRect()
  const rect = segment.getBoundingClientRect()
  const x = rect.left + rect.width / 2 - box.left
  const group = groupOf(part.key)
  tooltip.value = {
    x,
    y: rect.top - box.top,
    side: tooltipSide(x, box.width),
    title: [category.label, category.sublabel].filter(Boolean).join(' · '),
    rows: [
      {
        label: group?.label ?? part.key,
        value: `${props.formatShare(part.share)} · ${props.formatValue(part.value)}`,
        color: group?.color,
      },
    ],
  }
}

const hideTooltip = () => {
  tooltip.value = null
}
</script>

<style scoped>
.share-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
}

.share-category {
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

/* The 2px gap in the surface colour separates the segments; no strokes around them */
.share-track {
  display: flex;
  gap: 2px;
  height: 1.375rem;
  overflow: hidden;
  border-radius: 4px;
}

.share-segment {
  display: flex;
  flex-basis: 0;
  align-items: center;
  justify-content: center;
  min-width: 3px;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.share-segment:hover,
.share-segment:focus-visible {
  filter: brightness(1.12) saturate(1.05);
}

.share-segment:focus-visible {
  outline: 2px solid var(--gk-ink);
  outline-offset: -2px;
}

.segment-label {
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
}

.share-missing {
  color: var(--gk-muted);
  font-size: 0.8125rem;
}
</style>
