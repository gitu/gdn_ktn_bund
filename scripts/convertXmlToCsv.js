import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { DOMParser } from '@xmldom/xmldom';

console.log('Starting XML to CSV conversion...');

// Paths
const xmlInputFilePath = path.resolve('data/eCH0071_250406.xml');
const cantonsOutputPath = path.resolve('public/data/cantons.csv');
const municipalitiesOutputPath = path.resolve('public/data/municipalities.csv');

// Allow command line override for input file (useful for testing)
const inputFile = process.argv[2] || xmlInputFilePath;

/**
 * Parse XML file and extract data
 */
function parseXmlFile() {
  console.log(`Reading XML file: ${inputFile}`);

  if (!fs.existsSync(inputFile)) {
    throw new Error(`XML file not found: ${inputFile}`);
  }

  const xmlContent = fs.readFileSync(inputFile, 'utf8');
  console.log(`Successfully read XML file (${xmlContent.length} characters)`);

  console.log('Parsing XML content...');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parserErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parserErrors.length > 0) {
    throw new Error('XML parsing failed: ' + parserErrors[0].textContent);
  }

  console.log('XML parsed successfully');
  return xmlDoc;
}

/**
 * Extract text content from XML element, handling missing elements
 */
function getElementText(element, tagName) {
  const elements = element.getElementsByTagName(tagName);
  return elements.length > 0 ? elements[0].textContent.trim() : '';
}

/**
 * Extract canton data from XML
 */
function extractCantonData(xmlDoc) {
  console.log('Extracting canton data...');

  const cantons = [];
  const cantonElements = xmlDoc.getElementsByTagName('canton');

  console.log(`Found ${cantonElements.length} canton elements`);

  for (let i = 0; i < cantonElements.length; i++) {
    const canton = cantonElements[i];

    try {
      const cantonData = {
        cantonId: getElementText(canton, 'cantonId'),
        cantonAbbreviation: getElementText(canton, 'cantonAbbreviation'),
        cantonLongName: getElementText(canton, 'cantonLongName'),
        };

      // Validate required fields
      if (!cantonData.cantonId || !cantonData.cantonAbbreviation || !cantonData.cantonLongName) {
        console.warn(`Skipping canton ${i + 1}: missing required fields`);
        continue;
      }

      cantons.push(cantonData);
    } catch (error) {
      console.warn(`Error processing canton ${i + 1}:`, error.message);
    }
  }

  console.log(`Successfully extracted ${cantons.length} cantons`);
  return cantons;
}

/**
 * Extract municipality data from XML
 */
function extractMunicipalityData(xmlDoc, cantonMapping) {
  console.log('Extracting municipality data...');

  const municipalities = [];
  const seenMunicipalityIds = new Set(); // Track unique municipality IDs to avoid duplicates
  const municipalityElements = xmlDoc.getElementsByTagName('municipality');

  console.log(`Found ${municipalityElements.length} municipality elements`);

  for (let i = 0; i < municipalityElements.length; i++) {
    const municipality = municipalityElements[i];

    try {
      // Only include active municipalities with current entry mode and no admission mode
      const municipalityStatus = getElementText(municipality, 'municipalityStatus');
      const municipalityEntryMode = getElementText(municipality, 'municipalityEntryMode');
      const municipalityAbolitionMode = getElementText(municipality, 'municipalityAbolitionMode');

      if (municipalityStatus !== '1') {
        continue;
      }
      if (municipalityEntryMode !== '11') {
        continue;
      }

      if (municipalityAbolitionMode) {
        continue;
      }

      const cantonAbbreviation = getElementText(municipality, 'cantonAbbreviation');
      const cantonId = cantonMapping.get(cantonAbbreviation);
      const municipalityId = getElementText(municipality, 'municipalityId');

      // Skip if we've already seen this municipality ID (avoid duplicates)
      if (seenMunicipalityIds.has(municipalityId)) {
        console.warn(`Skipping duplicate municipality ID: ${municipalityId}`);
        continue;
      }

      // Create gdnId: canton ID (2 digits) + municipality ID (5 digits)
      const gdnId = cantonId && municipalityId ?
        String(cantonId).padStart(2, '0') + String(municipalityId).padStart(5, '0') : '';

      const municipalityData = {
        cantonId: cantonId || '',
        cantonAbbreviation: cantonAbbreviation,
        municipalityId: municipalityId,
        municipalityLongName: getElementText(municipality, 'municipalityLongName'),
        gdnId: gdnId,
       };

      // Validate required fields
      if (!municipalityData.municipalityId || !municipalityData.municipalityLongName ||
          !municipalityData.cantonAbbreviation) {
        console.warn(`Skipping municipality ${i + 1}: missing required fields`);
        continue;
      }

      // Warn if canton ID could not be found
      if (!municipalityData.cantonId) {
        console.warn(`Municipality ${municipalityData.municipalityLongName}: Could not find canton ID for abbreviation '${cantonAbbreviation}'`);
      }

      // Warn if gdnId could not be created
      if (!municipalityData.gdnId) {
        console.warn(`Municipality ${municipalityData.municipalityLongName}: Could not create gdnId (missing canton ID or municipality ID)`);
      }

      // Add to seen set and municipalities array
      seenMunicipalityIds.add(municipalityId);
      municipalities.push(municipalityData);
    } catch (error) {
      console.warn(`Error processing municipality ${i + 1}:`, error.message);
    }
  }

  console.log(`Successfully extracted ${municipalities.length} unique current municipalities`);
  return municipalities;
}

/**
 * Export data to CSV file
 */
function exportToCsv(data, outputPath, dataType) {
  console.log(`Exporting ${dataType} to CSV...`);

  if (data.length === 0) {
    console.warn(`No ${dataType} data to export`);
    return;
  }

  try {
    const csv = Papa.unparse(data, {
      delimiter: ',',
      header: true,
      quotes: true
    });

    fs.writeFileSync(outputPath, csv, 'utf8');
    console.log(`Successfully exported ${data.length} ${dataType} records to: ${outputPath}`);
  } catch (error) {
    throw new Error(`Failed to export ${dataType} to CSV: ${error.message}`);
  }
}

/**
 * Main conversion function
 */
function convertXmlToCsv() {
  try {
    // Parse XML
    const xmlDoc = parseXmlFile();

    // Extract canton data first
    const cantons = extractCantonData(xmlDoc);

    // Create canton mapping from abbreviation to ID
    console.log('Creating canton mapping...');
    const cantonMapping = new Map();
    cantons.forEach(canton => {
      cantonMapping.set(canton.cantonAbbreviation, canton.cantonId);
    });
    console.log(`Created mapping for ${cantonMapping.size} cantons`);

    // Extract municipality data with canton mapping
    const municipalities = extractMunicipalityData(xmlDoc, cantonMapping);

    // Export to CSV
    exportToCsv(cantons, cantonsOutputPath, 'cantons');
    exportToCsv(municipalities, municipalitiesOutputPath, 'municipalities');

    console.log('XML to CSV conversion completed successfully!');
    console.log(`Output files:`);
    console.log(`  - Cantons: ${cantonsOutputPath}`);
    console.log(`  - Municipalities: ${municipalitiesOutputPath}`);

  } catch (error) {
    console.error('ERROR: XML to CSV conversion failed:', error.message);
    process.exit(1);
  }
}

// Execute the conversion
convertXmlToCsv();
