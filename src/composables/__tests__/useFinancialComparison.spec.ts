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

describe('useFinancialComparison - Column Comparisons', () => {
  let comparison: ReturnType<typeof useFinancialComparison>

  beforeEach(() => {
    comparison = useFinancialComparison()
  })

  const createMockEntity = (code: string, name: string) => ({
    code,
    name: { de: name, en: name, fr: name, it: name },
    year: '2022',
    metadata: {
      source: 'test',
      loadedAt: '2022-01-01T00:00:00.000Z',
      recordCount: 1,
    },
    model: 'test',
    source: 'test',
    description: { de: 'Test', en: 'Test', fr: 'Test', it: 'Test' },
  })

  it('should select base column correctly', () => {
    const mockEntity = createMockEntity('entity1', 'Entity 1')

    comparison.selectColumn('entity1', mockEntity, 'Entity 1')

    expect(comparison.state.selectionMode).toBe('base-selected')
    expect(comparison.state.baseSelection).toEqual({
      type: 'column-to-column',
      rowCode: '*',
      entityCode: 'entity1',
      value: 0,
      displayName: 'Entity 1',
    })
  })

  it('should create column comparison on second selection', () => {
    const mockEntity1 = createMockEntity('entity1', 'Entity 1')
    const mockEntity2 = createMockEntity('entity2', 'Entity 2')

    // First selection (base)
    comparison.selectColumn('entity1', mockEntity1, 'Entity 1')

    // Second selection (target)
    comparison.selectColumn('entity2', mockEntity2, 'Entity 2')

    expect(comparison.state.activeColumnComparisons).toHaveLength(1)
    expect(comparison.state.activeColumnComparisons[0]).toMatchObject({
      baseEntityCode: 'entity1',
      targetEntityCode: 'entity2',
      baseDisplayName: 'Entity 1',
      targetDisplayName: 'Entity 2',
    })
    expect(comparison.state.selectionMode).toBe('idle')
  })

  it('should not create column comparison for same entity', () => {
    const mockEntity = createMockEntity('entity1', 'Entity 1')

    // First selection (base)
    comparison.selectColumn('entity1', mockEntity, 'Entity 1')

    // Second selection (same entity)
    comparison.selectColumn('entity1', mockEntity, 'Entity 1')

    expect(comparison.state.activeColumnComparisons).toHaveLength(0)
    expect(comparison.state.selectionMode).toBe('idle')
  })

  it('should replace existing column comparison for target entity', () => {
    const mockEntity1 = createMockEntity('entity1', 'Entity 1')
    const mockEntity2 = createMockEntity('entity2', 'Entity 2')
    const mockEntity3 = createMockEntity('entity3', 'Entity 3')

    // Create first comparison: entity1 -> entity2
    comparison.selectColumn('entity1', mockEntity1, 'Entity 1')
    comparison.selectColumn('entity2', mockEntity2, 'Entity 2')

    // Create second comparison: entity3 -> entity2 (should replace first)
    comparison.selectColumn('entity3', mockEntity3, 'Entity 3')
    comparison.selectColumn('entity2', mockEntity2, 'Entity 2')

    expect(comparison.state.activeColumnComparisons).toHaveLength(1)
    expect(comparison.state.activeColumnComparisons[0]).toMatchObject({
      baseEntityCode: 'entity3',
      targetEntityCode: 'entity2',
    })
  })

  it('should get column state correctly', () => {
    const mockEntity1 = createMockEntity('entity1', 'Entity 1')
    const mockEntity2 = createMockEntity('entity2', 'Entity 2')

    // Test initial state
    let state = comparison.getColumnState('entity1')
    expect(state).toEqual({
      isBaseSelected: false,
      hasColumnComparison: false,
      isTargetColumn: false,
      isSelectable: false,
    })

    // Test base selected state
    comparison.selectColumn('entity1', mockEntity1, 'Entity 1')
    state = comparison.getColumnState('entity1')
    expect(state.isBaseSelected).toBe(true)
    expect(state.isSelectable).toBe(false)

    // Test target selectable state
    state = comparison.getColumnState('entity2')
    expect(state.isSelectable).toBe(true)

    // Test after creating comparison
    comparison.selectColumn('entity2', mockEntity2, 'Entity 2')
    state = comparison.getColumnState('entity2')
    expect(state.hasColumnComparison).toBe(true)
    expect(state.isTargetColumn).toBe(true)
  })

  it('should calculate row comparison correctly', () => {
    const result = comparison.calculateRowComparison('row1', 'Test Row', 100, 150)

    expect(result).toEqual({
      rowCode: 'row1',
      rowDisplayName: 'Test Row',
      baseValue: 100,
      targetValue: 150,
      percentageChange: 50,
      absoluteChange: 50,
      isValid: true,
    })
  })

  it('should handle division by zero in row comparison', () => {
    const result = comparison.calculateRowComparison('row1', 'Test Row', 0, 150)

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toBe('Cannot calculate percentage change from zero')
  })

  it('should remove column comparison correctly', () => {
    const mockEntity1 = createMockEntity('entity1', 'Entity 1')
    const mockEntity2 = createMockEntity('entity2', 'Entity 2')

    // Create comparison
    comparison.selectColumn('entity1', mockEntity1, 'Entity 1')
    comparison.selectColumn('entity2', mockEntity2, 'Entity 2')

    const comparisonId = comparison.state.activeColumnComparisons[0].id

    // Remove comparison
    comparison.removeColumnComparison(comparisonId)

    expect(comparison.state.activeColumnComparisons).toHaveLength(0)
  })

  it('should clear all comparisons including column comparisons', () => {
    const mockEntity1 = createMockEntity('entity1', 'Entity 1')
    const mockEntity2 = createMockEntity('entity2', 'Entity 2')

    // Create cell comparison
    comparison.selectCell('row1', 'entity1', 100, 'Test Cell 1', 'cell-to-cell')
    comparison.selectCell('row1', 'entity2', 200, 'Test Cell 2', 'cell-to-cell')

    // Create column comparison
    comparison.selectColumn('entity1', mockEntity1, 'Entity 1')
    comparison.selectColumn('entity2', mockEntity2, 'Entity 2')

    // Clear all
    comparison.clearAllComparisons()

    expect(comparison.state.activeComparisons).toHaveLength(0)
    expect(comparison.state.activeColumnComparisons).toHaveLength(0)
    expect(comparison.state.selectionMode).toBe('idle')
  })

  it('should detect active comparisons including column comparisons', () => {
    expect(comparison.hasActiveComparisons.value).toBe(false)

    // Add column comparison
    const mockEntity1 = createMockEntity('entity1', 'Entity 1')
    const mockEntity2 = createMockEntity('entity2', 'Entity 2')

    comparison.selectColumn('entity1', mockEntity1, 'Entity 1')
    comparison.selectColumn('entity2', mockEntity2, 'Entity 2')

    expect(comparison.hasActiveComparisons.value).toBe(true)
    expect(comparison.hasActiveColumnComparisons.value).toBe(true)
  })
})
