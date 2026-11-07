/**
 * Formula strings for fitted models. The output is parsed by CustomScalingFormula, so numbers use
 * fixed notation (no exponent) and negative terms are written with a minus sign.
 */

/** Round to six significant digits, the precision used in formulas. */
export function roundCoefficient(value: number): number {
  return value === 0 || !Number.isFinite(value) ? value : Number(value.toPrecision(6))
}

/** Fixed notation with at most six significant digits and no trailing zeros. */
export function formatCoefficient(value: number): string {
  const abs = Math.abs(value)
  if (abs === 0 || !Number.isFinite(abs)) return '0'
  const digits = Math.min(20, Math.max(0, 5 - Math.floor(Math.log10(abs))))
  let text = abs.toFixed(digits)
  if (text.includes('.')) {
    text = text.replace(/0+$/, '').replace(/\.$/, '')
  }
  return text
}

export interface FormulaTerm {
  id: string
  coefficient: number
}

/** "intercept + c1*f1 + c2*f2"; a coefficient of exactly 1 is written without "1*". */
export function buildFormula(intercept: number, terms: FormulaTerm[]): string {
  let out = ''
  const push = (sign: 1 | -1, body: string) => {
    if (out === '') {
      out = sign < 0 ? `-${body}` : body
    } else {
      out += sign < 0 ? `-${body}` : `+${body}`
    }
  }
  if (intercept !== 0) {
    push(intercept < 0 ? -1 : 1, formatCoefficient(intercept))
  }
  for (const { id, coefficient } of terms) {
    if (coefficient === 0) continue
    const sign = coefficient < 0 ? -1 : 1
    const text = formatCoefficient(coefficient)
    push(sign, text === '1' ? id : `${text}*${id}`)
  }
  return out === '' ? '0' : out
}
