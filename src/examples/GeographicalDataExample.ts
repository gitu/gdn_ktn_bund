/**
 * Example usage of the GeographicalDataLoader utility
 * This file demonstrates how to use the utility to load and work with Swiss geographical data
 */

import {
  GeographicalDataLoader,
  getAllCantons,
  getAllMunicipalities,
  getCantonById,
  getCantonByAbbreviation,
  getMunicipalityByGdnId,
  getMunicipalitiesByCantonAbbreviation,
  searchGeographicalData
} from '../utils/GeographicalDataLoader';

/**
 * Example: Basic usage - loading all data
 */
export async function exampleBasicUsage() {
  console.log('=== Basic Usage Example ===');
  
  // Get all cantons
  const cantons = await getAllCantons();
  console.log(`Total cantons: ${cantons.length}`);
  console.log('First 3 cantons:', cantons.slice(0, 3).map(c => `${c.cantonAbbreviation}: ${c.cantonLongName}`));

  // Get all municipalities
  const municipalities = await getAllMunicipalities();
  console.log(`Total municipalities: ${municipalities.length}`);
  console.log('First 3 municipalities:', municipalities.slice(0, 3).map(m => `${m.municipalityLongName} (${m.cantonAbbreviation})`));
}

/**
 * Example: Looking up specific data
 */
export async function exampleLookups() {
  console.log('\n=== Lookup Examples ===');

  // Get canton by ID
  const zurichCanton = await getCantonById('1');
  if (zurichCanton) {
    console.log(`Canton ID 1: ${zurichCanton.cantonLongName} (${zurichCanton.cantonAbbreviation})`);
    console.log('Canton details:', zurichCanton);
  }

  // Get canton by abbreviation
  const bernCanton = await getCantonByAbbreviation('BE');
  if (bernCanton) {
    console.log(`Canton BE: ${bernCanton.cantonLongName}`);
    console.log('Canton details:', bernCanton);
  }

  // Get municipality by GDN ID
  const municipality = await getMunicipalityByGdnId('0100230');
  if (municipality) {
    console.log(`GDN ID 0100230: ${municipality.municipalityLongName} in ${municipality.cantonAbbreviation}`);
  }

  // Get all municipalities in a canton
  const zurichMunicipalities = await getMunicipalitiesByCantonAbbreviation('ZH');
  console.log(`Municipalities in Zurich canton: ${zurichMunicipalities.length}`);
  console.log('First 5:', zurichMunicipalities.slice(0, 5).map(m => m.municipalityLongName));
}

/**
 * Example: Search functionality
 */
export async function exampleSearch() {
  console.log('\n=== Search Examples ===');

  // Search by name
  const searchResult1 = await searchGeographicalData({ searchQuery: 'Zürich' });
  console.log(`Search for "Zürich": ${searchResult1.totalCount} results`);
  console.log('Cantons:', searchResult1.cantons.map(c => c.cantonLongName));
  console.log('Municipalities:', searchResult1.municipalities.map(m => m.municipalityLongName));

  // Search with canton filter
  const searchResult2 = await searchGeographicalData({ 
    searchQuery: 'Basel',
    cantonAbbreviations: ['BS', 'BL'] 
  });
  console.log(`Search for "Basel" in BS/BL cantons: ${searchResult2.totalCount} results`);

  // Case-sensitive search
  const searchResult3 = await searchGeographicalData(
    { searchQuery: 'bern' },
    { language: 'de', includeMultilingualLabels: true, caseSensitiveSearch: false }
  );
  console.log(`Case-insensitive search for "bern": ${searchResult3.totalCount} results`);
}

/**
 * Example: Working with GDN IDs
 */
export async function exampleGdnIdOperations() {
  console.log('\n=== GDN ID Operations ===');

  // Validate GDN IDs
  const validGdnIds = ['0100230', '1904001', '2506621'];
  const invalidGdnIds = ['123', '12345678', 'abc1234'];

  console.log('Valid GDN IDs:');
  validGdnIds.forEach(id => {
    const isValid = GeographicalDataLoader.validateGdnId(id);
    const cantonId = GeographicalDataLoader.extractCantonIdFromGdnId(id);
    const municipalityId = GeographicalDataLoader.extractMunicipalityIdFromGdnId(id);
    console.log(`  ${id}: valid=${isValid}, canton=${cantonId}, municipality=${municipalityId}`);
  });

  console.log('Invalid GDN IDs:');
  invalidGdnIds.forEach(id => {
    const isValid = GeographicalDataLoader.validateGdnId(id);
    console.log(`  ${id}: valid=${isValid}`);
  });

  // Format GDN ID
  const formattedId = GeographicalDataLoader.formatGdnId('1', '230');
  console.log(`Formatted GDN ID for canton 1, municipality 230: ${formattedId}`);
}

/**
 * Example: Statistics
 */
export async function exampleStatistics() {
  console.log('\n=== Statistics Example ===');

  const loader = GeographicalDataLoader.getInstance();
  const stats = await loader.getCantonStatistics();

  console.log('Canton statistics:');
  for (const [_cantonId, stat] of stats.entries()) {
    console.log(`  ${stat.cantonName}: ${stat.municipalityCount} municipalities`);
  }

  // Find canton with most municipalities
  let maxMunicipalities = 0;
  let cantonWithMost = '';
  for (const [_cantonId, stat] of stats.entries()) {
    if (stat.municipalityCount > maxMunicipalities) {
      maxMunicipalities = stat.municipalityCount;
      cantonWithMost = stat.cantonName;
    }
  }
  console.log(`Canton with most municipalities: ${cantonWithMost} (${maxMunicipalities})`);
}

/**
 * Example: Integration with existing data structures
 */
export async function exampleIntegration() {
  console.log('\n=== Integration Example ===');

  // Example: Find municipalities that have financial data available
  // This would integrate with the existing AvailableDataLoader
  const municipalities = await getAllMunicipalities();
  
  // Simulate checking which municipalities have data (in real usage, you'd check against gdn-info.json)
  const municipalitiesWithData = municipalities.filter(m => 
    m.cantonAbbreviation === 'ZH' || m.cantonAbbreviation === 'AG'
  );

  console.log(`Municipalities with financial data: ${municipalitiesWithData.length}`);
  console.log('Examples:', municipalitiesWithData.slice(0, 5).map(m => 
    `${m.municipalityLongName} (${m.gdnId})`
  ));

  // Example: Generate entity codes for use with EntitySemanticMapper
  const zurichMunicipalities = await getMunicipalitiesByCantonAbbreviation('ZH');
  console.log('\nEntity codes for Zurich municipalities:');
  zurichMunicipalities.slice(0, 3).forEach(m => {
    console.log(`  ${m.municipalityLongName}: gdn/${m.gdnId}`);
  });
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await exampleBasicUsage();
    await exampleLookups();
    await exampleSearch();
    await exampleGdnIdOperations();
    await exampleStatistics();
    await exampleIntegration();
    
    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment the line below to run examples when this file is executed directly
// runAllExamples();
