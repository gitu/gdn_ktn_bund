import { ref, computed, reactive } from 'vue'
import type {
  ComparisonState,
  ComparisonBase,
  ComparisonTarget,
  ActiveComparison,
  ComparisonCalculationResult,
  CellIdentifier,
  ColumnIdentifier,
  ComparisonType,
  ComparisonDisplayOptions
} from '@/types/FinancialComparison'
import type { FinancialDataEntity } from '@/types/FinancialDataStructure'

/**
 * Composable for managing financial data comparison functionality
 */
export function useFinancialComparison() {
  // Reactive state
  const state = reactive<ComparisonState>({
    selectionMode: 'idle',
    baseSelection: null,
    activeComparisons: [],
    hoveredCell: null
  })

  const displayOptions = reactive<ComparisonDisplayOptions>({
    showTooltips: true,
    showOverlays: true,
    showPercentageChange: true,
    showAbsoluteChange: false,
    decimalPlaces: 1
  })

  // Computed properties
  const hasActiveComparisons = computed(() => state.activeComparisons.length > 0)
  const isSelecting = computed(() => state.selectionMode !== 'idle')
  const hasBaseSelection = computed(() => state.baseSelection !== null)

  // Utility functions
  const generateComparisonId = (): string => {
    return `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const calculateComparison = (baseValue: number, targetValue: number): ComparisonCalculationResult => {
    // Handle edge cases
    if (!isFinite(baseValue) || !isFinite(targetValue)) {
      return {
        percentageChange: 0,
        absoluteChange: 0,
        isValid: false,
        errorMessage: 'Invalid numeric values'
      }
    }

    if (baseValue === 0 && targetValue === 0) {
      return {
        percentageChange: 0,
        absoluteChange: 0,
        isValid: true
      }
    }

    if (baseValue === 0) {
      return {
        percentageChange: Infinity,
        absoluteChange: targetValue,
        isValid: false,
        errorMessage: 'Cannot calculate percentage change from zero'
      }
    }

    const absoluteChange = targetValue - baseValue
    const percentageChange = (absoluteChange / Math.abs(baseValue)) * 100

    return {
      percentageChange,
      absoluteChange,
      isValid: true
    }
  }

  const formatPercentageChange = (percentageChange: number): string => {
    if (!isFinite(percentageChange)) return 'N/A'
    
    const sign = percentageChange >= 0 ? '+' : ''
    return `${sign}${percentageChange.toFixed(displayOptions.decimalPlaces)}%`
  }

  const formatAbsoluteChange = (absoluteChange: number): string => {
    if (!isFinite(absoluteChange)) return 'N/A'
    
    const sign = absoluteChange >= 0 ? '+' : ''
    return `${sign}${new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absoluteChange)}`
  }

  // Cell selection methods
  const selectCell = (
    rowCode: string,
    entityCode: string,
    value: number,
    displayName: string,
    type: ComparisonType = 'cell-to-cell'
  ) => {
    if (state.selectionMode === 'idle') {
      // First click - select base
      state.baseSelection = {
        type,
        rowCode,
        entityCode,
        value,
        displayName
      }
      state.selectionMode = 'base-selected'
    } else if (state.selectionMode === 'base-selected' && state.baseSelection) {
      // Second click - create comparison
      const target: ComparisonTarget = {
        type,
        rowCode,
        entityCode,
        value,
        displayName
      }

      createComparison(state.baseSelection, target)
      resetSelection()
    }
  }

  const selectColumn = (
    entityCode: string,
    entity: FinancialDataEntity,
    allRowValues: Map<string, { value: number; displayName: string }>
  ) => {
    // For column comparisons, we'll create multiple comparisons for each row
    if (state.selectionMode === 'idle') {
      // Store column selection as base
      state.baseSelection = {
        type: 'column-to-column',
        rowCode: '*', // Wildcard for all rows
        entityCode,
        value: 0, // Not used for column comparisons
        displayName: entity.name.de || entity.code
      }
      state.selectionMode = 'base-selected'
    } else if (state.selectionMode === 'base-selected' && state.baseSelection) {
      // Create comparisons for all matching rows
      // This would be implemented based on specific requirements
      resetSelection()
    }
  }

  const createComparison = (base: ComparisonBase, target: ComparisonTarget) => {
    const calculation = calculateComparison(base.value, target.value)
    
    const comparison: ActiveComparison = {
      id: generateComparisonId(),
      base,
      target,
      percentageChange: calculation.percentageChange,
      absoluteChange: calculation.absoluteChange,
      isValid: calculation.isValid,
      createdAt: new Date()
    }

    state.activeComparisons.push(comparison)
  }

  const removeComparison = (comparisonId: string) => {
    const index = state.activeComparisons.findIndex(c => c.id === comparisonId)
    if (index !== -1) {
      state.activeComparisons.splice(index, 1)
    }
  }

  const clearAllComparisons = () => {
    state.activeComparisons = []
    resetSelection()
  }

  const resetSelection = () => {
    state.selectionMode = 'idle'
    state.baseSelection = null
  }

  // Cell state helpers
  const getCellState = (rowCode: string, entityCode: string) => {
    const isBaseSelected = state.baseSelection?.rowCode === rowCode && 
                          state.baseSelection?.entityCode === entityCode
    
    const hasComparison = state.activeComparisons.some(c => 
      (c.base.rowCode === rowCode && c.base.entityCode === entityCode) ||
      (c.target.rowCode === rowCode && c.target.entityCode === entityCode)
    )

    const isHovered = state.hoveredCell?.rowCode === rowCode && 
                     state.hoveredCell?.entityCode === entityCode

    return {
      isBaseSelected,
      hasComparison,
      isHovered,
      isSelectable: state.selectionMode === 'base-selected' && !isBaseSelected
    }
  }

  const getComparisonForCell = (rowCode: string, entityCode: string): ActiveComparison | null => {
    return state.activeComparisons.find(c => 
      (c.base.rowCode === rowCode && c.base.entityCode === entityCode) ||
      (c.target.rowCode === rowCode && c.target.entityCode === entityCode)
    ) || null
  }

  // Mouse event handlers
  const handleCellHover = (rowCode: string, entityCode: string) => {
    state.hoveredCell = { rowCode, entityCode }
  }

  const handleCellLeave = () => {
    state.hoveredCell = null
  }

  // Keyboard shortcuts
  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      resetSelection()
    } else if (event.key === 'Delete' && event.ctrlKey) {
      clearAllComparisons()
    }
  }

  return {
    // State
    state,
    displayOptions,
    
    // Computed
    hasActiveComparisons,
    isSelecting,
    hasBaseSelection,
    
    // Methods
    selectCell,
    selectColumn,
    removeComparison,
    clearAllComparisons,
    resetSelection,
    getCellState,
    getComparisonForCell,
    handleCellHover,
    handleCellLeave,
    handleKeyboardShortcut,
    
    // Formatters
    formatPercentageChange,
    formatAbsoluteChange
  }
}
