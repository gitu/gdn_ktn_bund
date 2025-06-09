/**
 * Fetch Atlas Data Script
 *
 * This script reads the stats.json file and fetches CSV data from the Swiss Federal
 * Statistical Office atlas (atlas.bfs.admin.ch) based on the atlas IDs defined in the stats.
 *
 * URL pattern: https://www.atlas.bfs.admin.ch/core/projects/13/xshared/csv/{atlasId}_131.csv
 *
 * The script will:
 * 1. Read public/data/stats/stats.json
 * 2. Extract all atlas IDs from the data entries
 * 3. Fetch the corresponding CSV files from the atlas
 * 4. Save them to the appropriate directories as defined in the stats.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Atlas data fetching...');

// Configuration
const ATLAS_BASE_URL = 'https://www.atlas.bfs.admin.ch/core/projects/13/xshared/csv';
const STATS_JSON_PATH = path.resolve('public/data/stats/stats.json');
const OUTPUT_BASE_DIR = path.resolve('public/data/stats');

/**
 * Read and parse the stats.json file
 */
function readStatsConfig() {
  try {
    if (!fs.existsSync(STATS_JSON_PATH)) {
      throw new Error(`Stats configuration file not found: ${STATS_JSON_PATH}`);
    }

    const content = fs.readFileSync(STATS_JSON_PATH, 'utf8');
    const config = JSON.parse(content);

    if (!config.stats || !Array.isArray(config.stats)) {
      throw new Error('Invalid stats.json format: expected "stats" array');
    }

    console.log(`Successfully loaded stats configuration with ${config.stats.length} statistics`);
    return config;
  } catch (error) {
    console.error('Error reading stats configuration:', error.message);
    throw error;
  }
}

/**
 * Extract all atlas data entries from the stats configuration
 */
function extractAtlasEntries(statsConfig) {
  const entries = [];

  statsConfig.stats.forEach(stat => {
    const statId = stat.id;
    
    if (!stat.data) {
      console.warn(`No data section found for statistic: ${statId}`);
      return;
    }

    // Process KTN (canton) data
    if (stat.data.ktn && Array.isArray(stat.data.ktn)) {
      stat.data.ktn.forEach(entry => {
        if (entry.atlasId && entry.file) {
          entries.push({
            statId,
            type: 'ktn',
            year: entry.year,
            atlasId: entry.atlasId,
            file: entry.file,
            outputPath: path.join(OUTPUT_BASE_DIR, entry.file)
          });
        }
      });
    }

    // Process GDN (municipality) data
    if (stat.data.gdn && Array.isArray(stat.data.gdn)) {
      stat.data.gdn.forEach(entry => {
        if (entry.atlasId && entry.file) {
          entries.push({
            statId,
            type: 'gdn',
            year: entry.year,
            atlasId: entry.atlasId,
            file: entry.file,
            outputPath: path.join(OUTPUT_BASE_DIR, entry.file)
          });
        }
      });
    }
  });

  console.log(`Found ${entries.length} atlas data entries to fetch`);
  return entries;
}

/**
 * Fetch CSV data from the atlas
 */
async function fetchAtlasData(atlasId) {
  const url = `${ATLAS_BASE_URL}/${atlasId}_131.csv`;
  
  try {
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvData = await response.text();
    
    if (!csvData || csvData.trim().length === 0) {
      throw new Error('Empty response received');
    }

    console.log(`✓ Successfully fetched ${csvData.length} characters from atlas ID ${atlasId}`);
    return csvData;
  } catch (error) {
    console.error(`✗ Failed to fetch atlas ID ${atlasId}:`, error.message);
    throw error;
  }
}

/**
 * Ensure directory exists
 */
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

/**
 * Save CSV data to file
 */
function saveCsvData(csvData, outputPath) {
  try {
    ensureDirectoryExists(outputPath);
    fs.writeFileSync(outputPath, csvData, 'utf8');
    console.log(`✓ Saved to: ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to save to ${outputPath}:`, error.message);
    throw error;
  }
}

/**
 * Process a single atlas entry
 */
async function processAtlasEntry(entry, forceOverwrite = false) {
  try {
    console.log(`\nProcessing: ${entry.statId}/${entry.type}/${entry.year} (Atlas ID: ${entry.atlasId})`);

    // Check if file already exists and we're not forcing overwrite
    if (fs.existsSync(entry.outputPath) && !forceOverwrite) {
      console.log(`File already exists: ${entry.outputPath}`);
      console.log('Use --force flag to overwrite existing files');
      return { success: true, skipped: true };
    }

    // Fetch the data
    const csvData = await fetchAtlasData(entry.atlasId);

    // Save the data
    saveCsvData(csvData, entry.outputPath);

    return { success: true, skipped: false };
  } catch (error) {
    console.error(`Failed to process entry:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('Atlas Data Fetcher');
    console.log('='.repeat(60));

    // Check for force flag
    const forceOverwrite = process.argv.includes('--force');
    if (forceOverwrite) {
      console.log('Force overwrite mode enabled');
    }

    // Read stats configuration
    const statsConfig = readStatsConfig();
    
    // Extract atlas entries
    const atlasEntries = extractAtlasEntries(statsConfig);
    
    if (atlasEntries.length === 0) {
      console.log('No atlas entries found to process');
      return;
    }

    // Process entries
    console.log(`\nProcessing ${atlasEntries.length} atlas entries...`);
    
    const results = {
      total: atlasEntries.length,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const entry of atlasEntries) {
      const result = await processAtlasEntry(entry, forceOverwrite);
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.success++;
        }
      } else {
        results.failed++;
        results.errors.push({
          entry: `${entry.statId}/${entry.type}/${entry.year}`,
          error: result.error
        });
      }

      // Add a small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total entries: ${results.total}`);
    console.log(`Successfully fetched: ${results.success}`);
    console.log(`Skipped (already exist): ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(error => {
        console.log(`  ${error.entry}: ${error.error}`);
      });
    }

    if (results.failed > 0) {
      console.log('\n⚠️  Some entries failed to fetch. Check the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All atlas data fetched successfully!');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
