/**
 * Data loader utility for loading and integrating financial data into FinancialData tree structures
 */

import * as Papa from 'papaparse'
import type {
  FinancialData,
  FinancialDataEntity,
  FinancialDataNode,
  FinancialDataMetadata,
  FinacialDataValue,
} from '../types/FinancialDataStructure'

import type { DataRecord, GdnDataInfo, MultiLanguageLabels } from '../types/DataStructures'

import { EntitySemanticMapper } from './EntitySemanticMapper'

export interface DataLoaderResult {
  data: DataRecord[]
  metadata: FinancialDataMetadata
}

export interface DataValidationResult {
  isValid: boolean
  errorMessage?: string
  dataPath?: string
}

import gdnInfo from '../data/gdn-info.json'
import stdInfo from '../data/std-info.json'

/**
 * DataLoader class for loading CSV financial data and integrating it into tree structures
 */
export class DataLoader {
  /**
   * Validate if GDN data exists for the given parameters
   */
  async validateGdnData(
    entityCode: string,
    year: string,
    model: string,
  ): Promise<DataValidationResult> {
    try {
      const entity = gdnInfo.find((info) => info.nr === entityCode)

      if (!entity) {
        return {
          isValid: false,
          errorMessage: `GDN entity '${entityCode}' not found`,
        }
      }

      const modelInfo = entity.models.find((m) => m.model === model)
      if (!modelInfo) {
        return {
          isValid: false,
          errorMessage: `Model '${model}' not available for GDN entity '${entityCode}'`,
        }
      }

      if (!modelInfo.jahre.includes(year)) {
        return {
          isValid: false,
          errorMessage: `Year '${year}' not available for GDN entity '${entityCode}' with model '${model}'. Available years: ${modelInfo.jahre.join(', ')}`,
        }
      }

      return {
        isValid: true,
        dataPath: `/data/gdn/${model}/${entityCode}/${year}.csv`,
      }
    } catch (error) {
      return {
        isValid: false,
        errorMessage: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Validate if STD data exists for the given parameters
   */
  async validateStdData(
    entityCode: string,
    year: string,
    model: string,
  ): Promise<DataValidationResult> {
    try {
      const entity = stdInfo.find((info) => info.hh === entityCode)

      if (!entity) {
        return {
          isValid: false,
          errorMessage: `STD entity '${entityCode}' not found`,
        }
      }

      const modelInfo = entity.models.find((m) => m.model === model)
      if (!modelInfo) {
        return {
          isValid: false,
          errorMessage: `Model '${model}' not available for STD entity '${entityCode}'`,
        }
      }

      if (!modelInfo.jahre.includes(year)) {
        return {
          isValid: false,
          errorMessage: `Year '${year}' not available for STD entity '${entityCode}' with model '${model}'. Available years: ${modelInfo.jahre.join(', ')}`,
        }
      }

      return {
        isValid: true,
        dataPath: `/data/std/${model}/${entityCode}/${year}.csv`,
      }
    } catch (error) {
      return {
        isValid: false,
        errorMessage: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  /**
   * Load and parse CSV data from a given path using Papa Parse
   */
  private async loadCsvData(dataPath: string): Promise<DataRecord[]> {
    try {
      const response = await fetch(dataPath)
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${dataPath}: ${response.statusText}`)
      }

      const csvText = await response.text()

      // Parse CSV using Papa Parse
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string) => value.trim(),
      }) as Papa.ParseResult<Record<string, string>>

      // Check for parsing errors
      if (parseResult.errors.length > 0) {
        const errorMessages = parseResult.errors
          .map((error: Papa.ParseError) => `Row ${error.row}: ${error.message}`)
          .join('; ')
        throw new Error(`CSV parsing errors: ${errorMessages}`)
      }

      // Validate that we have data
      if (!parseResult.data || parseResult.data.length === 0) {
        throw new Error('CSV file is empty or has no data rows')
      }

      // Validate header columns
      const expectedColumns = ['arten', 'funk', 'jahr', 'value', 'dim', 'unit']
      const actualColumns = parseResult.meta?.fields || []

      if (!expectedColumns.every((col) => actualColumns.includes(col))) {
        throw new Error(
          `CSV header missing required columns. Expected: ${expectedColumns.join(', ')}, Found: ${actualColumns.join(', ')}`,
        )
      }

      // Transform parsed data to DataRecord format
      const records: DataRecord[] = []

      for (const row of parseResult.data) {
        // Ensure we have the required fields
        if (row.arten && row.jahr && row.dim) {
          records.push({
            arten: row.arten,
            funk: row.funk || '',
            jahr: row.jahr,
            value: row.value || '',
            dim: row.dim,
            unit: row.unit || 'CHF',
          } as DataRecord)
        }
      }

      return records
    } catch (error) {
      throw new Error(
        `Error loading CSV data from ${dataPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Load GDN data for a specific entity, year, and model
   */
  async loadGdnData(entityCode: string, year: string, model: string): Promise<DataLoaderResult> {
    const validation = await this.validateGdnData(entityCode, year, model)

    if (!validation.isValid) {
      throw new Error(validation.errorMessage)
    }

    const data = await this.loadCsvData(validation.dataPath!)

    return {
      data,
      metadata: {
        source: `GDN/${model}/${entityCode}/${year}`,
        loadedAt: new Date().toISOString(),
        recordCount: data.length,
      },
    }
  }

  /**
   * Load STD data for a specific entity, year, and model
   */
  async loadStdData(entityCode: string, year: string, model: string): Promise<DataLoaderResult> {
    const validation = await this.validateStdData(entityCode, year, model)

    if (!validation.isValid) {
      throw new Error(validation.errorMessage)
    }

    const data = await this.loadCsvData(validation.dataPath!)

    return {
      data,
      metadata: {
        source: `STD/${model}/${entityCode}/${year}`,
        loadedAt: new Date().toISOString(),
        recordCount: data.length,
      },
    }
  }

  /**
   * Find a node in the financial data tree by account code
   */
  private findNodeByCode(node: FinancialDataNode, code: string): FinancialDataNode | null {
    if (node.code === code) {
      return node
    }

    for (const child of node.children) {
      const found = this.findNodeByCode(child, code)
      if (found) {
        return found
      }
    }

    return null
  }

  /**
   * Filter data records by dimension (bilanz, aufwand, ertrag)
   */
  private filterDataByDimension(data: DataRecord[], dimensions: string[]): DataRecord[] {
    return data.filter((record) => dimensions.includes(record.dim.toLowerCase()))
  }

  /**
   * Aggregate multiple data records with the same arten but different funk values
   */
  private aggregateDataRecords(records: DataRecord[]): DataRecord {
    if (records.length === 0) {
      throw new Error('Cannot aggregate empty records array')
    }

    if (records.length === 1) {
      return records[0]
    }

    // Sum all values
    const totalValue = records.reduce((sum, record) => {
      const value = parseFloat(record.value) || 0
      return sum + value
    }, 0)

    // Use the first record as base and update the value
    const aggregated = { ...records[0] }
    aggregated.value = totalValue.toString()
    aggregated.funk = '' // Clear funk since we're aggregating across different funk values

    return aggregated
  }

  /**
   * Fill metadata for an entity in the financial data structure
   */
  fillEntityMetadata(
    financialData: FinancialData,
    entityCode: string,
    year: string,
    model: string,
    source: 'gdn' | 'std',
    metadata: FinancialDataMetadata,
  ): void {
    const fullEntityCode = `${source}/${model}/${entityCode}:${year}`

    // Create entity entry if it doesn't exist
    if (!financialData.entities.has(fullEntityCode)) {
      // Generate appropriate entity name based on source type
      let entityName: MultiLanguageLabels
      let entityDescription: MultiLanguageLabels

      if (source === 'gdn') {
        // For GDN data, use the municipality name from the gemeinde field
        const gdnEntity = (gdnInfo as GdnDataInfo[]).find((info) => info.nr === entityCode)
        if (gdnEntity && gdnEntity.gemeinde) {
          // Use the municipality name for all languages
          entityName = {
            de: gdnEntity.gemeinde,
            fr: gdnEntity.gemeinde,
            it: gdnEntity.gemeinde,
            en: gdnEntity.gemeinde,
          }
          // Generate description for municipality
          entityDescription = {
            de: `Gemeinde ${gdnEntity.gemeinde} (${entityCode})`,
            fr: `Commune ${gdnEntity.gemeinde} (${entityCode})`,
            it: `Comune ${gdnEntity.gemeinde} (${entityCode})`,
            en: `Municipality ${gdnEntity.gemeinde} (${entityCode})`,
          }
        } else {
          // Fallback to entity code if municipality not found
          entityName = {
            de: entityCode,
            fr: entityCode,
            it: entityCode,
            en: entityCode,
          }
          entityDescription = {
            de: `Gemeinde ${entityCode}`,
            fr: `Commune ${entityCode}`,
            it: `Comune ${entityCode}`,
            en: `Municipality ${entityCode}`,
          }
        }
      } else {
        // For STD data, use EntitySemanticMapper to get human-readable names
        entityName = EntitySemanticMapper.getEntityDisplayName(entityCode)
        // Use EntitySemanticMapper to get proper description for STD entities
        entityDescription = EntitySemanticMapper.getEntityDescription(entityCode)
      }

      const entity: FinancialDataEntity = {
        code: fullEntityCode,
        name: entityName,
        metadata: metadata,
        year: year,
        model: model,
        source: source,
        description: entityDescription,
      }

      financialData.entities.set(fullEntityCode, entity)
    }

    // Update main metadata
    financialData.metadata = {
      source: `${metadata.source} + ${financialData.metadata.source}`,
      loadedAt: new Date().toISOString(),
      recordCount: financialData.metadata.recordCount + metadata.recordCount,
    }
  }

  /**
   * Load CSV data into the financial data tree structure
   */
  loadDataIntoTree(
    financialData: FinancialData,
    data: DataRecord[],
    entityCode: string,
    year: string,
    model: string,
    source: 'gdn' | 'std',
  ): void {
    const fullEntityCode = `${source}/${model}/${entityCode}:${year}`

    // Filter data to only include relevant dimensions
    const relevantDimensions = ['bilanz', 'aufwand', 'ertrag']
    const filteredData = this.filterDataByDimension(data, relevantDimensions)

    // Group data by arten (account code)
    const dataByArten = new Map<string, DataRecord[]>()
    filteredData.forEach((record) => {
      if (!dataByArten.has(record.arten)) {
        dataByArten.set(record.arten, [])
      }
      dataByArten.get(record.arten)!.push(record)
    })

    // Process each account code
    dataByArten.forEach((records, arten) => {
      try {
        // Aggregate records with same arten but different funk values
        const aggregatedRecord = this.aggregateDataRecords(records)

        // Find the appropriate tree node based on dimension
        let targetTree: FinancialDataNode
        if (aggregatedRecord.dim === 'bilanz') {
          targetTree = financialData.balanceSheet
        } else {
          targetTree = financialData.incomeStatement
        }

        // Find the specific node for this account code
        const targetNode = this.findNodeByCode(targetTree, arten)

        if (!targetNode) {
          throw new Error(`Account code '${arten}' not found in tree structure`)
        }

        // Create financial data value
        const value = parseFloat(aggregatedRecord.value) || 0
        const financialValue: FinacialDataValue = {
          value: value,
          unit: aggregatedRecord.unit,
        }

        // Add the value to the node
        targetNode.values.set(fullEntityCode, financialValue)
      } catch (error) {
        // Re-throw with more context
        throw new Error(
          `Error processing account code '${arten}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    })
  }

  /**
   * Main utility function to load financial data and integrate it into existing tree structure
   *
   * @param financialCode - Financial code (e.g., municipality number like "010002")
   * @param model - Model type (e.g., "fs")
   * @param year - Year (e.g., "2022")
   * @param financialData - Existing FinancialData tree structure
   * @param source - Data source type ('gdn' or 'std')
   * @returns Updated FinancialData tree with new data integrated
   */
  async loadAndIntegrateFinancialData(
    financialCode: string,
    model: string,
    year: string,
    financialData: FinancialData,
    source: 'gdn' | 'std',
  ): Promise<FinancialData> {
    try {
      // Step 1: Load the data
      let result: DataLoaderResult

      if (source === 'gdn') {
        result = await this.loadGdnData(financialCode, year, model)
      } else {
        result = await this.loadStdData(financialCode, year, model)
      }

      // Step 2: Fill relevant metadata
      this.fillEntityMetadata(financialData, financialCode, year, model, source, result.metadata)

      // Step 3: Load the data from CSV files into the right place in the tree
      this.loadDataIntoTree(financialData, result.data, financialCode, year, model, source)

      // Step 4: Calculate and add sums directly to the tree
      const fullEntityCode = `${source}/${model}/${financialCode}:${year}`
      this.calculateEntitySum(financialData, fullEntityCode)
      console.log(
        `Calculated sums for ${fullEntityCode} in ${financialData.metadata.source}`,
        financialData,
      )

      return financialData
    } catch (error) {
      throw new Error(
        `Failed to load and integrate financial data for ${source}/${model}/${financialCode}:${year}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Calculate the sum of all financial values for a specific entity and add them directly to the tree structure
   *
   * @param financialData - FinancialData tree structure
   * @param entityCode - Full entity code (e.g., "gdn/fs/010002:2016")
   * @returns EntitySumResult with calculated sums
   */
  calculateEntitySum(financialData: FinancialData, entityCode: string) {
    // Get unit from first available value (assuming all values use same unit)
    let unit = 'CHF'
    const firstValue =
      this.getFirstValueFromTree(financialData.balanceSheet, entityCode) ||
      this.getFirstValueFromTree(financialData.incomeStatement, entityCode)
    if (firstValue) {
      unit = firstValue.unit
    }

    // Calculate and add sums to balance sheet tree
    const balanceSheetResult = this.calculateAndAddSumsToTree(
      financialData.balanceSheet,
      entityCode,
      unit,
    )

    // Calculate and add sums to income statement tree
    const incomeStatementResult = this.calculateAndAddSumsToTree(
      financialData.incomeStatement,
      entityCode,
      unit,
    )

    // print statistics
    console.log(
      `Calculated sums for ${entityCode} in ${financialData.metadata.source}. Balance sheet: ${balanceSheetResult.sum} (${balanceSheetResult.nodeCount} nodes), Income statement: ${incomeStatementResult.sum} (${incomeStatementResult.nodeCount} nodes)`,
    )
  }

  /**
   * Calculate sums for a tree and add them directly to each node
   *
   * @param node - FinancialDataNode to traverse
   * @param entityCode - Entity code to sum values for
   * @param unit - Unit for the calculated sum values
   * @returns Object with sum and node count
   */
  private calculateAndAddSumsToTree(
    node: FinancialDataNode,
    entityCode: string,
    unit: string,
  ): {
    sum: number
    nodeCount: number
    node: FinancialDataNode
  } {
    let sum = 0
    let nodeCount = 0

    // Add value from current node if it exists for this entity
    if (node.values.has(entityCode)) {
      const value = node.values.get(entityCode)
      if (value && typeof value.value === 'number') {
        sum += value.value
        nodeCount++
      }
    }

    // Recursively calculate sums for children and add their sums to current sum
    for (const child of node.children) {
      const childResult = this.calculateAndAddSumsToTree(child, entityCode, unit)
      let factor = 1
      if (child.code == '3' || child.code == '2') {
        factor = -1
      }
      sum += childResult.sum * factor
      nodeCount += childResult.nodeCount
    }

    // Add the calculated sum directly to this node using a special sum entity code
    if (sum !== 0 || nodeCount > 0) {
      node.values.set(entityCode, {
        value: sum,
        unit: unit,
      })
    }

    return { sum, nodeCount, node }
  }

  /**
   * Get the first available value from a tree for a specific entity (used to determine unit)
   *
   * @param node - FinancialDataNode to search
   * @param entityCode - Entity code to look for
   * @returns First FinacialDataValue found or null
   */
  private getFirstValueFromTree(
    node: FinancialDataNode,
    entityCode: string,
  ): FinacialDataValue | null {
    // Check current node
    if (node.values.has(entityCode)) {
      const value = node.values.get(entityCode)
      if (value) return value
    }

    // Check children recursively
    for (const child of node.children) {
      const childValue = this.getFirstValueFromTree(child, entityCode)
      if (childValue) return childValue
    }

    return null
  }

  /**
   * Get the calculated sum value for a specific entity from a tree node
   *
   * @param node - FinancialDataNode to search
   * @param entityCode - Entity code to look for
   * @returns Sum value for the entity or null if not found
   */
  getSumFromNode(node: FinancialDataNode, entityCode: string): FinacialDataValue | null {
    const sumEntityCode = `${entityCode}:sum`
    if (node.values.has(sumEntityCode)) {
      const value = node.values.get(sumEntityCode)
      if (value) return value
    }
    return null
  }

  /**
   * Check if a node has calculated sum values for any entity
   *
   * @param node - FinancialDataNode to check
   * @returns True if the node has any sum values
   */
  hasSumValues(node: FinancialDataNode): boolean {
    for (const [entityCode] of node.values) {
      if (entityCode.endsWith(':sum')) {
        return true
      }
    }
    return false
  }
}
