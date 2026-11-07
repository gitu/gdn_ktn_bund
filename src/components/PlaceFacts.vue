<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadAllPlaceFacts, share, type PlaceFacts } from '@/utils/PlaceFacts'

const props = defineProps<{ datasets: string[] }>()

const { t, locale } = useI18n()
const facts = ref<PlaceFacts[]>([])
const loading = ref(false)

// Only the newest request may write the result (datasets change quickly while selecting)
let latest = 0
watch(
  () => props.datasets,
  async (ids) => {
    const current = ++latest
    loading.value = true
    const result = await loadAllPlaceFacts([...ids])
    if (current === latest) {
      facts.value = result
      loading.value = false
    }
  },
  { immediate: true, deep: true },
)

const localeTag = computed(() => `${locale.value}-CH`)
const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat(localeTag.value, { maximumFractionDigits: digits }).format(value)
const formatPercent = (fraction: number) =>
  new Intl.NumberFormat(localeTag.value, { style: 'percent', maximumFractionDigits: 0 }).format(
    fraction,
  )

const language = computed(() => locale.value as 'de' | 'fr' | 'it' | 'en')

function title(place: PlaceFacts): string {
  return place.municipalityName ?? place.name?.[language.value] ?? place.datasetId
}

/** One plain sentence about what the figures cover. */
function about(place: PlaceFacts): string {
  const canton = place.cantonAbbreviation ?? ''
  if (place.kind === 'municipality' && place.municipalityName) {
    return t('placeFacts.about.municipality', { name: place.municipalityName, canton })
  }
  if (place.kind === 'cantonRest') {
    return t('placeFacts.about.cantonRest', { canton: place.cantonName ?? canton })
  }
  if (place.kind === 'canton') {
    return t('placeFacts.about.canton', { canton: place.cantonName ?? canton })
  }
  return place.description?.[language.value] ?? ''
}

interface Row {
  key: string
  label: string
  value: string
  detail?: string
}

function rows(place: PlaceFacts): Row[] {
  const out: Row[] = []
  if (place.population !== undefined) {
    out.push({
      key: 'population',
      label: t('placeFacts.facts.population'),
      value: formatNumber(place.population),
    })
    const old = share(place.population65Plus, place.population)
    if (old !== undefined) {
      out.push({ key: 'age65', label: t('placeFacts.facts.age65'), value: formatPercent(old) })
    }
    const foreign = share(place.populationForeign, place.population)
    if (foreign !== undefined) {
      out.push({
        key: 'foreign',
        label: t('placeFacts.facts.foreign'),
        value: formatPercent(foreign),
      })
    }
  }
  if (place.jobs !== undefined) {
    out.push({ key: 'jobs', label: t('placeFacts.facts.jobs'), value: formatNumber(place.jobs) })
  }
  if (place.roadKm !== undefined) {
    out.push({
      key: 'roads',
      label: t('placeFacts.facts.roads'),
      value: t('placeFacts.units.km', { value: formatNumber(place.roadKm) }),
    })
  }
  if (place.areaHa !== undefined) {
    out.push({
      key: 'area',
      label: t('placeFacts.facts.area'),
      value: t('placeFacts.units.km2', { value: formatNumber(place.areaHa / 100, 1) }),
    })
  }
  return out
}
</script>

<template>
  <section v-if="facts.length > 0 || loading" class="place-facts" data-testid="place-facts">
    <header>
      <h2>{{ $t('placeFacts.title') }}</h2>
      <p>{{ $t('placeFacts.intro') }}</p>
    </header>

    <ul class="places">
      <li
        v-for="place in facts"
        :key="place.datasetId"
        class="place"
        :data-testid="`place-${place.datasetId}`"
      >
        <div class="place-head">
          <h3>{{ title(place) }}</h3>
          <span class="kind">{{ $t(`placeFacts.kind.${place.kind}`) }}</span>
        </div>
        <p class="about">{{ about(place) }}</p>
        <dl v-if="rows(place).length > 0">
          <div v-for="row in rows(place)" :key="row.key">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
        <p class="as-of">{{ $t('placeFacts.asOf', { year: place.year }) }}</p>
      </li>
    </ul>

    <p v-if="facts.length > 0" class="note">{{ $t('placeFacts.note') }}</p>
  </section>
</template>

<style scoped>
.place-facts {
  margin-top: clamp(1.25rem, 4vw, 2rem);
}

header h2 {
  margin: 0 0 0.35rem;
}

header p {
  margin: 0 0 1rem;
  color: var(--gk-muted);
}

.places {
  display: grid;
  gap: 0.875rem;
  margin: 0;
  padding: 0;
  list-style: none;
  grid-template-columns: minmax(0, 1fr);
}

.place {
  min-width: 0;
  padding: 1rem 1.1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
}

.place-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.place-head h3 {
  margin: 0;
  font-size: 1.1rem;
  overflow-wrap: anywhere;
}

.kind {
  flex: none;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--gk-accent) 12%, transparent);
  color: var(--gk-accent-strong);
  font-size: 0.72rem;
  font-weight: 600;
}

.about {
  margin: 0.4rem 0 0.75rem;
  color: var(--gk-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

dl {
  display: grid;
  gap: 0.35rem;
  margin: 0;
}

dl > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--gk-border);
  font-size: 0.9rem;
}

dt {
  color: var(--gk-muted);
}

dd {
  margin: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.as-of {
  margin: 0.6rem 0 0;
  color: var(--gk-muted);
  font-size: 0.78rem;
}

.note {
  margin: 0.875rem 0 0;
  color: var(--gk-muted);
  font-size: 0.8125rem;
}

@media (min-width: 768px) {
  .places {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .places {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
