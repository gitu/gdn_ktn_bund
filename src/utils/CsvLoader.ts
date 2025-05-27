import Papa from 'papaparse'

export interface CsvLoadResult<T = unknown> {
  data: T[]
  errors: Papa.ParseError[]
  meta: Papa.ParseMeta
  originalCsvText: string
  fileName: string
}

export interface FinancialCsvRecord {
  arten: string
  funk: string
  jahr: string
  value: string
  dim: string
  hh: string
  unit: string
  model: string
}

export interface GdnCsvRecord {
  jahr: string
  nr: string
  gemeinde: string
  konto: string
  funktion: string
  betrag: string
}

/**
 * Loads and parses a CSV file from the public directory
 * @param fileName - Name of the CSV file in public/data/csv/
 * @param delimiter - CSV delimiter (default: ',')
 * @returns Promise with parsed CSV data and metadata
 */
export async function loadCsvFile<T = unknown>(
  fileName: string,
  delimiter: string = ','
): Promise<CsvLoadResult<T>> {
  try {
    const response = await fetch(`/data/csv/${fileName}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse<T>(csvText, {
        header: true,
        delimiter,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().replace(/"/g, ''),
        transform: (value: string) => value.trim().replace(/"/g, ''),
        complete: (results: Papa.ParseResult<T>) => {
          resolve({
            data: results.data,
            errors: results.errors,
            meta: results.meta,
            originalCsvText: csvText,
            fileName
          })
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        }
      })
    })
  } catch (error) {
    throw new Error(`Failed to load CSV file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Loads financial data from standard format CSV files
 * @param entityId - Entity identifier (e.g., "ktn_zh")
 * @param year - Year to load
 * @returns Promise with financial CSV data
 */
export async function loadFinancialCsv(
  entityId: string,
  year: string
): Promise<CsvLoadResult<FinancialCsvRecord>> {
  const fileName = `${entityId}_${year}.csv`
  return loadCsvFile<FinancialCsvRecord>(fileName, ',')
}

/**
 * Loads GDN (municipality) data from CSV files
 * @param gdnId - GDN identifier (e.g., "010176")
 * @param year - Year to load
 * @returns Promise with GDN CSV data
 */
export async function loadGdnCsv(
  gdnId: string,
  year: string
): Promise<CsvLoadResult<GdnCsvRecord>> {
  const fileName = `gdn_${gdnId}_${year}.csv`
  return loadCsvFile<GdnCsvRecord>(fileName, ';')
}

/**
 * Converts GDN CSV records to financial CSV format
 * @param gdnRecords - Array of GDN CSV records
 * @param entityId - Entity identifier to use
 * @returns Array of financial CSV records
 */
export function convertGdnToFinancialFormat(
  gdnRecords: GdnCsvRecord[],
  entityId: string
): FinancialCsvRecord[] {
  return gdnRecords.map(record => ({
    arten: record.konto,
    funk: record.funktion || '',
    jahr: record.jahr,
    value: record.betrag,
    dim: inferDimensionFromKonto(record.konto),
    hh: entityId,
    unit: 'CHF',
    model: 'fs'
  }))
}

/**
 * Infers the dimension type from account code (konto)
 * @param konto - Account code
 * @returns Dimension string
 */
function inferDimensionFromKonto(konto: string): string {
  const code = parseInt(konto)

  // Based on Swiss financial accounting standards
  if (code >= 4000 && code < 5000) {
    return 'einnahmen' // Revenue
  } else if (code >= 3000 && code < 4000) {
    return 'ausgaben' // Expenditure
  } else if (code >= 1000 && code < 2000) {
    return 'vermoegen' // Assets
  } else if (code >= 2000 && code < 3000) {
    return 'schuld' // Liabilities
  } else {
    return 'other'
  }
}

/**
 * Gets available CSV files in the public directory
 * @returns Promise with list of available CSV files
 */
export async function getAvailableCsvFiles(): Promise<string[]> {
  try {
    // This is a simplified approach - in a real application, you might want to
    // maintain a manifest file or use a directory listing API
    const knownFiles = [
      'ktn_zh_2020.csv',
      'ktn_zh_2021.csv',
      'gdn_010176_2020.csv',
      'gdn_010176_2021.csv'
    ]

    const availableFiles: string[] = []

    for (const file of knownFiles) {
      try {
        const response = await fetch(`/data/csv/${file}`, { method: 'HEAD' })
        if (response.ok) {
          availableFiles.push(file)
        }
      } catch {
        // File doesn't exist, skip it
      }
    }

    return availableFiles
  } catch (error) {
    console.error('Error checking available CSV files:', error)
    return []
  }
}

/**
 * Downloads a CSV file for the user
 * @param fileName - Name of the CSV file
 * @param downloadName - Name to use for the downloaded file
 */
export async function downloadCsvFile(fileName: string, downloadName?: string): Promise<void> {
  try {
    const response = await fetch(`/data/csv/${fileName}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = downloadName || fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)
  } catch (error) {
    throw new Error(`Failed to download CSV file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
