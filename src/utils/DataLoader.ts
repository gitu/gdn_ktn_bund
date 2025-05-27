import Papa from 'papaparse'
import { type RecordType } from '../types'

// Data loading error class
export class DataLoadError extends Error {
  public cause?: Error

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'DataLoadError'
    this.cause = cause
  }
}

// Interface for STD (Standard) CSV records
export interface StdCsvRecord {
  arten: string
  funk: string
  jahr: string
  value: string
  dim: string
  hh: string
  unit: string
  model: string
}

// Interface for GDN (Municipality) CSV records
export interface GdnCsvRecord {
  jahr: string
  nr: string
  gemeinde: string
  konto: string
  funktion: string
  betrag: string
}

// Cache for loaded data to avoid repeated fetches
const dataCache = new Map<string, RecordType[]>()

// Available years (will be populated dynamically)
let cachedAvailableYears: string[] | null = null
let cachedAvailableMunicipalities: string[] | null = null

/**
 * Constructs the file path for entity data based on entity type and parameters
 * @param entityId - Entity identifier (e.g., "010176", "ktn_zh", "bund")
 * @param year - Year to load
 * @param model - Model type for STD entities (default: "fs")
 * @returns File path for the CSV data
 */
export function constructDataPath(entityId: string, year: string, model: string = 'fs'): string {
  // Determine if this is a GDN (municipality) entity
  if (/^\d{6}$/.test(entityId)) {
    // GDN entity: 6-digit numeric ID
    return `/data/gdn/${entityId}/${year}.csv`
  } else {
    // STD entity: use model/entity_id/year structure
    return `/data/std/${model}/${entityId}/${year}.csv`
  }
}

/**
 * Loads and parses CSV data from the specified path
 * @param filePath - Path to the CSV file
 * @param delimiter - CSV delimiter (';' for GDN, ',' for STD)
 * @returns Promise resolving to parsed CSV data
 */
async function loadCsvFromPath(filePath: string, delimiter: string = ','): Promise<unknown[]> {
  try {
    const response = await fetch(filePath)

    if (!response.ok) {
      throw new DataLoadError(`Failed to fetch CSV file: ${response.status} ${response.statusText}`,
        new Error(`HTTP ${response.status}`))
    }

    const csvText = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse<unknown>(csvText, {
        header: true,
        delimiter,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().replace(/"/g, ''),
        transform: (value: string) => value.trim().replace(/"/g, ''),
        complete: (results: Papa.ParseResult<unknown>) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors)
          }
          resolve(results.data)
        },
        error: (error: Error) => {
          reject(new DataLoadError(`CSV parsing error: ${error.message}`, error))
        }
      })
    })
  } catch (error) {
    if (error instanceof DataLoadError) {
      throw error
    }
    throw new DataLoadError(`Failed to load CSV file ${filePath}`, error as Error)
  }
}

/**
 * Converts GDN CSV record to RecordType format
 * @param gdnRecord - GDN CSV record
 * @returns RecordType record
 */
function convertGdnToRecordType(gdnRecord: GdnCsvRecord): RecordType {
  return {
    jahr: gdnRecord.jahr,
    nr: gdnRecord.nr,
    gemeinde: gdnRecord.gemeinde,
    konto: gdnRecord.konto,
    funktion: gdnRecord.funktion || '',
    betrag: parseFloat(gdnRecord.betrag) || 0
  }
}

/**
 * Converts STD CSV record to RecordType format
 * @param stdRecord - STD CSV record
 * @returns RecordType record
 */
function convertStdToRecordType(stdRecord: StdCsvRecord): RecordType {
  return {
    jahr: stdRecord.jahr,
    nr: stdRecord.hh, // Use entity ID as nr for STD records
    gemeinde: stdRecord.hh, // Use entity ID as gemeinde for STD records
    konto: stdRecord.arten,
    funktion: stdRecord.funk || '',
    betrag: parseFloat(stdRecord.value) || 0
  }
}

/**
 * Loads entity data for a specific entity and year
 * @param entityId - Entity identifier (e.g., "010176", "ktn_zh", "bund")
 * @param year - Year to load
 * @param model - Model type for STD entities (default: "fs")
 * @returns Promise resolving to array of RecordType records
 */
