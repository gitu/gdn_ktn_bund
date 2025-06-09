/**
 * Utility for loading and working with Swiss statistical data from stats.json catalog
 */

import * as Papa from 'papaparse'
import type {
  StatsCatalog,
  StatsDataEntry,
  DataFormat,
  StatsDataRecord,
  ProcessedStatsRecord,
  StatsDataResult,
  BundStatsResult,
  StatsAvailabilityInfo,
  StatsDataFilters,
  StatsDataConfig,
} from '../types/StatsData'

/**
 * Singleton class for loading statistical data
 */
export class StatsDataLoader {
  private static instance: StatsDataLoader
  private catalog: StatsCatalog | null = null
  private config: StatsDataConfig

  private constructor(config?: Partial<StatsDataConfig>) {
    this.config = {
      language: 'en',
      includeMetadata: true,
      validateData: true,
      ...config,
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<StatsDataConfig>): StatsDataLoader {
    if (!StatsDataLoader.instance) {
      StatsDataLoader.instance = new StatsDataLoader(config)
    }
    return StatsDataLoader.instance
  }

  /**
   * Load the stats catalog from JSON file
   */
  async loadStatsCatalog(): Promise<StatsCatalog> {
    if (this.catalog) {
      return this.catalog
    }

    try {
      // Fetch the JSON file from public directory
      const response = await fetch('/data/stats/stats.json')
      if (!response.ok) {
        throw new Error(`Failed to fetch stats catalog: ${response.statusText}`)
      }

      this.catalog = (await response.json()) as StatsCatalog
      return this.catalog
    } catch (error) {
      console.error('Error loading stats catalog:', error)
      throw new Error(
        `Failed to load stats catalog: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get available statistics information
   */
  async getAvailableStats(): Promise<StatsAvailabilityInfo[]> {
    const catalog = await this.loadStatsCatalog()
    return catalog.stats.map((entry) => ({
      id: entry.id,
      name: entry.name,
      unit: entry.unit,
      availableKtnYears: entry.data.ktn?.map((file) => file.year) || [],
      availableGdnYears: entry.data.gdn?.map((file) => file.year) || [],
      source: entry.source,
      lastUpdate: entry.lastUpdate,
    }))
  }

  /**
   * Get specific statistics entry by ID
   */
  async getStatsEntry(statsId: string): Promise<StatsDataEntry | null> {
    const catalog = await this.loadStatsCatalog()
    return catalog.stats.find((entry) => entry.id === statsId) || null
  }

  /**
   * Load and parse CSV data from a given path using the specified data format
   */
  private async loadCsvData(
    dataPath: string,
    dataFormat: DataFormat,
  ): Promise<(StatsDataRecord | string[])[]> {
    try {
      const response = await fetch(dataPath)
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${dataPath}: ${response.statusText}`)
      }

      const csvText = await response.text()

      // Use the data format configuration for parsing
      const parseResult = Papa.parse(csvText, {
        header: dataFormat.header,
        skipEmptyLines: true,
        delimiter: dataFormat.delimiter,
        quoteChar: dataFormat.quoteChar,
        transform: (value: string) => value.trim(),
      })

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings:', parseResult.errors)
      }

      return parseResult.data as string[][]
    } catch (error) {
      throw new Error(
        `Error loading CSV data from ${dataPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Process raw CSV records into standardized format
   */
  private processStatsRecords(
    rawRecords: (StatsDataRecord | string[])[],
    year: number,
    dataFormat: DataFormat,
  ): ProcessedStatsRecord[] {
    return rawRecords
      .map((record) => {
        // Extract values based on field configuration
        const key = this.extractFieldValue(record, dataFormat.key_field)
        const value = this.extractFieldValue(record, dataFormat.value_field)

        return {
          key: key || '',
          value: parseFloat(value) || 0,
        }
      })
      .filter((record) => {
        // Filter out invalid records if validation is enabled
        if (this.config.validateData) {
          return !isNaN(record.value) && record.key
        }
        return true
      })
  }

  /**
   * Get data format with backward compatibility
   */
  private getDataFormat(entry: StatsDataEntry): DataFormat {
    // If dataFormat is present, use it
    if (entry.dataFormat) {
      return entry.dataFormat
    }

    // Backward compatibility: create default format for entries without dataFormat
    return {
      type: 'csv',
      delimiter: ';',
      quoteChar: '"',
      header: true,
      key_field: 'GEO_ID',
      value_field: 'VALUE',
    }
  }

  /**
   * Extract field value from record using either field name or index
   */
  private extractFieldValue(
    record: StatsDataRecord | string[],
    fieldConfig: string | number,
  ): string {
    if (typeof fieldConfig === 'string') {
      // Use field name - record should be an object
      if (Array.isArray(record)) {
        console.warn('Trying to access named field on array record')
        return ''
      }
      // For simplified interface, map common field names to our interface
      if (fieldConfig === 'GEO_ID' || fieldConfig === 'key') {
        return (
          (record as Record<string, string>).GEO_ID || (record as Record<string, string>).key || ''
        )
      }
      if (fieldConfig === 'VALUE' || fieldConfig === 'value') {
        return (
          (record as Record<string, string>).VALUE || (record as Record<string, string>).value || ''
        )
      }
      // Fallback for any other field names
      return (record as Record<string, string>)[fieldConfig] || ''
    } else {
      // Use field index
      if (Array.isArray(record)) {
        return record[fieldConfig] || ''
      } else {
        // Convert object to array for index access
        const values = Object.values(record)
        return values[fieldConfig] || ''
      }
    }
  }

  /**
   * Apply filters to processed records
   */
  private applyFilters(
    records: ProcessedStatsRecord[],
    filters?: StatsDataFilters,
  ): ProcessedStatsRecord[] {
    if (!filters) return records

    return records.filter((record) => {
      // Filter by geographic IDs (now using key field)
      if (filters.geoIds && !filters.geoIds.includes(record.key)) {
        return false
      }

      // Filter by geographic name pattern (now using key field)
      if (
        filters.geoNamePattern &&
        !record.key.toLowerCase().includes(filters.geoNamePattern.toLowerCase())
      ) {
        return false
      }

      // Filter by value range
      if (filters.minValue !== undefined && record.value < filters.minValue) {
        return false
      }

      if (filters.maxValue !== undefined && record.value > filters.maxValue) {
        return false
      }

      return true
    })
  }

  /**
   * Find the nearest available year to the requested year
   */
  private findNearestYear(availableYears: number[], requestedYear: number): number {
    if (availableYears.length === 0) {
      throw new Error('No years available')
    }

    // If exact year is available, return it
    if (availableYears.includes(requestedYear)) {
      return requestedYear
    }

    // Find the year with minimum distance to requested year
    return availableYears.reduce((nearest, current) => {
      const currentDistance = Math.abs(current - requestedYear)
      const nearestDistance = Math.abs(nearest - requestedYear)
      return currentDistance < nearestDistance ? current : nearest
    })
  }

  /**
   * Load canton-level statistical data
   */
  async loadKtnData(
    statsId: string,
    year: number,
    filters?: StatsDataFilters,
  ): Promise<StatsDataResult> {
    const entry = await this.getStatsEntry(statsId)
    if (!entry) {
      throw new Error(`Statistics entry not found: ${statsId}`)
    }

    if (!entry.data.ktn || entry.data.ktn.length === 0) {
      throw new Error(`No canton data available for ${statsId}`)
    }

    // Find the nearest available year
    const availableYears = entry.data.ktn.map((file) => file.year)
    const actualYear = this.findNearestYear(availableYears, year)
    const ktnFile = entry.data.ktn.find((file) => file.year === actualYear)

    if (!ktnFile) {
      throw new Error(`Canton data file not found for ${statsId} in year ${actualYear}`)
    }

    const dataPath = `/data/stats/${ktnFile.file}`
    const dataFormat = this.getDataFormat(entry)
    const rawData = await this.loadCsvData(dataPath, dataFormat)
    const processedData = this.processStatsRecords(rawData, actualYear, dataFormat)
    const filteredData = this.applyFilters(processedData, filters)

    return {
      data: filteredData,
      metadata: {
        source: `stats/${statsId}/ktn/${actualYear}`,
        loadedAt: new Date().toISOString(),
        recordCount: filteredData.length,
        year: actualYear,
        requestedYear: year !== actualYear ? year : undefined,
        dataType: 'ktn',
        unit: entry.unit?.de || entry.unit?.en || '',
        mode: entry.mode,
        name: entry.name,
      },
    }
  }

  /**
   * Load municipality-level statistical data
   */
  async loadGdnData(
    statsId: string,
    year: number,
    filters?: StatsDataFilters,
  ): Promise<StatsDataResult> {
    const entry = await this.getStatsEntry(statsId)
    if (!entry) {
      throw new Error(`Statistics entry not found: ${statsId}`)
    }

    if (!entry.data.gdn || entry.data.gdn.length === 0) {
      throw new Error(`No municipality data available for ${statsId}`)
    }

    // Find the nearest available year
    const availableYears = entry.data.gdn.map((file) => file.year)
    const actualYear = this.findNearestYear(availableYears, year)
    const gdnFile = entry.data.gdn.find((file) => file.year === actualYear)

    if (!gdnFile) {
      throw new Error(`Municipality data file not found for ${statsId} in year ${actualYear}`)
    }

    const dataPath = `/data/stats/${gdnFile.file}`
    const dataFormat = this.getDataFormat(entry)
    const rawData = await this.loadCsvData(dataPath, dataFormat)
    const processedData = this.processStatsRecords(rawData, actualYear, dataFormat)
    const filteredData = this.applyFilters(processedData, filters)

    return {
      data: filteredData,
      metadata: {
        source: `stats/${statsId}/gdn/${actualYear}`,
        loadedAt: new Date().toISOString(),
        recordCount: filteredData.length,
        year: actualYear,
        requestedYear: year !== actualYear ? year : undefined,
        dataType: 'gdn',
        unit: entry.unit?.de || entry.unit?.en || '',
        mode: entry.mode,
        name: entry.name,
      },
    }
  }

  /**
   * Get federal-level data by aggregating canton data
   */
  async getBundData(statsId: string, year: number): Promise<BundStatsResult> {
    const ktnResult = await this.loadKtnData(statsId, year)

    const totalValue = ktnResult.data.reduce((sum, record) => sum + record.value, 0)
    const unit = ktnResult.metadata.unit || ''

    return {
      totalValue,
      unit,
      year: ktnResult.metadata.year,
      requestedYear: ktnResult.metadata.requestedYear,
      cantonCount: ktnResult.data.length,
      metadata: {
        source: `stats/${statsId}/bund/${ktnResult.metadata.year}`,
        aggregatedAt: new Date().toISOString(),
        sourceDataType: 'ktn',
      },
    }
  }

  /**
   * Get data for a specific canton by ID
   */
  async getCantonData(
    statsId: string,
    year: number,
    cantonId: string,
  ): Promise<ProcessedStatsRecord | null> {
    const result = await this.loadKtnData(statsId, year, { geoIds: [cantonId] })
    return result.data[0] || null
  }

  /**
   * Get data for a specific municipality by ID
   */
  async getMunicipalityData(
    statsId: string,
    year: number,
    municipalityId: string,
  ): Promise<ProcessedStatsRecord | null> {
    const result = await this.loadGdnData(statsId, year, { geoIds: [municipalityId] })
    return result.data[0] || null
  }

  /**
   * Get all available years for a specific statistic
   */
  async getAvailableYears(statsId: string): Promise<{ ktn: number[]; gdn: number[] }> {
    const entry = await this.getStatsEntry(statsId)
    if (!entry) {
      throw new Error(`Statistics entry not found: ${statsId}`)
    }

    return {
      ktn: entry.data.ktn?.map((file) => file.year) || [],
      gdn: entry.data.gdn?.map((file) => file.year) || [],
    }
  }

  /**
   * Search for municipalities by name pattern
   */
  async searchMunicipalities(
    statsId: string,
    year: number,
    namePattern: string,
  ): Promise<ProcessedStatsRecord[]> {
    const result = await this.loadGdnData(statsId, year, { geoNamePattern: namePattern })
    return result.data
  }

  /**
   * Get top N entities by value
   */
  async getTopEntities(
    statsId: string,
    year: number,
    dataType: 'ktn' | 'gdn',
    limit: number = 10,
  ): Promise<ProcessedStatsRecord[]> {
    const result =
      dataType === 'ktn'
        ? await this.loadKtnData(statsId, year)
        : await this.loadGdnData(statsId, year)

    return result.data.sort((a, b) => b.value - a.value).slice(0, limit)
  }

  /**
   * Compare values between two years for the same statistic
   */
  async compareYears(
    statsId: string,
    year1: number,
    year2: number,
    dataType: 'ktn' | 'gdn',
  ): Promise<{
    year1Data: ProcessedStatsRecord[]
    year2Data: ProcessedStatsRecord[]
    changes: Array<{
      geoId: string
      geoName: string
      year1Value: number
      year2Value: number
      absoluteChange: number
      percentageChange: number
    }>
  }> {
    const [result1, result2] = await Promise.all([
      dataType === 'ktn' ? this.loadKtnData(statsId, year1) : this.loadGdnData(statsId, year1),
      dataType === 'ktn' ? this.loadKtnData(statsId, year2) : this.loadGdnData(statsId, year2),
    ])

    // Create maps for easier lookup
    const year1Map = new Map(result1.data.map((record) => [record.key, record]))
    const year2Map = new Map(result2.data.map((record) => [record.key, record]))

    // Calculate changes for entities present in both years
    const changes = []
    for (const [key, record1] of year1Map) {
      const record2 = year2Map.get(key)
      if (record2) {
        const absoluteChange = record2.value - record1.value
        const percentageChange = record1.value !== 0 ? (absoluteChange / record1.value) * 100 : 0

        changes.push({
          geoId: key,
          geoName: key, // Using key as name since we don't have separate name field
          year1Value: record1.value,
          year2Value: record2.value,
          absoluteChange,
          percentageChange,
        })
      }
    }

    return {
      year1Data: result1.data,
      year2Data: result2.data,
      changes: changes.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange)),
    }
  }

  /**
   * Get statistics summary for all available data
   */
  async getStatsSummary(
    statsId: string,
    year: number,
    dataType: 'ktn' | 'gdn',
  ): Promise<{
    total: number
    average: number
    median: number
    min: { value: number; entity: string }
    max: { value: number; entity: string }
    standardDeviation: number
    count: number
  }> {
    const result =
      dataType === 'ktn'
        ? await this.loadKtnData(statsId, year)
        : await this.loadGdnData(statsId, year)

    const values = result.data.map((record) => record.value)
    const sortedValues = [...values].sort((a, b) => a - b)

    const total = values.reduce((sum, value) => sum + value, 0)
    const average = total / values.length
    const median =
      sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)]

    const minRecord = result.data.reduce((min, record) => (record.value < min.value ? record : min))
    const maxRecord = result.data.reduce((max, record) => (record.value > max.value ? record : max))

    // Calculate standard deviation
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length
    const standardDeviation = Math.sqrt(variance)

    return {
      total,
      average,
      median,
      min: { value: minRecord.value, entity: minRecord.key },
      max: { value: maxRecord.value, entity: maxRecord.key },
      standardDeviation,
      count: values.length,
    }
  }
}

/**
 * Convenience functions for common use cases
 */

/**
 * Load the stats data loader instance
 */
export async function loadStatsDataLoader(
  config?: Partial<StatsDataConfig>,
): Promise<StatsDataLoader> {
  const loader = StatsDataLoader.getInstance(config)
  await loader.loadStatsCatalog() // Ensure catalog is loaded
  return loader
}

/**
 * Get available statistics list
 */
export async function getAvailableStatistics(): Promise<StatsAvailabilityInfo[]> {
  const loader = await loadStatsDataLoader()
  return loader.getAvailableStats()
}

/**
 * Quick access to population data for a canton
 */
export async function getCantonPopulation(
  cantonId: string,
  year: number = 2023,
): Promise<number | null> {
  const loader = await loadStatsDataLoader()
  const record = await loader.getCantonData('pop', year, cantonId)
  return record?.value || null
}

/**
 * Quick access to population data for a municipality
 */
export async function getMunicipalityPopulation(
  municipalityId: string,
  year: number = 2023,
): Promise<number | null> {
  const loader = await loadStatsDataLoader()
  const record = await loader.getMunicipalityData('pop', year, municipalityId)
  return record?.value || null
}

/**
 * Get total Swiss population
 */
export async function getSwissPopulation(year: number = 2023): Promise<number | null> {
  const loader = await loadStatsDataLoader()
  const result = await loader.getBundData('pop', year)
  return result.totalValue
}
