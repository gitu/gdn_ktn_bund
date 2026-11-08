<template>
  <div class="place-step" data-testid="place-step">
    <!-- First: the place everything starts from -->
    <template v-if="phase === 'start'">
      <div class="phase-head">
        <h3>{{ $t('placeStep.startTitle') }}</h3>
        <p>{{ $t('placeStep.startHelp') }}</p>
      </div>
      <PlacePicker start-mode :catalog="catalog" :loading="loading" @start="onStart" />
      <div class="custom-link">
        <Button
          :label="start ? $t('placeStep.backToComparison') : $t('placeStep.customInstead')"
          :icon="start ? 'pi pi-arrow-left' : 'pi pi-sliders-h'"
          text
          data-testid="custom-mode"
          @click="start ? (phase = 'compare') : openCustom()"
        />
      </div>
    </template>

    <!-- Then: suggestions for it, or a free search -->
    <template v-else>
      <div v-if="start" class="start-bar" data-testid="start-bar">
        <i class="pi pi-flag" aria-hidden="true"></i>
        <span class="start-label">{{ $t('placeStep.startLabel') }}</span>
        <strong class="start-name">{{ placeName(start) }}</strong>
        <Button
          :label="$t('placeStep.changeStart')"
          text
          size="small"
          class="start-change"
          data-testid="change-start"
          @click="phase = 'start'"
        />
      </div>

      <div class="mode-tabs" role="tablist" :aria-label="$t('placeStep.modesLabel')">
        <button
          v-for="option in MODES"
          :key="option"
          type="button"
          role="tab"
          class="mode-tab"
          :aria-selected="mode === option"
          :data-testid="`place-mode-${option}`"
          @click="mode = option"
        >
          <i
            :class="option === 'suggestions' ? 'pi pi-sparkles' : 'pi pi-search'"
            aria-hidden="true"
          ></i>
          {{ $t(`placeStep.modes.${option}`) }}
        </button>
      </div>

      <div class="compare-columns">
        <div class="compare-main" role="tabpanel">
          <template v-if="mode === 'suggestions'">
            <PlaceSuggestionList
              v-if="start"
              v-model="places"
              :groups="groups"
              :start="start"
              :place-name="placeName"
              :canton-name="cantonName"
              :loading="suggestionsLoading"
            />
            <div v-else class="no-start">
              <p>{{ $t('placeStep.noStart') }}</p>
              <Button
                :label="$t('placeStep.chooseStart')"
                icon="pi pi-flag"
                @click="phase = 'start'"
              />
            </div>
          </template>
          <PlacePicker v-else v-model="places" :catalog="catalog" :loading="loading" />
        </div>
        <SelectedPlaces v-model="places" :place-name="placeName" :mark-start="Boolean(start)" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import PlacePicker from './PlacePicker.vue'
import PlaceSuggestionList from './PlaceSuggestionList.vue'
import SelectedPlaces from './SelectedPlaces.vue'
import { placeKeyOfEntry } from '@/utils/ComparisonSelection'
import {
  loadSuggestionContext,
  suggestComparisons,
  type SuggestionContext,
} from '@/utils/PlaceSuggestions'
import { Logger } from '@/utils/Logger'
import type { AvailableDataEntry, MultiLanguageLabels } from '@/types/DataStructures'

const props = defineProps<{
  catalog: AvailableDataEntry[]
  loading?: boolean
}>()

/** Place keys in the chosen order; the first one is the starting place */
const places = defineModel<string[]>({ required: true })

type Mode = 'suggestions' | 'custom'
const MODES: Mode[] = ['suggestions', 'custom']

const { locale } = useI18n()
const lang = computed(() => locale.value as keyof MultiLanguageLabels)

const phase = ref<'start' | 'compare'>(places.value.length === 0 ? 'start' : 'compare')
const mode = ref<Mode>('suggestions')
const start = computed(() => places.value[0] ?? null)

