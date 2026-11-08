<template>
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
    <!-- The order of the columns and chart rows -->
    <ol v-else class="selection-list" data-testid="selected-places">
      <li v-for="(place, index) in places" :key="place" class="selection-item">
        <span class="selection-index" aria-hidden="true">{{ index + 1 }}</span>
        <span class="selection-name">
          {{ placeName(place) }}
          <span v-if="index === 0 && markStart" class="start-tag">{{
            $t('placeStep.startTag')
          }}</span>
        </span>
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
</template>

<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
  placeName: (place: string) => string
  /** Label the first place as the starting place */
  markStart?: boolean
}>()

/** Place keys (`gdn/fs/010261`) in the chosen order */
const places = defineModel<string[]>({ required: true })

/** Beyond this the charts run out of distinguishable colours (the table still works) */
const MANY_PLACES = 8

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
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
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

.start-tag {
  display: inline-block;
  margin-inline-start: 0.35rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--gk-accent) 16%, var(--gk-surface));
  color: var(--gk-accent-strong);
  font-size: 0.6875rem;
  font-weight: 650;
  vertical-align: 0.1em;
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
