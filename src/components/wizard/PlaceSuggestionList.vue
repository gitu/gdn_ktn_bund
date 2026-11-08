<template>
  <div class="suggestions" data-testid="place-suggestions">
    <p v-if="loading" class="suggestions-state">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      {{ $t('placeStep.suggestionsLoading') }}
    </p>
    <p v-else-if="groups.length === 0" class="suggestions-state">
      {{ $t('placeStep.noSuggestions') }}
    </p>

    <section
      v-for="group in groups"
      :key="group.key"
      class="suggestion-group"
      :data-testid="`suggestions-${group.key}`"
    >
      <header class="group-head">
        <div class="group-titles">
          <h4>{{ $t(`placeStep.groups.${group.key}.title`, groupParams(group)) }}</h4>
          <p>{{ $t(`placeStep.groups.${group.key}.description`, groupParams(group)) }}</p>
        </div>
        <Button
          :label="allChosen(group) ? $t('placeStep.removeAll') : $t('placeStep.addAll')"
          :icon="allChosen(group) ? 'pi pi-minus' : 'pi pi-plus'"
          severity="secondary"
          outlined
          size="small"
          class="group-action"
          :data-testid="`suggestions-${group.key}-all`"
          @click="toggleAll(group)"
        />
      </header>
      <ul class="suggestion-items">
        <li v-for="item in group.places" :key="item.place">
          <button
            type="button"
            class="suggestion"
            :aria-pressed="places.includes(item.place)"
            @click="toggle(item.place)"
          >
            <i
              :class="places.includes(item.place) ? 'pi pi-check' : 'pi pi-plus'"
              aria-hidden="true"
            ></i>
            <span class="suggestion-name">{{ placeName(item.place) }}</span>
            <span v-if="item.population" class="suggestion-meta">
              {{ $t('placeStep.inhabitants', { value: formatInhabitants(item.population) }) }}
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import type { SuggestionGroup } from '@/utils/PlaceSuggestions'
import { formatNumber } from '@/utils/numberFormat'

const props = defineProps<{
  groups: SuggestionGroup[]
  /** The starting place: named in the group texts and never removed by "remove all" */
  start: string
  placeName: (place: string) => string
  /** Name of a canton from its abbreviation ("ZH" → "Kanton Zürich") */
  cantonName: (abbreviation: string) => string
  loading?: boolean
}>()

const places = defineModel<string[]>({ required: true })

const { locale } = useI18n()

const formatInhabitants = (value: number) => formatNumber(value, locale.value)

const groupParams = (group: SuggestionGroup) => ({
  name: props.placeName(props.start),
  canton: group.canton ? props.cantonName(group.canton) : '',
})

const toggle = (place: string) => {
  places.value = places.value.includes(place)
    ? places.value.filter((p) => p !== place)
    : [...places.value, place]
}

const allChosen = (group: SuggestionGroup) =>
  group.places.every((item) => places.value.includes(item.place))

const toggleAll = (group: SuggestionGroup) => {
  const keys = group.places.map((item) => item.place)
  places.value = allChosen(group)
    ? places.value.filter((p) => !keys.includes(p) || p === props.start)
    : [...places.value, ...keys.filter((p) => !places.value.includes(p))]
}
</script>

<style scoped>
.suggestions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.suggestions-state {
  margin: 0;
  color: var(--gk-muted);
  font-size: 0.875rem;
}

.suggestion-group {
  padding: 0.85rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
}

.group-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.6rem;
}

.group-titles {
  flex: 1 1 14rem;
  min-width: 0;
}

.group-titles h4 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
  line-height: 1.3;
}

.group-titles p {
  margin: 0.15rem 0 0;
  color: var(--gk-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.group-action {
  flex: none;
  min-height: 2.5rem;
}

.suggestion-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestion-items li {
  max-width: 100%;
}

.suggestion {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  min-height: 2.5rem;
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--gk-ink);
  font: inherit;
  font-size: 0.8125rem;
  text-align: start;
  cursor: pointer;
}

.suggestion:hover {
  background: var(--gk-surface-2);
}

.suggestion[aria-pressed='true'] {
  border-color: var(--gk-accent);
  background: color-mix(in srgb, var(--gk-accent) 14%, var(--gk-surface));
}

.suggestion:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.suggestion .pi {
  flex: none;
  color: var(--gk-accent-strong);
  font-size: 0.7rem;
}

.suggestion-name {
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.suggestion-meta {
  flex: none;
  color: var(--gk-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
</style>
