import { describe, it, expect, beforeEach } from 'vitest'
import { useFinancialComparison } from '../useFinancialComparison'

describe('useFinancialComparison', () => {
  let comparison: ReturnType<typeof useFinancialComparison>

  beforeEach(() => {
    comparison = useFinancialComparison()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(comparison.state.selectionMode).toBe('idle')
      expect(comparison.state.baseSelection).toBeNull()
      expect(comparison.state.activeComparisons).toEqual([])
      expect(comparison.state.hoveredCell).toBeNull()
    })

    it('should have correct initial computed values', () => {
      expect(comparison.hasActiveComparisons.value).toBe(false)
      expect(comparison.isSelecting.value).toBe(false)
      expect(comparison.hasBaseSelection.value).toBe(false)
    })
  })

  describe('Cell Selection', () => {
    it('should select base cell on first click', () => {
      comparison.selectCell('row1', 'entity1', 1000, 'Test Entity 1')

      expect(comparison.state.selectionMode).toBe('base-selected')
      expect(comparison.state.baseSelection).toEqual({
        type: 'cell-to-cell',
        rowCode: 'row1',
        entityCode: 'entity1',
        value: 1000,
        displayName: 'Test Entity 1',
      })
      expect(comparison.hasBaseSelection.value).toBe(true)
      expect(comparison.isSelecting.value).toBe(true)
    })

    it('should create comparison on second click', () => {
      // First click - select base
      comparison.selectCell('row1', 'entity1', 1000, 'Test Entity 1')

      // Second click - create comparison
      comparison.selectCell('row1', 'entity2', 1500, 'Test Entity 2')

      expect(comparison.state.selectionMode).toBe('idle')
      expect(comparison.state.baseSelection).toBeNull()
      expect(comparison.state.activeComparisons).toHaveLength(1)

      const activeComparison = comparison.state.activeComparisons[0]
      expect(activeComparison.base.value).toBe(1000)
      expect(activeComparison.target.value).toBe(1500)
      expect(activeComparison.percentageChange).toBe(50) // (1500-1000)/1000 * 100
      expect(activeComparison.absoluteChange).toBe(500)
      expect(activeComparison.isValid).toBe(true)
    })
  })

  describe('Comparison Calculations', () => {
    it('should calculate positive percentage change correctly', () => {
      comparison.selectCell('row1', 'entity1', 1000, 'Entity 1')
      comparison.selectCell('row1', 'entity2', 1200, 'Entity 2')

      const activeComparison = comparison.state.activeComparisons[0]
      expect(activeComparison.percentageChange).toBe(20)
      expect(activeComparison.absoluteChange).toBe(200)
    })

    it('should calculate negative percentage change correctly', () => {
      comparison.selectCell('row1', 'entity1', 1000, 'Entity 1')
      comparison.selectCell('row1', 'entity2', 800, 'Entity 2')

      const activeComparison = comparison.state.activeComparisons[0]
      expect(activeComparison.percentageChange).toBe(-20)
      expect(activeComparison.absoluteChange).toBe(-200)
    })

    it('should handle zero base value', () => {
      comparison.selectCell('row1', 'entity1', 0, 'Entity 1')
      comparison.selectCell('row1', 'entity2', 100, 'Entity 2')

      const activeComparison = comparison.state.activeComparisons[0]
      expect(activeComparison.isValid).toBe(false)
      expect(activeComparison.percentageChange).toBe(Infinity)
      expect(activeComparison.absoluteChange).toBe(100)
    })

    it('should handle both values being zero', () => {
      comparison.selectCell('row1', 'entity1', 0, 'Entity 1')
      comparison.selectCell('row1', 'entity2', 0, 'Entity 2')

      const activeComparison = comparison.state.activeComparisons[0]
      expect(activeComparison.isValid).toBe(true)
      expect(activeComparison.percentageChange).toBe(0)
      expect(activeComparison.absoluteChange).toBe(0)
    })
  })

  describe('Comparison Management', () => {
    beforeEach(() => {
      // Create some test comparisons
      comparison.selectCell('row1', 'entity1', 1000, 'Entity 1')
      comparison.selectCell('row1', 'entity2', 1200, 'Entity 2')

      comparison.selectCell('row2', 'entity1', 500, 'Entity 1')
      comparison.selectCell('row2', 'entity2', 600, 'Entity 2')
    })

    it('should remove specific comparison', () => {
      expect(comparison.state.activeComparisons).toHaveLength(2)

      const firstComparisonId = comparison.state.activeComparisons[0].id
      comparison.removeComparison(firstComparisonId)

      expect(comparison.state.activeComparisons).toHaveLength(1)
      expect(comparison.state.activeComparisons[0].id).not.toBe(firstComparisonId)
    })

    it('should clear all comparisons', () => {
      expect(comparison.state.activeComparisons).toHaveLength(2)

      comparison.clearAllComparisons()

      expect(comparison.state.activeComparisons).toHaveLength(0)
      expect(comparison.state.selectionMode).toBe('idle')
      expect(comparison.state.baseSelection).toBeNull()
    })
  })

  describe('Cell State Helpers', () => {
    beforeEach(() => {
      comparison.selectCell('row1', 'entity1', 1000, 'Entity 1')
      comparison.selectCell('row1', 'entity2', 1200, 'Entity 2')
    })

    it('should identify cells with comparisons', () => {
      const cellState1 = comparison.getCellState('row1', 'entity1')
      const cellState2 = comparison.getCellState('row1', 'entity2')
      const cellState3 = comparison.getCellState('row2', 'entity1')

      expect(cellState1.hasComparison).toBe(true)
      expect(cellState2.hasComparison).toBe(true)
      expect(cellState3.hasComparison).toBe(false)
    })

    it('should get comparison for cell', () => {
      const comparisonForCell = comparison.getComparisonForCell('row1', 'entity1')
      expect(comparisonForCell).not.toBeNull()
      expect(comparisonForCell?.base.entityCode).toBe('entity1')

      const noComparison = comparison.getComparisonForCell('row2', 'entity1')
      expect(noComparison).toBeNull()
    })
  })

  describe('Formatting', () => {
    it('should format percentage change correctly', () => {
      expect(comparison.formatPercentageChange(25.5)).toBe('+25.5%')
      expect(comparison.formatPercentageChange(-15.2)).toBe('-15.2%')
      expect(comparison.formatPercentageChange(0)).toBe('+0.0%')
      expect(comparison.formatPercentageChange(Infinity)).toBe('N/A')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should reset selection on Escape key', () => {
      comparison.selectCell('row1', 'entity1', 1000, 'Entity 1')
      expect(comparison.state.selectionMode).toBe('base-selected')

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      comparison.handleKeyboardShortcut(escapeEvent)

      expect(comparison.state.selectionMode).toBe('idle')
      expect(comparison.state.baseSelection).toBeNull()
    })

    it('should clear all comparisons on Ctrl+Delete', () => {
      comparison.selectCell('row1', 'entity1', 1000, 'Entity 1')
      comparison.selectCell('row1', 'entity2', 1200, 'Entity 2')
      expect(comparison.state.activeComparisons).toHaveLength(1)

      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete', ctrlKey: true })
      comparison.handleKeyboardShortcut(deleteEvent)

      expect(comparison.state.activeComparisons).toHaveLength(0)
    })
  })
})
