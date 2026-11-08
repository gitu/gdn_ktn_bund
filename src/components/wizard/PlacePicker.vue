<template>
  <div class="place-picker" data-testid="place-picker">
    <div class="picker-toolbar">
      <IconField class="search-field">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="searchQuery"
          :placeholder="$t('placePicker.searchPlaceholder')"
          :aria-label="$t('placePicker.searchPlaceholder')"
          class="w-full"
          data-testid="place-search"
        />
      </IconField>
      <div class="kind-chips" role="group" :aria-label="$t('placePicker.filterLabel')">
        <button
          v-for="group in KIND_GROUPS"
          :key="group"
          type="button"
          class="kind-chip"
          :aria-pressed="kindFilter === group"
          @click="kindFilter = group"
        >
          {{ $t(`placePicker.groups.${group}`) }}
        </button>
      </div>
    </div>

    <div class="picker-columns">
      <!-- Search results -->
      <section class="results" :aria-label="$t('placePicker.resultsLabel')">
        <p class="results-count" aria-live="polite">
          {{ $t('placePicker.resultsCount', filtered.length) }}
        </p>

        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          {{ $t('placePicker.loading') }}
        </div>

        <ul v-else-if="visible.length > 0" class="result-list">
          <li
            v-for="entry in visible"
            :key="entry.id"
            class="result-item"
            :class="{ 'is-selected': isSelected(entry) }"
            :data-testid="`place-option-${entry.id}`"
          >
            <div class="result-text">
              <span class="result-name">{{ nameOf(entry) }}</span>
              <span class="result-meta">
                <span class="kind-tag" :class="`kind-${kindOf(entry)}`">
                  {{ $t(`placeFacts.kind.${kindOf(entry)}`) }}
                </span>
                <span class="result-years">
                  {{ entry.availableYears[0] }}–{{
                    entry.availableYears[entry.availableYears.length - 1]
                  }}
                </span>
              </span>
            </div>
            <Button
              :label="isSelected(entry) ? $t('placePicker.added') : $t('placePicker.add')"
              :icon="isSelected(entry) ? 'pi pi-check' : 'pi pi-plus'"
              :severity="isSelected(entry) ? 'secondary' : undefined"
              :outlined="isSelected(entry)"
              :aria-pressed="isSelected(entry)"
              :aria-label="
                isSelected(entry)
                  ? $t('placePicker.removeNamed', { name: nameOf(entry) })
                  : $t('placePicker.addNamed', { name: nameOf(entry) })
              "
              size="small"
              class="add-button"
              @click="toggle(entry)"
            />
          </li>
        </ul>
        <p v-else class="no-results">{{ $t('placePicker.noResults') }}</p>

        <Button
          v-if="filtered.length > visible.length"
          :label="$t('placePicker.showMore', { count: filtered.length - visible.length })"
          severity="secondary"
          outlined
          class="show-more"
          @click="visibleCount += PAGE_SIZE"
        />
      </section>

      <!-- The selection, in the order of the columns and chart rows -->
      <section
        class="selection"
        :class="{ 'is-empty': places.length === 0 }"
        :aria-label="$t('placePicker.selectionLabel')"
      >
        <div class="selection-head">
          <h3>{{ $t('placePicker.selectionTitle') }}</h3>
          <Button
            v-if="places.length > 0"
            :label="$t('placePicker.clearAll')"
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            @click="places = []"
          />
        </div>
        <p v-if="places.length === 0" class="selection-empty">
          {{ $t('placePicker.selectionEmpty') }}
        </p>
        <ol v-else class="selection-list" data-testid="selected-places">
          <li v-for="(place, index) in places" :key="place" class="selection-item">
            <span class="selection-index" aria-hidden="true">{{ index + 1 }}</span>
            <span class="selection-name">{{ placeName(place) }}</span>
            <span class="selection-actions">
              <Button
                icon="pi pi-arrow-up"
                text
                rounded
                severity="secondary"
                size="small"
                :disabled="index === 0"
                :aria-label="$t('placePicker.moveUp', { name: placeName(place) })"
                @click="move(index, -1)"
              />
              <Button
                icon="pi pi-arrow-down"
                text
                rounded
                severity="secondary"
                size="small"
                :disabled="index === places.length - 1"
                :aria-label="$t('placePicker.moveDown', { name: placeName(place) })"
                @click="move(index, 1)"
              />
              <Button
                icon="pi pi-times"
                text
                rounded
                severity="secondary"
                size="small"
                :aria-label="$t('placePicker.removeNamed', { name: placeName(place) })"
                data-testid="remove-place"
                @click="remove(place)"
              />
            </span>
          </li>
        </ol>
        <p v-if="places.length > MANY_PLACES" class="selection-hint">
          {{ $t('placePicker.manyPlaces', { count: MANY_PLACES }) }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { searchByName } from '@/utils/AvailableDataLoader'
import { placeKeyOfEntry } from '@/utils/ComparisonSelection'
import { classifyStandardEntity, type PlaceKind } from '@/utils/PlaceFacts'
import type { AvailableDataEntry, MultiLanguageLabels } from '@/types/DataStructures'

const props = defineProps<{
  catalog: AvailableDataEntry[]
  loading?: boolean
}>()

/** Place keys (`gdn/fs/010261`) in the chosen order */
const places = defineModel<string[]>({ required: true })

const KIND_GROUPS = ['all', 'municipalities', 'cantons', 'switzerland', 'socialInsurance'] as const
type KindGroup = (typeof KIND_GROUPS)[number]
const PAGE_SIZE = 12
/** Beyond this the charts run out of distinguishable colours (the table still works) */
const MANY_PLACES = 8

const { locale } = useI18n()
const searchQuery = ref('')
const kindFilter = ref<KindGroup>('all')
const visibleCount = ref(PAGE_SIZE)

const kindOf = (entry: AvailableDataEntry): PlaceKind =>
  entry.type === 'gdn' ? 'municipality' : classifyStandardEntity(entry.entityCode)

const groupOf = (kind: PlaceKind): KindGroup => {
  if (kind === 'municipality') return 'municipalities'
  if (kind === 'socialInsurance') return 'socialInsurance'
  if (kind === 'federal' || kind === 'switzerland' || kind === 'other') return 'switzerland'
  return 'cantons'
}

const nameOf = (entry: AvailableDataEntry) =>
  entry.displayName[locale.value as keyof MultiLanguageLabels] || entry.displayName.de

const byKey = computed(() => new Map(props.catalog.map((entry) => [placeKeyOfEntry(entry), entry])))
const placeName = (place: string) => {
  const entry = byKey.value.get(place)
  return entry ? nameOf(entry) : place
}

const filtered = computed(() => {
  let list = props.catalog
  if (kindFilter.value !== 'all') {
    list = list.filter((entry) => groupOf(kindOf(entry)) === kindFilter.value)
  }
  const query = searchQuery.value.trim()
  if (query) list = searchByName(list, query, locale.value as keyof MultiLanguageLabels)
  return list
})

const visible = computed(() => filtered.value.slice(0, visibleCount.value))

// A new search starts at the top of the list again
watch([searchQuery, kindFilter], () => {
  visibleCount.value = PAGE_SIZE
})

const isSelected = (entry: AvailableDataEntry) => places.value.includes(placeKeyOfEntry(entry))

const toggle = (entry: AvailableDataEntry) => {
  const key = placeKeyOfEntry(entry)
  places.value = isSelected(entry)
    ? places.value.filter((place) => place !== key)
    : [...places.value, key]
}

const remove = (place: string) => {
  places.value = places.value.filter((p) => p !== place)
}

const move = (index: number, step: number) => {
  const next = [...places.value]
  const [item] = next.splice(index, 1)
  next.splice(index + step, 0, item)
  places.value = next
}
</script>

<style scoped>
.place-picker {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.picker-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.search-field :deep(input) {
  min-height: 2.75rem;
  font-size: 1rem;
}

.kind-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.kind-chip {
  min-height: 2.5rem;
  padding: 0 0.85rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--gk-ink);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 550;
  cursor: pointer;
}

.kind-chip:hover {
  background: var(--gk-surface-2);
}

.kind-chip[aria-pressed='true'] {
  border-color: var(--gk-accent);
  background: color-mix(in srgb, var(--gk-accent) 14%, var(--gk-surface));
}

.kind-chip:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.picker-columns {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

/* Narrow screens: the selection comes first, so it is visible above the long result list; while it
   is empty the sticky bar below says so instead */
@media (max-width: 959px) {
  .selection {
    order: -1;
  }

  .selection.is-empty {
    display: none;
  }
}

@media (min-width: 960px) {
  .picker-columns {
    grid-template-columns: minmax(0, 3fr) minmax(16rem, 2fr);
    align-items: start;
  }

  .selection {
    position: sticky;
    top: calc(var(--topbar-h) + 1rem);
  }
}

.results-count {
  margin: 0 0 0.5rem;
  color: var(--gk-muted);
  font-size: 0.8125rem;
}

.loading-state,
.no-results {
  padding: 1rem 0;
  color: var(--gk-muted);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
}

.result-item.is-selected {
  border-color: color-mix(in srgb, var(--gk-accent) 45%, var(--gk-border));
  background: color-mix(in srgb, var(--gk-accent) 6%, var(--gk-surface));
}

.result-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.result-name {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  color: var(--gk-muted);
  font-size: 0.75rem;
}

.kind-tag {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: var(--gk-surface-2);
  border: 1px solid var(--gk-border);
}

.kind-cantonRest {
  border-color: color-mix(in srgb, #d97706 40%, var(--gk-border));
}

.result-years {
  font-variant-numeric: tabular-nums;
}

.add-button {
  flex: none;
  min-height: 2.75rem;
}

.show-more {
  width: 100%;
  min-height: 2.75rem;
  margin-top: 0.5rem;
}

.selection {
  padding: 0.85rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface-2);
}

.selection-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2.5rem;
}

.selection-head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
}

.selection-empty,
.selection-hint {
  margin: 0.25rem 0 0;
  color: var(--gk-muted);
  font-size: 0.8125rem;
  line-height: 1.45;
}

.selection-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
}

.selection-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.2rem 0.2rem 0.2rem 0.5rem;
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  border: 1px solid var(--gk-border);
}

.selection-index {
  flex: none;
  width: 1.25rem;
  color: var(--gk-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.selection-name {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 550;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.selection-actions {
  display: flex;
  flex: none;
}

.selection-actions :deep(.p-button) {
  width: 2.5rem;
  height: 2.5rem;
}
</style>