export async function loadEntityData(
  entityId: string,
  year: string,
  model: string = 'fs'
): Promise<RecordType[]> {
  const cacheKey = `${entityId}_${year}_${model}`

  // Check cache first
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey)!
  }

  try {
    const filePath = constructDataPath(entityId, year, model)
    const isGdn = /^\d{6}$/.test(entityId)
    const delimiter = isGdn ? ';' : ','

    console.log(`Loading data from: ${filePath}`)

    const rawData = await loadCsvFromPath(filePath, delimiter)

    let records: RecordType[]
    if (isGdn) {
      records = rawData.map((record: GdnCsvRecord) => convertGdnToRecordType(record))
    } else {
      records = rawData.map((record: StdCsvRecord) => convertStdToRecordType(record))
    }

    // Cache the results
    dataCache.set(cacheKey, records)

    console.log(`✓ Loaded ${records.length} records for ${entityId} (${year})`)
    return records

  } catch (error) {
    console.error(`✗ Failed to load data for ${entityId} (${year}):`, error)
    throw error
  }
}

/**
 * Checks if data exists for a specific entity and year
 * @param entityId - Entity identifier
 * @param year - Year to check
 * @param model - Model type for STD entities (default: "fs")
 * @returns Promise resolving to boolean indicating if data exists
 */
export async function checkDataExists(
  entityId: string,
  year: string,
  model: string = 'fs'
): Promise<boolean> {
  try {
    const filePath = constructDataPath(entityId, year, model)
    const response = await fetch(filePath, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Discovers available years by checking common year ranges
 * @returns Promise resolving to array of available years
 */
export async function discoverAvailableYears(): Promise<string[]> {
  if (cachedAvailableYears) {
    return cachedAvailableYears
  }

  const years: string[] = []
  const currentYear = new Date().getFullYear()

  // Check years from 2015 to current year
  for (let year = 2015; year <= currentYear; year++) {
    years.push(year.toString())
  }

  cachedAvailableYears = years.sort()
  return cachedAvailableYears
}

/**
 * Gets available years (cached or discovered)
 * @returns Array of available years
 */
export function getAvailableYears(): string[] {
  if (cachedAvailableYears) {
    return cachedAvailableYears
  }

  // Return a default set if not yet discovered
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let year = 2015; year <= currentYear; year++) {
    years.push(year.toString())
  }
  return years.sort()
}

/**
 * Gets the latest available year
 * @returns Latest year as string
 */
export function getLatestYear(): string {
  const years = getAvailableYears()
  return years[years.length - 1] || '2023'
}

/**
 * Gets available municipalities (placeholder implementation)
 * @returns Array of municipality names
 */
export function getAvailableMunicipalities(): string[] {
  if (cachedAvailableMunicipalities) {
    return cachedAvailableMunicipalities
  }

  // Return a default set - in a real implementation, this would be discovered
  // from the actual data files or a manifest
  cachedAvailableMunicipalities = [
    'Lindau', 'Zürich', 'Basel', 'Bern', 'Lausanne', 'Genève',
    'Winterthur', 'Luzern', 'St. Gallen', 'Lugano', 'Biel/Bienne'
  ]

  return cachedAvailableMunicipalities
}

/**
 * Legacy function: Get data for a specific municipality (latest year)
 * @param _municipality - Municipality name (unused)
 * @returns Array of RecordType records
 */
export function getMunicipalityData(_municipality: string): RecordType[] {
  console.warn('getMunicipalityData is deprecated. Use loadEntityData instead.')
  return []
}

/**
 * Legacy function: Get data for a specific municipality and year
 * @param _municipality - Municipality name (unused)
 * @param _year - Year to load (unused)
 * @returns Array of RecordType records
 */
export function getMunicipalityDataForYear(_municipality: string, _year: string): RecordType[] {
  console.warn('getMunicipalityDataForYear is deprecated. Use loadEntityData instead.')
  return []
}

/**
 * Legacy function: Get all data for the latest year
 * @returns Array of RecordType records
 */
export function getAllDataForLatestYear(): RecordType[] {
  console.warn('getAllDataForLatestYear is deprecated. Use loadEntityData for specific entities instead.')
  return []
}

/**
 * Legacy function: Get all data for a specific year
 * @param _year - Year to load (unused)
 * @returns Array of RecordType records
 */
export function getAllDataForYear(_year: string): RecordType[] {
  console.warn('getAllDataForYear is deprecated. Use loadEntityData for specific entities instead.')
  return []
}

/**
 * Clears the data cache
 */
export function clearCache(): void {
  dataCache.clear()
  cachedAvailableYears = null
  cachedAvailableMunicipalities = null
}

/**
 * Gets cache statistics
 * @returns Object with cache information
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: dataCache.size,
    keys: Array.from(dataCache.keys())
  }
}
