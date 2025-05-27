/**
 * Entity Loader for Swiss Financial Data
 *
 * This module loads entity options from JSON files in the src/data directory
 * and transforms them into a format suitable for UI components.
 */

// Define interfaces for the JSON data structures
export interface GdnInfo {
  nr: string;           // Municipality number (e.g., "010176")
  gemeinde: string;     // Municipality name (e.g., "Lindau")
  jahre: string[];      // Available years
}

export interface StdModelInfo {
  model: string;        // Model type (e.g., "fs", "gfs")
  jahre: string[];      // Available years for this model
}

export interface StdInfo {
  hh: string;           // Entity identifier (e.g., "ktn_zh", "bund")
  models: StdModelInfo[];
}

// Define the unified entity option interface for UI components
export interface EntityOption {
  id: string;           // Entity identifier (e.g., "gdn_010176", "ktn_zh")
  name: string;         // Display name
  type: 'GDN' | 'STD';  // Entity type
  availableYears: string[]; // Years with available data
  originalData?: GdnInfo | StdInfo; // Reference to original data
}

// Define error types for better error handling
export class EntityLoadError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EntityLoadError';
  }
}

/**
 * Loads and parses GDN (municipality) information from JSON file
 */
export async function loadGdnInfo(): Promise<GdnInfo[]> {
  try {
    console.log('Loading GDN info from /data/gdn-info.json...');
    const response = await fetch('/data/gdn-info.json');

    if (!response.ok) {
      throw new EntityLoadError(`Failed to fetch GDN info: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Loaded ${Array.isArray(data) ? data.length : 'invalid'} GDN entries`);

    if (!Array.isArray(data)) {
      throw new EntityLoadError('GDN info data is not an array');
    }

    // Validate the structure of each item (check first few items only for performance)
    const itemsToCheck = Math.min(data.length, 5);
    for (let i = 0; i < itemsToCheck; i++) {
      const item = data[i];
      if (!item.nr || !item.gemeinde || !Array.isArray(item.jahre)) {
        throw new EntityLoadError(`Invalid GDN info item structure at index ${i}: ${JSON.stringify(item)}`);
      }
    }

    return data as GdnInfo[];
  } catch (error) {
    console.error('Error loading GDN info:', error);
    if (error instanceof EntityLoadError) {
      throw error;
    }
    throw new EntityLoadError('Failed to load GDN info', error as Error);
  }
}

/**
 * Loads and parses STD (standard entities) information from JSON file
 */
export async function loadStdInfo(): Promise<StdInfo[]> {
  try {
    console.log('Loading STD info from /data/std-info.json...');
    const response = await fetch('/data/std-info.json');

    if (!response.ok) {
      throw new EntityLoadError(`Failed to fetch STD info: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Loaded ${Array.isArray(data) ? data.length : 'invalid'} STD entries`);

    if (!Array.isArray(data)) {
      throw new EntityLoadError('STD info data is not an array');
    }

    // Validate the structure of each item (check first few items only for performance)
    const itemsToCheck = Math.min(data.length, 5);
    for (let i = 0; i < itemsToCheck; i++) {
      const item = data[i];
      if (!item.hh || !Array.isArray(item.models)) {
        throw new EntityLoadError(`Invalid STD info item structure at index ${i}: ${JSON.stringify(item)}`);
      }

      for (const model of item.models) {
        if (!model.model || !Array.isArray(model.jahre)) {
          throw new EntityLoadError(`Invalid STD model structure: ${JSON.stringify(model)}`);
        }
      }
    }

    return data as StdInfo[];
  } catch (error) {
    console.error('Error loading STD info:', error);
    if (error instanceof EntityLoadError) {
      throw error;
    }
    throw new EntityLoadError('Failed to load STD info', error as Error);
  }
}

/**
 * Transforms GDN info into entity options
 */
export function transformGdnToEntityOptions(gdnInfoList: GdnInfo[]): EntityOption[] {
  return gdnInfoList.map(gdnInfo => ({
    id: `gdn_${gdnInfo.nr}`,
    name: `${gdnInfo.gemeinde} (GDN ${gdnInfo.nr})`,
    type: 'GDN' as const,
    availableYears: [...gdnInfo.jahre].sort(),
    originalData: gdnInfo
  }));
}

/**
 * Transforms STD info into entity options
 */
export function transformStdToEntityOptions(stdInfoList: StdInfo[]): EntityOption[] {
  return stdInfoList.map(stdInfo => {
    // Combine all years from all models and remove duplicates
    const allYears = new Set<string>();
    stdInfo.models.forEach(model => {
      model.jahre.forEach(year => allYears.add(year));
    });

    // Generate display name based on entity type
    let displayName: string;
    if (stdInfo.hh === 'bund') {
      displayName = 'Federal Government (BUND)';
    } else if (stdInfo.hh.startsWith('ktn_')) {
      const cantonCode = stdInfo.hh.replace('ktn_', '').toUpperCase();
      displayName = `Canton of ${cantonCode} (KTN ${cantonCode})`;
    } else if (stdInfo.hh.startsWith('gdn_')) {
      const regionCode = stdInfo.hh.replace('gdn_', '').toUpperCase();
      displayName = `Municipalities of ${regionCode} (GDN ${regionCode})`;
    } else {
      displayName = `${stdInfo.hh.toUpperCase()}`;
    }

    return {
      id: stdInfo.hh,
      name: displayName,
      type: 'STD' as const,
      availableYears: Array.from(allYears).sort(),
      originalData: stdInfo
    };
  });
}

/**
 * Loads all entity options from both GDN and STD sources
 */
export async function loadAllEntityOptions(): Promise<EntityOption[]> {
  try {
    // Load both data sources in parallel
    const [gdnInfoList, stdInfoList] = await Promise.all([
      loadGdnInfo(),
      loadStdInfo()
    ]);

    // Transform to entity options
    const gdnOptions = transformGdnToEntityOptions(gdnInfoList);
    const stdOptions = transformStdToEntityOptions(stdInfoList);

    // Combine and sort by name
    const allOptions = [...gdnOptions, ...stdOptions];
    allOptions.sort((a, b) => a.name.localeCompare(b.name));

    return allOptions;
  } catch (error) {
    if (error instanceof EntityLoadError) {
      throw error;
    }
    throw new EntityLoadError('Failed to load entity options', error as Error);
  }
}

/**
 * Gets entity options filtered by type
 */
export async function getEntityOptionsByType(type: 'GDN' | 'STD'): Promise<EntityOption[]> {
  const allOptions = await loadAllEntityOptions();
  return allOptions.filter(option => option.type === type);
}

/**
 * Gets a specific entity option by ID
 */
export async function getEntityOptionById(id: string): Promise<EntityOption | null> {
  const allOptions = await loadAllEntityOptions();
  return allOptions.find(option => option.id === id) || null;
}

/**
 * Gets all available years across all entities
 */
export async function getAllAvailableYears(): Promise<string[]> {
  const allOptions = await loadAllEntityOptions();
  const allYears = new Set<string>();

  allOptions.forEach(option => {
    option.availableYears.forEach(year => allYears.add(year));
  });

  return Array.from(allYears).sort();
}