const entryByPlace = computed(
  () => new Map(props.catalog.map((entry) => [placeKeyOfEntry(entry), entry])),
)
const placeName = (place: string) => {
  const entry = entryByPlace.value.get(place)
  return entry ? entry.displayName[lang.value] || entry.displayName.de : place
}
const cantonName = (abbreviation: string) =>
  entryByPlace.value.has(`std/fs/ktn_${abbreviation.toLowerCase()}`)
    ? placeName(`std/fs/ktn_${abbreviation.toLowerCase()}`)
    : abbreviation

/** A new starting place replaces the old one; the places added to it stay. */
const onStart = (place: string) => {
  const rest = places.value.slice(1).filter((p) => p !== place)
  places.value = [place, ...rest]
  phase.value = 'compare'
  mode.value = 'suggestions'
}

const openCustom = () => {
  phase.value = 'compare'
  mode.value = 'custom'
}

// Everything removed while looking at suggestions: start again with the starting place
watch(
  () => places.value.length,
  (count) => {
    if (count === 0 && mode.value === 'suggestions') phase.value = 'start'
  },
)

// ---- Suggestions, from the inhabitants of every place (loaded once)
const context = ref<SuggestionContext | null>(null)
const suggestionsLoading = ref(false)

const newestYear = computed(() =>
  Math.max(
    ...props.catalog.filter((e) => e.type === 'gdn').flatMap((e) => e.availableYears.map(Number)),
  ),
)

watch(
  [start, () => props.catalog.length],
  async () => {
    if (!start.value || props.catalog.length === 0 || context.value) return
    suggestionsLoading.value = true
    try {
      context.value = await loadSuggestionContext(props.catalog, newestYear.value)
    } catch (error) {
      Logger.warn('Could not load the statistics for suggestions', { error })
    } finally {
      suggestionsLoading.value = false
    }
  },
  { immediate: true },
)

const groups = computed(() =>
  context.value && start.value ? suggestComparisons(start.value, context.value) : [],
)
</script>

<style scoped>
.place-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.phase-head h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  font-weight: 650;
}

.phase-head p {
  margin: 0;
  max-width: 46rem;
  color: var(--gk-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.custom-link :deep(.p-button) {
  min-height: 2.75rem;
}

.start-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  min-width: 0;
  padding: 0.5rem 0.5rem 0.5rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--gk-accent) 40%, var(--gk-border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--gk-accent) 8%, var(--gk-surface));
}

.start-bar > .pi {
  color: var(--gk-accent-strong);
}

.start-label {
  color: var(--gk-muted);
  font-size: 0.8125rem;
}

.start-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.start-change {
  margin-inline-start: auto;
  min-height: 2.5rem;
}

.mode-tabs {
  display: inline-flex;
  align-self: flex-start;
  max-width: 100%;
  padding: 0.25rem;
  border: 1px solid var(--gk-border);
  border-radius: 999px;
  background: var(--gk-surface-2);
}

.mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--gk-muted);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.mode-tab[aria-selected='true'] {
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
  color: var(--gk-ink);
}

.mode-tab:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.compare-columns {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.compare-main {
  min-width: 0;
}

/* Narrow screens: the selection comes first, above the long lists; empty, it is hidden (the
   sticky bar below says that nothing is chosen) */
@media (max-width: 959px) {
  .compare-columns :deep(.selection) {
    order: -1;
  }

  .compare-columns :deep(.selection.is-empty) {
    display: none;
  }
}

@media (min-width: 960px) {
  .compare-columns {
    grid-template-columns: minmax(0, 3fr) minmax(16rem, 2fr);
    align-items: start;
  }

  .compare-columns :deep(.selection) {
    position: sticky;
    top: calc(var(--topbar-h) + 1rem);
  }
}

.no-start {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  color: var(--gk-muted);
}

.no-start p {
  margin: 0;
}
</style>
