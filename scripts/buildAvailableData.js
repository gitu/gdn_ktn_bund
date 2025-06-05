/**
 * Build Available Data Catalog
 *
 * This script combines data from gdn-info.json and std-info.json files into a unified
 * available-data.json file. The output follows the AvailableDataEntry interface:
 *
 * interface AvailableDataEntry {
 *   id: string;
 *   type: 'std' | 'gdn';
 *   entityCode: string;
 *   displayName: MultiLanguageLabels;
 *   description: MultiLanguageLabels;
 *   availableYears: string[];
 *   municipalityNumber?: string; // For GDN entries
 * }
 *
 * For GDN data: preserves municipality names from the gemeinde field
 * For STD data: uses EntitySemanticMapper to generate human-readable names
 */

import fs from 'fs';
import path from 'path';

console.log('Building available data catalog...');

// Import the EntitySemanticMapper - we need to use a dynamic import since it's TypeScript
let EntitySemanticMapper;
try {
  // Use jiti to load TypeScript files in Node.js
  const { createJiti } = await import('jiti');
  const jiti = createJiti(import.meta.url);
  const module = jiti('../src/utils/EntitySemanticMapper.ts');
  EntitySemanticMapper = module.EntitySemanticMapper;
} catch (error) {
  console.error('Error loading EntitySemanticMapper:', error);
  process.exit(1);
}

// Input file paths
const gdnInfoPath = path.resolve('src/data/gdn-info.json');
const stdInfoPath = path.resolve('src/data/std-info.json');

// Output file path
const outputPath = path.resolve('src/data/available-data.json');

/**
 * Read and validate JSON file
 */
function readJsonFile(filePath, description) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error(`Expected array in ${description}, got ${typeof data}`);
    }
    
    console.log(`Successfully loaded ${data.length} entries from ${description}`);
    return data;
  } catch (error) {
    console.error(`Error reading ${description}:`, error.message);
    throw error;
  }
}

/**
 * Process GDN data entries
 * @param {Array} gdnData - Array of GDN data info entries
 * @returns {Array<AvailableDataEntry>} - Array of processed available data entries
 */
function processGdnData(gdnData) {
  console.log('Processing GDN data entries...');

  const processedEntries = [];
  
  gdnData.forEach((entry, index) => {
    try {
      // Validate required fields
      if (!entry.nr || !entry.gemeinde || !entry.models) {
        console.warn(`Skipping GDN entry ${index}: missing required fields`);
        return;
      }
      
      // Extract all available years from all models
      const availableYears = [];
      entry.models.forEach(model => {
        if (model.jahre && Array.isArray(model.jahre)) {
          availableYears.push(...model.jahre);
        }
      });
      
      // Remove duplicates and sort
      const uniqueYears = [...new Set(availableYears)].sort();
      
      if (uniqueYears.length === 0) {
        console.warn(`Skipping GDN entry ${entry.nr}: no available years`);
        return;
      }
      
      // Create the processed entry
      const processedEntry = {
        id: `gdn_${entry.nr}`,
        type: 'gdn',
        entityCode: entry.nr,
        displayName: {
          de: entry.gemeinde,
          fr: entry.gemeinde,
          it: entry.gemeinde,
          en: entry.gemeinde
        },
        description: {
          de: `Finanzdaten der Gemeinde ${entry.gemeinde}`,
          fr: `Données financières de la commune ${entry.gemeinde}`,
          it: `Dati finanziari del comune ${entry.gemeinde}`,
          en: `Financial data for municipality ${entry.gemeinde}`
        },
        availableYears: uniqueYears,
        municipalityNumber: entry.nr
      };
      
      processedEntries.push(processedEntry);
    } catch (error) {
      console.error(`Error processing GDN entry ${index}:`, error.message);
    }
  });
  
  console.log(`Processed ${processedEntries.length} GDN entries`);
  return processedEntries;
}

/**
 * Process STD data entries
 * @param {Array} stdData - Array of STD data info entries
 * @returns {Array<AvailableDataEntry>} - Array of processed available data entries
 */
function processStdData(stdData) {
  console.log('Processing STD data entries...');

  const processedEntries = [];
  
  stdData.forEach((entry, index) => {
    try {
      // Validate required fields
      if (!entry.hh || !entry.models) {
        console.warn(`Skipping STD entry ${index}: missing required fields`);
        return;
      }
      
      // Extract all available years from all models
      const availableYears = [];
      entry.models.forEach(model => {
        if (model.jahre && Array.isArray(model.jahre)) {
          availableYears.push(...model.jahre);
        }
      });
      
      // Remove duplicates and sort
      const uniqueYears = [...new Set(availableYears)].sort();
      
      if (uniqueYears.length === 0) {
        console.warn(`Skipping STD entry ${entry.hh}: no available years`);
        return;
      }
      
      // Use EntitySemanticMapper to get human-readable names
      const displayName = EntitySemanticMapper.getEntityDisplayName(entry.hh);
      const description = EntitySemanticMapper.getEntityDescription(entry.hh);
      
      // Create the processed entry
      const processedEntry = {
        id: `std_${entry.hh}`,
        type: 'std',
        entityCode: entry.hh,
        displayName: displayName,
        description: description,
        availableYears: uniqueYears
      };
      
      processedEntries.push(processedEntry);
    } catch (error) {
      console.error(`Error processing STD entry ${index} (${entry.hh}):`, error.message);
    }
  });
  
  console.log(`Processed ${processedEntries.length} STD entries`);
  return processedEntries;
}

/**
 * Merge and sort all processed entries
 */
function mergeAndSortEntries(gdnEntries, stdEntries) {
  console.log('Merging and sorting entries...');

  const allEntries = [...gdnEntries, ...stdEntries];

  // Sort by display name (German) for consistent ordering
  allEntries.sort((a, b) => {
    return a.displayName.de.localeCompare(b.displayName.de, 'de', {
      numeric: true,
      sensitivity: 'base'
    });
  });

  console.log(`Merged ${allEntries.length} total entries (${gdnEntries.length} GDN + ${stdEntries.length} STD)`);
  return allEntries;
}

/**
 * Write the unified data to output file
 */
function writeOutputFile(data, outputPath) {
  try {
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the JSON file with pretty formatting
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(outputPath, jsonContent, 'utf8');

    console.log(`Successfully wrote ${data.length} entries to ${outputPath}`);
    console.log(`Output file size: ${(jsonContent.length / 1024).toFixed(2)} KB`);

    // Verify the file was created and is readable
    if (fs.existsSync(outputPath)) {
      const verification = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      if (verification.length === data.length) {
        console.log('✓ Output file verification successful');
      } else {
        throw new Error(`Verification failed: expected ${data.length} entries, found ${verification.length}`);
      }
    } else {
      throw new Error('Output file was not created');
    }
  } catch (error) {
    console.error('Error writing output file:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('Building Available Data Catalog');
    console.log('='.repeat(50));

    // Read input files
    const gdnData = readJsonFile(gdnInfoPath, 'GDN info file');
    const stdData = readJsonFile(stdInfoPath, 'STD info file');

    // Process data
    const gdnEntries = processGdnData(gdnData);
    const stdEntries = processStdData(stdData);

    // Merge and sort
    const allEntries = mergeAndSortEntries(gdnEntries, stdEntries);

    // Write output
    writeOutputFile(allEntries, outputPath);

    console.log('='.repeat(50));
    console.log('✓ Available data catalog build completed successfully');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('='.repeat(50));
    console.error('✗ Build failed:', error.message);
    console.error('='.repeat(50));
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
