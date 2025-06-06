/**
 * Utility for loading and working with Swiss geographical data (cantons and municipalities)
 */

import * as Papa from 'papaparse'
import type {
  Canton,
  Municipality,
  GeographicalDataCatalog,
  GeographicalDataFilters,
  GeographicalDataConfig,
  GeographicalDataQueryResult,
} from '../types/GeographicalData'

/**
 * Raw canton data from CSV
 */
interface RawCantonData {
  cantonId: string
  cantonAbbreviation: string
  cantonLongName: string
}

/**
 * Raw municipality data from CSV
 */
interface RawMunicipalityData {
  cantonId: string
  cantonAbbreviation: string
  municipalityId: string
  municipalityLongName: string
  gdnId: string
}

/**
 * GeographicalDataLoader class for loading and managing Swiss geographical data
 */
export class GeographicalDataLoader {
  private static instance: GeographicalDataLoader
  private catalog: GeographicalDataCatalog | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): GeographicalDataLoader {
    if (!GeographicalDataLoader.instance) {
      GeographicalDataLoader.instance = new GeographicalDataLoader()
    }
    return GeographicalDataLoader.instance
  }

  /**
   * Load the complete geographical data catalog
   */
  async loadGeographicalDataCatalog(): Promise<GeographicalDataCatalog> {
    if (this.catalog) {
      return this.catalog
    }

    try {
      const [cantons, municipalities] = await Promise.all([
        this.loadCantons(),
        this.loadMunicipalities(),
      ])

      this.catalog = this.buildCatalogWithIndexes(cantons, municipalities)
      return this.catalog
    } catch (error) {
      console.error('Error loading geographical data catalog:', error)
      throw error
    }
  }

  /**
   * Load canton data from CSV
   */
  private async loadCantons(): Promise<Canton[]> {
    try {
      const response = await fetch('/data/cantons.csv')
      if (!response.ok) {
        throw new Error(`Failed to fetch cantons data: ${response.statusText}`)
      }

      const csvText = await response.text()
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string) => value.trim(),
      }) as Papa.ParseResult<RawCantonData>

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings for cantons:', parseResult.errors)
      }

      return parseResult.data.map((row) => ({
        cantonId: row.cantonId,
        cantonAbbreviation: row.cantonAbbreviation,
        cantonLongName: row.cantonLongName,
      }))
    } catch (error) {
      console.error('Error loading cantons:', error)
      throw error
    }
  }

  /**
   * Load municipality data from CSV
   */
  private async loadMunicipalities(): Promise<Municipality[]> {
    try {
      const response = await fetch('/data/municipalities.csv')
      if (!response.ok) {
        throw new Error(`Failed to fetch municipalities data: ${response.statusText}`)
      }

      const csvText = await response.text()
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string) => value.trim(),
      }) as Papa.ParseResult<RawMunicipalityData>

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings for municipalities:', parseResult.errors)
      }

      return parseResult.data.map((row) => ({
        cantonId: row.cantonId,
        cantonAbbreviation: row.cantonAbbreviation,
        municipalityId: row.municipalityId,
        municipalityLongName: row.municipalityLongName,
        gdnId: row.gdnId,
      }))
    } catch (error) {
      console.error('Error loading municipalities:', error)
      throw error
    }
  }

  /**
   * Build catalog with indexes for fast lookups
   */
  private buildCatalogWithIndexes(
    cantons: Canton[],
    municipalities: Municipality[],
  ): GeographicalDataCatalog {
    const cantonById = new Map<string, Canton>()
    const cantonByAbbreviation = new Map<string, Canton>()
    const municipalityByGdnId = new Map<string, Municipality>()
    const municipalitiesByCantonId = new Map<string, Municipality[]>()
    const municipalitiesByCantonAbbreviation = new Map<string, Municipality[]>()

    // Index cantons
    cantons.forEach((canton) => {
      cantonById.set(canton.cantonId, canton)
      cantonByAbbreviation.set(canton.cantonAbbreviation, canton)
    })

    // Index municipalities
    municipalities.forEach((municipality) => {
      municipalityByGdnId.set(municipality.gdnId, municipality)

      // Group by canton ID
      if (!municipalitiesByCantonId.has(municipality.cantonId)) {
        municipalitiesByCantonId.set(municipality.cantonId, [])
      }
      municipalitiesByCantonId.get(municipality.cantonId)!.push(municipality)

      // Group by canton abbreviation
      if (!municipalitiesByCantonAbbreviation.has(municipality.cantonAbbreviation)) {
        municipalitiesByCantonAbbreviation.set(municipality.cantonAbbreviation, [])
      }
      municipalitiesByCantonAbbreviation.get(municipality.cantonAbbreviation)!.push(municipality)
    })

    return {
      cantons,
      municipalities,
      indexes: {
        cantonById,
        cantonByAbbreviation,
        municipalityByGdnId,
        municipalitiesByCantonId,
        municipalitiesByCantonAbbreviation,
      },
    }
  }

  /**
   * Get canton by ID
   */
  async getCantonById(cantonId: string): Promise<Canton | undefined> {
    const catalog = await this.loadGeographicalDataCatalog()
    return catalog.indexes.cantonById.get(cantonId)
  }

  /**
   * Get canton by abbreviation
   */
  async getCantonByAbbreviation(abbreviation: string): Promise<Canton | undefined> {
    const catalog = await this.loadGeographicalDataCatalog()
    return catalog.indexes.cantonByAbbreviation.get(abbreviation)
  }

  /**
   * Get municipality by GDN ID
   */
  async getMunicipalityByGdnId(gdnId: string): Promise<Municipality | undefined> {
    const catalog = await this.loadGeographicalDataCatalog()
    console.log(catalog.indexes.municipalityByGdnId)
    console.log(gdnId)
    console.log(catalog.indexes.municipalityByGdnId.get(gdnId))
    return catalog.indexes.municipalityByGdnId.get(gdnId)
  }

  /**
   * Get all municipalities in a canton by canton ID
   */
  async getMunicipalitiesByCantonId(cantonId: string): Promise<Municipality[]> {
    const catalog = await this.loadGeographicalDataCatalog()
    return catalog.indexes.municipalitiesByCantonId.get(cantonId) || []
  }

  /**
   * Get all municipalities in a canton by canton abbreviation
   */
  async getMunicipalitiesByCantonAbbreviation(abbreviation: string): Promise<Municipality[]> {
    const catalog = await this.loadGeographicalDataCatalog()
    return catalog.indexes.municipalitiesByCantonAbbreviation.get(abbreviation) || []
  }

  /**
   * Get all cantons
   */
  async getAllCantons(): Promise<Canton[]> {
    const catalog = await this.loadGeographicalDataCatalog()
    return catalog.cantons
  }

  /**
   * Get all municipalities
   */
  async getAllMunicipalities(): Promise<Municipality[]> {
    const catalog = await this.loadGeographicalDataCatalog()
    return catalog.municipalities
  }

  /**
   * Search geographical data with filters
   */
  async searchGeographicalData(
    filters: GeographicalDataFilters = {},
    config: GeographicalDataConfig = {
      language: 'de',
      includeMultilingualLabels: true,
      caseSensitiveSearch: false,
    },
  ): Promise<GeographicalDataQueryResult> {
    const catalog = await this.loadGeographicalDataCatalog()

    let filteredCantons = catalog.cantons
    let filteredMunicipalities = catalog.municipalities

    // Apply search query filter
    if (filters.searchQuery) {
      const query = config.caseSensitiveSearch
        ? filters.searchQuery
        : filters.searchQuery.toLowerCase()

      filteredCantons = filteredCantons.filter((canton) => {
        const searchText = config.caseSensitiveSearch
          ? `${canton.cantonLongName} ${canton.cantonAbbreviation}`
          : `${canton.cantonLongName} ${canton.cantonAbbreviation}`.toLowerCase()
        return searchText.includes(query)
      })

      filteredMunicipalities = filteredMunicipalities.filter((municipality) => {
        const searchText = config.caseSensitiveSearch
          ? `${municipality.municipalityLongName} ${municipality.cantonAbbreviation}`
          : `${municipality.municipalityLongName} ${municipality.cantonAbbreviation}`.toLowerCase()
        return searchText.includes(query)
      })
    }

    // Apply canton filters
    if (filters.cantonIds && filters.cantonIds.length > 0) {
      filteredCantons = filteredCantons.filter((canton) =>
        filters.cantonIds!.includes(canton.cantonId),
      )
      filteredMunicipalities = filteredMunicipalities.filter((municipality) =>
        filters.cantonIds!.includes(municipality.cantonId),
      )
    }

    if (filters.cantonAbbreviations && filters.cantonAbbreviations.length > 0) {
      filteredCantons = filteredCantons.filter((canton) =>
        filters.cantonAbbreviations!.includes(canton.cantonAbbreviation),
      )
      filteredMunicipalities = filteredMunicipalities.filter((municipality) =>
        filters.cantonAbbreviations!.includes(municipality.cantonAbbreviation),
      )
    }

    return {
      cantons: filteredCantons,
      municipalities: filteredMunicipalities,
      totalCount: filteredCantons.length + filteredMunicipalities.length,
      appliedFilters: filters,
    }
  }

  /**
   * Get canton statistics
   */
  async getCantonStatistics(): Promise<
    Map<string, { cantonName: string; municipalityCount: number }>
  > {
    const catalog = await this.loadGeographicalDataCatalog()
    const stats = new Map<string, { cantonName: string; municipalityCount: number }>()

    catalog.cantons.forEach((canton) => {
      const municipalityCount =
        catalog.indexes.municipalitiesByCantonId.get(canton.cantonId)?.length || 0
      stats.set(canton.cantonId, {
        cantonName: canton.cantonLongName,
        municipalityCount,
      })
    })

    return stats
  }

  /**
   * Validate GDN ID format
   */
  static validateGdnId(gdnId: string): boolean {
    // GDN ID should be 7 digits: 2 for canton + 5 for municipality
    return /^\d{7}$/.test(gdnId)
  }

  /**
   * Extract canton ID from GDN ID
   */
  static extractCantonIdFromGdnId(gdnId: string): string | null {
    if (!this.validateGdnId(gdnId)) {
      return null
    }
    return gdnId.substring(0, 2)
  }

  /**
   * Extract municipality ID from GDN ID
   */
  static extractMunicipalityIdFromGdnId(gdnId: string): string | null {
    if (!this.validateGdnId(gdnId)) {
      return null
    }
    return gdnId.substring(2)
  }

  /**
   * Format GDN ID from canton and municipality IDs
   */
  static formatGdnId(cantonId: string, municipalityId: string): string {
    const paddedCantonId = cantonId.padStart(2, '0')
    const paddedMunicipalityId = municipalityId.padStart(5, '0')
    return paddedCantonId + paddedMunicipalityId
  }

  /**
   * Clear cached data (useful for testing or forcing reload)
   */
  clearCache(): void {
    this.catalog = null
  }
}

