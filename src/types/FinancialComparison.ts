import type { FinancialDataEntity } from './FinancialDataStructure'

/**
 * Types for the financial data comparison feature
 */

export type ComparisonType = 'cell-to-cell' | 'column-to-column'

export interface ComparisonTarget {
  type: ComparisonType
  rowCode: string
  entityCode: string
  value: number
  displayName: string
}

export interface ComparisonBase {
  type: ComparisonType
  rowCode: string
  entityCode: string
  value: number
  displayName: string
}

export interface ActiveComparison {
  id: string
  base: ComparisonBase
  target: ComparisonTarget
  percentageChange: number
  absoluteChange: number
  isValid: boolean
  createdAt: Date
}

export interface ComparisonState {
  selectionMode: 'idle' | 'base-selected' | 'target-selecting'
  baseSelection: ComparisonBase | null
  activeComparisons: ActiveComparison[]
  activeColumnComparisons: ColumnComparison[]
  hoveredCell: {
    rowCode: string
    entityCode: string
  } | null
}

export interface ComparisonCalculationResult {
  percentageChange: number
  absoluteChange: number
  isValid: boolean
  errorMessage?: string
}

export interface CellIdentifier {
  rowCode: string
  entityCode: string
}

export interface ColumnIdentifier {
  entityCode: string
  entity: FinancialDataEntity
}

export interface ColumnComparison {
  id: string
  baseEntityCode: string
  targetEntityCode: string
  baseDisplayName: string
  targetDisplayName: string
  createdAt: Date
}

export interface RowComparisonResult {
  rowCode: string
  rowDisplayName: string
  baseValue: number
  targetValue: number
  percentageChange: number
  absoluteChange: number
  isValid: boolean
  errorMessage?: string
}

export interface ComparisonDisplayOptions {
  showTooltips: boolean
  showOverlays: boolean
  showPercentageChange: boolean
  showAbsoluteChange: boolean
  decimalPlaces: number
}
