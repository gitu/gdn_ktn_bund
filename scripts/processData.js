import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

console.log('Starting data processing...');

// Paths to the input CSV files
const gdnInputFilePath = path.resolve('data/gdn_ab_5000.csv');
const stdInputFilePath = path.resolve('data/standardauswertung.csv');

// Base directories for output files
const gdnOutputBaseDir = path.resolve('src/data/gdn');
const stdOutputBaseDir = path.resolve('src/data/std');

// Paths for the info JSON files
const gdnInfoPath = path.resolve('src/data/gdn-info.json');
const stdInfoPath = path.resolve('src/data/std-info.json');

// Ensure the base output directories exist
if (!fs.existsSync(gdnOutputBaseDir)) {
  fs.mkdirSync(gdnOutputBaseDir, { recursive: true });
}

if (!fs.existsSync(stdOutputBaseDir)) {
  fs.mkdirSync(stdOutputBaseDir, { recursive: true });
}

// Process GDN data
function processGdnData() {
  console.log('Processing GDN data...');

  // Read and parse the CSV file
  const csvFile = fs.readFileSync(gdnInputFilePath, 'utf8');
  const { data } = Papa.parse(csvFile, {
    header: true,
    delimiter: ';',
    quoteChar: '"',
  });

  // Group data by nr and jahr
  const groupedByNrAndJahr = new Map();
  // Track distinct nr & gemeinde combinations
  const gdnInfoMap = new Map();

  // Process each record
  data.forEach((record) => {
    if (!record.nr || !record.jahr) return; // Skip records with missing nr or jahr

    // Skip records with year before 2015
    if (record.jahr < 2015) return;

    // Group by nr
    if (!groupedByNrAndJahr.has(record.nr)) {
      groupedByNrAndJahr.set(record.nr, new Map());
    }

    // Group by jahr within nr
    const jahrMap = groupedByNrAndJahr.get(record.nr);
    if (!jahrMap.has(record.jahr)) {
      jahrMap.set(record.jahr, []);
    }

    // Add record to the appropriate group
    jahrMap.get(record.jahr).push(record);

    // Track distinct nr & gemeinde combinations for gdn-info.json
    if (!gdnInfoMap.has(record.nr)) {
      gdnInfoMap.set(record.nr, {
        nr: record.nr,
        gemeinde: record.gemeinde,
        jahre: []
      });
    }

    // Add jahr to the list if not already present
    const gdnInfo = gdnInfoMap.get(record.nr);
    if (!gdnInfo.jahre.includes(record.jahr)) {
      gdnInfo.jahre.push(record.jahr);
    }
  });

  // Create output directories and files
  groupedByNrAndJahr.forEach((jahrMap, nr) => {
    // Create directory for this nr
    const nrDir = path.join(gdnOutputBaseDir, nr);
    if (!fs.existsSync(nrDir)) {
      fs.mkdirSync(nrDir, { recursive: true });
    }

    // Create a file for each jahr
    jahrMap.forEach((records, jahr) => {
      const outputFilePath = path.join(nrDir, `${jahr}.csv`);

      // Convert records back to CSV
      const csv = Papa.unparse(records, {
        delimiter: ';',
        header: true,
        quotes: true
      });

      // Write to file
      fs.writeFileSync(outputFilePath, csv);
      console.log(`Created file: ${outputFilePath}`);
    });
  });

  // Sort the gdnInfo array by nr
  const gdnInfoArray = Array.from(gdnInfoMap.values()).map(info => ({
    ...info,
    jahre: info.jahre.sort() // Sort jahre array
  })).sort((a, b) => a.nr.localeCompare(b.nr));

  // Write the gdn-info.json file
  fs.writeFileSync(gdnInfoPath, JSON.stringify(gdnInfoArray, null, 2));
  console.log(`Created file: ${gdnInfoPath}`);
}

