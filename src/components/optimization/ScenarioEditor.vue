<template>
  <div class="editor" data-testid="scenario-editor">
    <FloatLabel class="w-full" variant="on">
      <InputText
        :id="`${uid}-name`"
        :model-value="scenario.name"
        class="w-full"
        maxlength="40"
        @update:model-value="update({ name: String($event ?? '') })"
      />
      <label :for="`${uid}-name`">{{ $t('optimizer.editor.name') }}</label>
    </FloatLabel>

    <!-- Accounts: own codes or a preset -->
    <div class="group">
      <div class="group-label" :id="`${uid}-accounts`">{{ $t('optimizer.editor.accounts') }}</div>
      <SelectButton
        :model-value="presetKey"
        :options="presetOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        :aria-labelledby="`${uid}-accounts`"
        class="segmented"
        @update:model-value="setPreset"
      />
      <template v-if="presetKey === 'codes' && scenario.accounts.kind === 'codes'">
        <!-- Pick accounts from the list; the text field below takes the same codes typed in,
             including sums like 400+401 -->
        <AccountCodePicker
          v-if="accounts && accounts.length > 0"
          :model-value="scenario.accounts.input"
          :accounts="accounts"
          @update:model-value="setCodes"
        />
        <FloatLabel class="w-full" variant="on">
          <InputText
            id="target-accounts-input"
            :model-value="scenario.accounts.input"
            class="w-full"
            inputmode="numeric"
            autocomplete="off"
            @update:model-value="setCodes(String($event ?? ''))"
          />
          <label for="target-accounts-input">
            {{ $t('financialDataScalingSelector.customFormula.optimization.targetCodes') }}
          </label>
        </FloatLabel>
        <Message v-if="codesError" severity="warn" :closable="false" class="text-xs">
          {{ codesError }}
        </Message>
      </template>
      <p v-else class="hint">{{ $t(`optimizer.editor.presetHint.${presetKey}`) }}</p>
    </div>

    <!-- Method -->
    <div class="group">
      <div class="group-label" :id="`${uid}-mode`">{{ $t('optimizer.editor.mode') }}</div>
      <SelectButton
        :model-value="scenario.mode"
        :options="modeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        :aria-labelledby="`${uid}-mode`"
        class="segmented"
        @update:model-value="update({ mode: $event })"
      />
      <p class="hint">{{ $t(`optimizer.editor.modeHint.${scenario.mode}`) }}</p>
    </div>

    <!-- Automatic factor selection -->
    <div class="group">
      <div class="switch-row">
        <ToggleSwitch
          :input-id="`${uid}-auto`"
          :model-value="scenario.selection.enabled"
          @update:model-value="
            update({ selection: { ...scenario.selection, enabled: Boolean($event) } })
          "
        />
        <label :for="`${uid}-auto`">{{ $t('optimizer.editor.autoSelect') }}</label>
      </div>
      <p class="hint">{{ $t('optimizer.editor.autoSelectHint') }}</p>
      <div v-if="scenario.selection.enabled" class="max-factors">
        <label :for="`${uid}-max`">{{ $t('optimizer.editor.maxFactors') }}</label>
        <InputNumber
          :input-id="`${uid}-max`"
          :model-value="scenario.selection.maxFactors"
          :min="1"
          :max="6"
          :step="1"
          show-buttons
          button-layout="horizontal"
          fluid
          @update:model-value="
            update({ selection: { ...scenario.selection, maxFactors: Number($event ?? 3) } })
          "
        />
      </div>
    </div>

    <!-- Entities -->
    <DisclosureBox :title="entityLegend" data-testid="editor-entities">
      <div class="check-grid check-grid-wide">
        <div v-for="entity in entities" :key="entity.code" class="check-row">
          <Checkbox
            :input-id="`${uid}-e-${entity.code}`"
            :model-value="selectedEntities"
            :value="entity.code"
            @update:model-value="setEntities($event as string[])"
          />
          <label :for="`${uid}-e-${entity.code}`">{{ entity.label }}</label>
        </div>
      </div>
      <div class="select-actions">
        <Button
          size="small"
          severity="secondary"
          text
          class="select-action"
          @click="update({ entities: null })"
        >
          {{
            $t('financialDataScalingSelector.customFormula.optimization.entitySelection.selectAll')
          }}
        </Button>
        <Button
          size="small"
          severity="secondary"
          text
          class="select-action"
          @click="update({ entities: [] })"
        >
          {{
            $t('financialDataScalingSelector.customFormula.optimization.entitySelection.selectNone')
          }}
        </Button>
      </div>
    </DisclosureBox>

    <!-- Candidate factors -->
    <DisclosureBox :title="factorLegend" data-testid="editor-factors">
      <div class="check-grid">
        <div v-for="factor in factors" :key="factor.id" class="check-row">
          <Checkbox
            :input-id="`${uid}-f-${factor.id}`"
            :model-value="selectedFactors"
            :value="factor.id"
            @update:model-value="setFactors($event as string[])"
          />
          <label :for="`${uid}-f-${factor.id}`">
            {{ factor.label }}
            <span v-if="factor.unit" class="unit">{{ factor.unit }}</span>
          </label>
        </div>
      </div>
      <div class="select-actions">
        <Button
          size="small"
          severity="secondary"
          text
          class="select-action"
          @click="update({ factors: null })"
        >
          {{
            $t('financialDataScalingSelector.customFormula.optimization.factorSelection.selectAll')
          }}
        </Button>
        <Button
          size="small"
          severity="secondary"
          text
          class="select-action"
          @click="update({ factors: [] })"
        >
          {{
            $t('financialDataScalingSelector.customFormula.optimization.factorSelection.selectNone')
          }}
        </Button>
      </div>
    </DisclosureBox>

    <!-- Further options -->
    <DisclosureBox :title="$t('optimizer.editor.more')" data-testid="editor-more">
      <div class="switch-row">
        <ToggleSwitch
          :input-id="`${uid}-icpt`"
          :model-value="scenario.includeIntercept"
          @update:model-value="update({ includeIntercept: Boolean($event) })"
        />
        <label :for="`${uid}-icpt`">{{ $t('optimizer.editor.intercept') }}</label>
      </div>
      <p class="hint">{{ $t('optimizer.editor.interceptHint') }}</p>
      <div class="group-label" :id="`${uid}-ridge`">{{ $t('optimizer.editor.ridge') }}</div>
      <SelectButton
        :model-value="scenario.ridge"
        :options="ridgeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        :aria-labelledby="`${uid}-ridge`"
        class="segmented"
        @update:model-value="update({ ridge: $event })"
      />
      <p class="hint">{{ $t('optimizer.editor.ridgeHint') }}</p>
    </DisclosureBox>

    <Message v-if="blocker" severity="info" :closable="false" class="text-xs">{{
      blocker
    }}</Message>

    <Button
      class="action-button"
      severity="primary"
      :loading="running"
      :disabled="!canRun"
      @click="$emit('run')"
    >
      {{ $t('financialDataScalingSelector.customFormula.optimization.optimize') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import FloatLabel from 'primevue/floatlabel'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import SelectButton from 'primevue/selectbutton'
import ToggleSwitch from 'primevue/toggleswitch'
import { parseAccountCodeInput } from '@/utils/optimization/accountTargets'
import type { Constellation } from '@/utils/optimization/constellation'
import DisclosureBox from './DisclosureBox.vue'
import AccountCodePicker, { type AccountChoice } from './AccountCodePicker.vue'
import type { EntityOption } from './useOptimizerLabels'

interface FactorOption {
  id: string
  label: string
  unit: string
}

const props = defineProps<{
  scenario: Constellation
  entities: EntityOption[]
  factors: FactorOption[]
  running: boolean
  /** Accounts of the loaded data, for picking target codes from a list */
  accounts?: AccountChoice[]
}>()

const emit = defineEmits<{
  update: [patch: Partial<Omit<Constellation, 'id'>>]
  run: []
}>()

const { t } = useI18n()
const uid = useId()

const update = (patch: Partial<Omit<Constellation, 'id'>>) => emit('update', patch)

// --- accounts --------------------------------------------------------------------------------
type PresetKey = 'codes' | 'expense' | 'revenue' | 'both'
const PRESET_PARENTS: Record<Exclude<PresetKey, 'codes'>, string[]> = {
  expense: ['3'],
  revenue: ['4'],
  both: ['3', '4'],
}

const presetKey = computed<PresetKey>(() => {
  const a = props.scenario.accounts
  if (a.kind === 'codes') return 'codes'
  const key = a.parents.join(',')
  return key === '3' ? 'expense' : key === '4' ? 'revenue' : 'both'
})

const presetOptions = computed((): { label: string; value: PresetKey }[] => [
  { label: t('optimizer.editor.preset.codes'), value: 'codes' },
  { label: t('optimizer.editor.preset.expense'), value: 'expense' },
  { label: t('optimizer.editor.preset.revenue'), value: 'revenue' },
  { label: t('optimizer.editor.preset.both'), value: 'both' },
])

function setPreset(key: PresetKey) {
  if (key === 'codes') {
    const previous = props.scenario.accounts
    update({
      accounts: { kind: 'codes', input: previous.kind === 'codes' ? previous.input : '36,46' },
    })
  } else {
    update({ accounts: { kind: 'children', parents: PRESET_PARENTS[key] } })
  }
}

const codesError = computed(() => {
  const a = props.scenario.accounts
  return a.kind === 'codes' ? parseAccountCodeInput(a.input).error : null
})

function setCodes(input: string) {
  update({ accounts: { kind: 'codes', input } })
}

// --- method ----------------------------------------------------------------------------------
const modeOptions = computed(() => [
  { label: t('optimizer.editor.modes.ols'), value: 'ols' as const },
  { label: t('optimizer.editor.modes.nonneg'), value: 'nonneg' as const },
  { label: t('optimizer.editor.modes.robust'), value: 'robust' as const },
])

const ridgeOptions = computed(() => [
  { label: t('optimizer.editor.ridgeOptions.none'), value: 0 },
  { label: t('optimizer.editor.ridgeOptions.light'), value: 0.01 },
  { label: t('optimizer.editor.ridgeOptions.strong'), value: 0.1 },
])

// --- entities and factors (null = everything) ------------------------------------------------
const allEntityCodes = computed(() => props.entities.map((e) => e.code))
const selectedEntities = computed(() =>
  props.scenario.entities === null
    ? allEntityCodes.value
    : props.scenario.entities.filter((c) => allEntityCodes.value.includes(c)),
)

function setEntities(codes: string[]) {
  update({ entities: codes.length === allEntityCodes.value.length ? null : codes })
}

const allFactorIds = computed(() => props.factors.map((f) => f.id))
const selectedFactors = computed(() =>
  props.scenario.factors === null
    ? allFactorIds.value
    : props.scenario.factors.filter((id) => allFactorIds.value.includes(id)),
)

function setFactors(ids: string[]) {
  update({ factors: ids.length === allFactorIds.value.length ? null : ids })
}

const entityLegend = computed(
  () =>
    `${t('financialDataScalingSelector.customFormula.optimization.entitySelection.title')} · ${t('optimizer.editor.count', { selected: selectedEntities.value.length, total: allEntityCodes.value.length })}`,
)
const factorLegend = computed(
  () =>
    `${t('financialDataScalingSelector.customFormula.optimization.factorSelection.title')} · ${t('optimizer.editor.count', { selected: selectedFactors.value.length, total: allFactorIds.value.length })}`,
)

// --- run -------------------------------------------------------------------------------------
const blocker = computed(() => {
  if (props.entities.length === 0) return t('optimizer.editor.blockers.noData')
  if (selectedEntities.value.length === 0) return t('optimizer.editor.blockers.noEntities')
  if (selectedFactors.value.length === 0) return t('optimizer.editor.blockers.noFactors')
  return null
})

const canRun = computed(() => {
  if (blocker.value || codesError.value) return false
  const a = props.scenario.accounts
  return a.kind === 'children' || parseAccountCodeInput(a.input).groups.length > 0
})
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  min-width: 0;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.group-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--gk-ink);
}

.hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--gk-muted);
}

/* Segmented controls wrap instead of overflowing on narrow phones */
.segmented {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 0.25rem;
}

.segmented :deep(.p-togglebutton) {
  flex: 1 1 auto;
  min-height: 2.75rem;
  min-width: 0;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.75rem;
}

.switch-row label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.875rem;
  line-height: 1.3;
  cursor: pointer;
}

.max-factors {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.8125rem;
}

.max-factors :deep(.p-inputnumber-input) {
  font-size: 1rem;
  min-height: 2.75rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.max-factors :deep(.p-inputnumber-button) {
  min-width: 2.75rem;
}

/* Inputs are 16px on phones so iOS does not zoom */
.editor :deep(input) {
  font-size: 1rem;
}

.check-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.125rem 0.75rem;
}

@media (min-width: 768px) {
  .check-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .check-grid-wide {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.check-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
}

.check-row label {
  flex: 1 1 auto;
  min-width: 0;
  padding-block: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.3;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.unit {
  color: var(--gk-muted);
  font-size: 0.75rem;
}

.select-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

@media (max-width: 767.98px) {
  .select-action.p-button {
    min-height: 2.75rem;
  }
}

/* Buttons are full width on phones, natural width from md up */
.action-button.p-button {
  width: 100%;
  min-height: 2.75rem;
}

@media (min-width: 768px) {
  .action-button.p-button {
    width: auto;
    align-self: flex-start;
  }
}
</style>
