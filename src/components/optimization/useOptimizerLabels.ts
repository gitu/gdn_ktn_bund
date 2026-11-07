import { computed, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'
import type { StatsAvailabilityInfo } from '@/types/StatsData'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { getMunicipalityByGdnId } from '@/utils/GeographicalDataLoader'
import { buildAccountIndex, accountLabel } from '@/utils/optimization/accountTargets'
import { Logger } from '@/utils/Logger'
import type { UiLocale } from './format'

export interface OptimizerLabels {
  locale: UiLocale
  factor: (id: string) => string
  factorUnit: (id: string) => string
  entity: (code: string) => string
  account: (group: string) => string
}

export interface EntityOption {
  code: string
  label: string
}

/**
 * Human readable names for factors (stats.json, four languages), entities (municipality names are
 * looked up lazily) and accounts (labels of the loaded tree).
 */
export function useOptimizerLabels(
  financialData: Ref<FinancialData | null | undefined>,
  stats: Ref<StatsAvailabilityInfo[]>,
) {
  const { locale, t, te } = useI18n()
  const ui = computed(() =>
    ['de', 'fr', 'it', 'en'].includes(locale.value) ? (locale.value as UiLocale) : 'de',
  )

  const municipalityNames = ref(new Map<string, string>())

  watch(
    () => financialData.value?.entities,
    async (entities) => {
      if (!entities) return
      for (const code of entities.keys()) {
        const [source, , rest] = code.split('/')
        const id = rest?.split(':')[0]
        if (source !== 'gdn' || !id || !/^\d+$/.test(id) || municipalityNames.value.has(id))
          continue
        try {
          const municipality = await getMunicipalityByGdnId(id)
          if (municipality) {
            municipalityNames.value = new Map(municipalityNames.value).set(
              id,
              municipality.municipalityLongName,
            )
          }
        } catch (error) {
          Logger.warn('Failed to load municipality name', { id, error })
        }
      }
    },
    { immediate: true },
  )

  const statById = computed(() => new Map(stats.value.map((s) => [s.id, s])))
  const accountIndex = computed(() =>
    financialData.value ? buildAccountIndex(financialData.value) : new Map(),
  )

  const factor = (id: string): string => {
    const key = `financialDataScalingSelector.options.${id}`
    if (te(key)) return t(key)
    const stat = statById.value.get(id)
    return stat ? stat.name[ui.value as keyof MultiLanguageLabels] || stat.name.en || id : id
  }
  const factorUnit = (id: string): string => {
    const stat = statById.value.get(id)
    return stat ? stat.unit[ui.value as keyof MultiLanguageLabels] || stat.unit.en || '' : ''
  }

  const entity = (code: string): string => {
    const [source, , rest] = code.split('/')
    const [id, year] = (rest ?? '').split(':')
    if (source === 'gdn' && /^\d+$/.test(id)) {
      return `${municipalityNames.value.get(id) ?? `Municipality ${id}`} (${year})`
    }
    try {
      const name = EntitySemanticMapper.getEntityDisplayName(id)
      const text = name[ui.value as keyof MultiLanguageLabels] || name.en
      if (text && !text.includes('Unknown')) return `${text} (${year})`
    } catch (error) {
      Logger.warn('Failed to get display name for entity', { id, error })
    }
    return `${source}/${id} (${year})`
  }

  const labels = computed<OptimizerLabels>(() => ({
    locale: ui.value,
    factor,
    factorUnit,
    entity,
    account: (group: string) => accountLabel(accountIndex.value, group, ui.value),
  }))

  const entities = computed<EntityOption[]>(() =>
    financialData.value
      ? [...financialData.value.entities.keys()].map((code) => ({ code, label: entity(code) }))
      : [],
  )

  return { labels, entities, municipalityNames }
}