// Process standardauswertung data
function processStdData() {
  console.log('Processing standardauswertung data...');

  // Check if the input file exists
  if (!fs.existsSync(stdInputFilePath)) {
    console.error(`ERROR: Input file does not exist: ${stdInputFilePath}`);
    return;
  }

  let data;

  // Read and parse the CSV file
  try {
    const csvFile = fs.readFileSync(stdInputFilePath, 'utf8');
    console.log(`Successfully read file: ${stdInputFilePath}`);

    const parseResult = Papa.parse(csvFile, {
      header: true,
      delimiter: ',',  // The file uses comma as delimiter
      quoteChar: '"',
    });

    data = parseResult.data;
  } catch (error) {
    console.error(`Error reading or parsing file ${stdInputFilePath}:`, error);
    return;
  }

  // Group data by model, hh, and jahr
  const groupedByModelHhJahr = new Map();
  // Track distinct hh & model combinations with their jahre
  const stdInfoMap = new Map();

  // Process each record
  console.log(`Found ${data.length} records in standardauswertung.csv`);

  // Log a few sample records to see their structure
  if (data.length > 0) {
    console.log(`Sample record 1:`, JSON.stringify(data[0]));
  }
  if (data.length > 1) {
    console.log(`Sample record 2:`, JSON.stringify(data[1]));
  }

  let skippedCount = 0;
  let processedCount = 0;

  data.forEach((record) => {
    // Log the record properties to debug
    if (processedCount < 2) {
      console.log(`Record ${processedCount} properties:`, Object.keys(record));
      console.log(`Record ${processedCount} model:`, record.model);
      console.log(`Record ${processedCount} hh:`, record.hh);
      console.log(`Record ${processedCount} jahr:`, record.jahr);
    }

    if (!record.model || !record.hh || !record.jahr) {
      skippedCount++;
      return; // Skip records with missing model, hh, or jahr
    }

    // skip records with year before 2015
    if (record.jahr < 2015) {
      skippedCount++;
      return;
    }

    processedCount++;

    // Group by model
    if (!groupedByModelHhJahr.has(record.model)) {
      groupedByModelHhJahr.set(record.model, new Map());
    }

    // Group by hh within model
    const hhMap = groupedByModelHhJahr.get(record.model);
    if (!hhMap.has(record.hh)) {
      hhMap.set(record.hh, new Map());
    }

    // Group by jahr within hh
    const jahrMap = hhMap.get(record.hh);
    if (!jahrMap.has(record.jahr)) {
      jahrMap.set(record.jahr, []);
    }

    // Add record to the appropriate group
    jahrMap.get(record.jahr).push(record);

    // Track distinct hh & model combinations for std-info.json
    if (!stdInfoMap.has(record.hh)) {
      stdInfoMap.set(record.hh, {
        hh: record.hh,
        models: new Map()
      });
    }

    const hhInfo = stdInfoMap.get(record.hh);
    if (!hhInfo.models.has(record.model)) {
      hhInfo.models.set(record.model, {
        model: record.model,
        jahre: []
      });
    }

    // Add jahr to the list if not already present
    const modelInfo = hhInfo.models.get(record.model);
    if (!modelInfo.jahre.includes(record.jahr)) {
      modelInfo.jahre.push(record.jahr);
    }
  });

  console.log(`Skipped ${skippedCount} records due to missing model, hh, or jahr`);
  console.log(`Processed ${processedCount} records`);

  // Log the contents of groupedByModelHhJahr
  console.log(`Models found:`, Array.from(groupedByModelHhJahr.keys()));

  // Create output directories and files
  groupedByModelHhJahr.forEach((hhMap, model) => {
    hhMap.forEach((jahrMap, hh) => {
      // Create directory structure for this model/hh
      const modelHhDir = path.join(stdOutputBaseDir, model, hh);
      if (!fs.existsSync(modelHhDir)) {
        fs.mkdirSync(modelHhDir, { recursive: true });
      }

      // Create a file for each jahr
      jahrMap.forEach((records, jahr) => {
        const outputFilePath = path.join(modelHhDir, `${jahr}.csv`);

        // Convert records back to CSV
        const csv = Papa.unparse(records, {
          delimiter: ',',  // Keep the same delimiter as the input file
          header: true,
          quotes: true
        });

        // Write to file
        fs.writeFileSync(outputFilePath, csv);
        console.log(`Created file: ${outputFilePath}`);
      });
    });
  });

  // Log the contents of stdInfoMap
  console.log(`HH values found:`, Array.from(stdInfoMap.keys()));

  // Prepare the stdInfo array with the required format
  // Format: { "hh": "ktn", "models": [{"model":"gfs", "jahre": ["1990", .... ,"2024"] }, ... ]}
  const stdInfoArray = Array.from(stdInfoMap.values()).map(info => {
    console.log(`Processing hh: ${info.hh}, models:`, Array.from(info.models.keys()));
    return {
      hh: info.hh,
      models: Array.from(info.models.values()).map(modelInfo => ({
        model: modelInfo.model,
        jahre: modelInfo.jahre.sort() // Sort jahre array
      }))
    };
  }).sort((a, b) => a.hh.localeCompare(b.hh));

  console.log(`Generated ${stdInfoArray.length} entries for std-info.json`);
  if (stdInfoArray.length > 0) {
    console.log(`Sample entry:`, stdInfoArray[0]);
  }

  // Ensure the directory exists
  const stdInfoDir = path.dirname(stdInfoPath);
  if (!fs.existsSync(stdInfoDir)) {
    console.log(`Creating directory: ${stdInfoDir}`);
    fs.mkdirSync(stdInfoDir, { recursive: true });
  }

  // Write the std-info.json file
  try {
    console.log(`Writing to file: ${stdInfoPath}`);
    console.log(`Data to write:`, JSON.stringify(stdInfoArray));

    fs.writeFileSync(stdInfoPath, JSON.stringify(stdInfoArray, null, 2));
    console.log(`Created file: ${stdInfoPath}`);

    // Verify the file was created
    if (fs.existsSync(stdInfoPath)) {
      console.log(`Verified file exists: ${stdInfoPath}`);

      // Read the file back to verify its contents
      const fileContents = fs.readFileSync(stdInfoPath, 'utf8');
      console.log(`File contents length: ${fileContents.length}`);
    } else {
      console.log(`ERROR: File was not created: ${stdInfoPath}`);
    }
  } catch (error) {
    console.error(`Error writing file ${stdInfoPath}:`, error);
  }
}

// Execute both processing functions
processGdnData();
processStdData();

console.log('Processing complete!');