/**
 * Convenience functions for easy access to geographical data
 */

/**
 * Load the geographical data catalog
 */
export async function loadGeographicalDataCatalog(): Promise<GeographicalDataCatalog> {
  const loader = GeographicalDataLoader.getInstance()
  return loader.loadGeographicalDataCatalog()
}

/**
 * Get all Swiss cantons
 */
export async function getAllCantons(): Promise<Canton[]> {
  const loader = GeographicalDataLoader.getInstance()
  return loader.getAllCantons()
}

/**
 * Get all Swiss municipalities
 */
export async function getAllMunicipalities(): Promise<Municipality[]> {
  const loader = GeographicalDataLoader.getInstance()
  return loader.getAllMunicipalities()
}

/**
 * Get canton by ID
 */
export async function getCantonById(cantonId: string): Promise<Canton | undefined> {
  const loader = GeographicalDataLoader.getInstance()
  return loader.getCantonById(cantonId)
}

/**
 * Get canton by abbreviation
 */
export async function getCantonByAbbreviation(abbreviation: string): Promise<Canton | undefined> {
  const loader = GeographicalDataLoader.getInstance()
  return loader.getCantonByAbbreviation(abbreviation)
}

/**
 * Get municipality by GDN ID
 */
export async function getMunicipalityByGdnId(gdnId: string): Promise<Municipality | undefined> {
  const loader = GeographicalDataLoader.getInstance()
  return loader.getMunicipalityByGdnId(gdnId)
}

/**
 * Get all municipalities in a canton
 */
export async function getMunicipalitiesByCantonAbbreviation(
  abbreviation: string,
): Promise<Municipality[]> {
  const loader = GeographicalDataLoader.getInstance()
  return loader.getMunicipalitiesByCantonAbbreviation(abbreviation)
}

/**
 * Search geographical data
 */
export async function searchGeographicalData(
  filters: GeographicalDataFilters = {},
  config?: GeographicalDataConfig,
): Promise<GeographicalDataQueryResult> {
  const loader = GeographicalDataLoader.getInstance()
  return loader.searchGeographicalData(filters, config)
}
