import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AMOUNT_UNITS,
  formatAmount,
  formatChange,
  formatCompact,
  formatNumber,
  formatShare,
  type AmountUnit,
} from '@/utils/numberFormat'

/** Remembered per browser: a reading preference, not part of a shared link. */
export const AMOUNT_UNIT_STORAGE_KEY = 'gk-amount-unit'

function storedUnit(): AmountUnit {
  try {
    const value = localStorage.getItem(AMOUNT_UNIT_STORAGE_KEY)
    return AMOUNT_UNITS.includes(value as AmountUnit) ? (value as AmountUnit) : 'chf'
  } catch {
    return 'chf'
  }
}

// One choice for the whole app: the table, the charts and their tooltips round alike
const unit = ref<AmountUnit>(storedUnit())
watch(unit, (value) => {
  try {
    localStorage.setItem(AMOUNT_UNIT_STORAGE_KEY, value)
  } catch {
    // Private mode or blocked storage: the choice just is not remembered
  }
})

/** Swiss number formats in the interface language, with the chosen amount unit. */
export function useAmountFormat() {
  const { t, locale } = useI18n()

  return {
    unit,
    /** An amount in the chosen unit with its unit text; `small` keeps centimes below 100 CHF */
    amount: (value: number, small = false) =>
      formatAmount(value, locale.value, {
        unit: unit.value,
        small,
        suffix: t(`amountUnit.suffix.${unit.value}`),
      }),
    compact: (value: number) => formatCompact(value, locale.value),
    number: (value: number, digits = 0) => formatNumber(value, locale.value, digits),
    share: (value: number) => formatShare(value, locale.value),
    change: (percent: number | null) => formatChange(percent, locale.value),
  }
}
