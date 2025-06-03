/**
 * Example usage of TreeAggregator utility
 *
 * This file demonstrates how to use the TreeAggregator to calculate
 * aggregated data from tree structures and CSV data.
 */

import { TreeAggregator, aggregateGdnData, aggregateStdData } from './TreeAggregator';
import type { GdnDataRecord, StdDataRecord } from '../types/DataStructures';

/**
 * Example: Aggregating GDN (municipality) data
 */
export async function exampleGdnAggregation() {
  // Sample GDN data (normally loaded from CSV files)
  const gdnData: GdnDataRecord[] = [
    {
      jahr: '2023',
      nr: '001',
      gemeinde: 'Example Municipality',
      konto: '300', // Personnel expenses - authorities
      betrag: '150000'
    },
    {
      jahr: '2023',
      nr: '001',
      gemeinde: 'Example Municipality',
      konto: '301', // Personnel expenses - administrative staff
      betrag: '250000'
    },
    {
      jahr: '2023',
      nr: '001',
      gemeinde: 'Example Municipality',
      konto: '31', // General operating expenses
      betrag: '75000'
    }
  ];

  try {
    // Aggregate the data using the aufwand (expenses) tree structure
    const result = await aggregateGdnData(
      gdnData,
      'aufwand', // dimension
      '001', // entity ID
      '2023' // year
    );

    console.log('GDN Aggregation Result:');
    console.log('Total records processed:', result.metadata.totalRecords);
    console.log('Aggregated data points:', result.aggregatedData.length);

    // Display aggregated values
    result.aggregatedData.forEach(item => {
      console.log(`${item.code} (${item.label}): CHF ${item.value.toLocaleString()}`);
    });

    return result;
  } catch (error) {
    console.error('Error aggregating GDN data:', error);
    throw error;
  }
}

/**
 * Example: Aggregating STD (standardized) data
 */
export async function exampleStdAggregation() {
  // Sample STD data (normally loaded from CSV files)
  const stdData: StdDataRecord[] = [
    {
      arten: '300',
      funk: '',
      jahr: '2023',
      value: '150000',
      dim: 'aufwand',
      hh: 'ktn_example',
      unit: 'CHF',
      model: 'fs'
    },
    {
      arten: '301',
      funk: '',
      jahr: '2023',
      value: '250000',
      dim: 'aufwand',
      hh: 'ktn_example',
      unit: 'CHF',
      model: 'fs'
    },
    {
      arten: '31',
      funk: '',
      jahr: '2023',
      value: '75000',
      dim: 'aufwand',
      hh: 'ktn_example',
      unit: 'CHF',
      model: 'fs'
    }
  ];

  try {
    // Aggregate the data using the aufwand-fs tree structure
    const result = await aggregateStdData(
      stdData,
      'aufwand', // dimension
      'ktn_example', // entity ID
      '2023', // year
      undefined, // config
      'fs' // model
    );

    console.log('STD Aggregation Result:');
    console.log('Total records processed:', result.metadata.totalRecords);
    console.log('Model:', result.metadata.model);
    console.log('Aggregated data points:', result.aggregatedData.length);

    // Display aggregated values
    result.aggregatedData.forEach(item => {
      console.log(`${item.code} (${item.label}): CHF ${item.value.toLocaleString()}`);
    });

    return result;
  } catch (error) {
    console.error('Error aggregating STD data:', error);
    throw error;
  }
}

/**
 * Example: Using TreeAggregator with custom configuration
 */
export async function exampleCustomConfiguration() {
  const aggregator = new TreeAggregator({
    baseUrl: '/data', // Custom base URL for tree files
    language: 'fr', // Use French labels
    includeZeroValues: true, // Include nodes with zero values
    maxDepth: 3 // Limit tree depth
  });

  // Sample data
  const gdnData: GdnDataRecord[] = [
    {
      jahr: '2023',
      nr: '002',
      gemeinde: 'Autre Commune',
      konto: '300',
      betrag: '100000'
    }
  ];

  try {
    const result = await aggregator.aggregateGdnData(
      gdnData,
      'aufwand',
      '002',
      '2023'
    );

    console.log('Custom Configuration Result:');
    console.log('Language used: French');
    console.log('Include zero values: true');

    // Display with French labels
    result.aggregatedData.forEach(item => {
      console.log(`${item.code} (${item.label}): CHF ${item.value.toLocaleString()}`);
    });

    // Clear cache when done
    aggregator.clearCache();

    return result;
  } catch (error) {
    console.error('Error with custom configuration:', error);
    throw error;
  }
}

/**
 * Example: Error handling and validation
 */
export async function exampleErrorHandling() {
  try {
    // Try to aggregate with invalid dimension
    await aggregateGdnData(
      [],
      'nonexistent_dimension',
      'test',
      '2023'
    );
  } catch (error) {
    console.log('Expected error for invalid dimension:', error instanceof Error ? error.message : String(error));
  }

  try {
    // Try with malformed data
    const malformedData = [
      {
        jahr: '2023',
        nr: '001',
        gemeinde: 'Test',
        konto: '300',
        betrag: 'invalid_amount' // This will be skipped
      },
      {
        jahr: '2023',
        nr: '001',
        gemeinde: 'Test',
        konto: '301',
        betrag: '100000' // This will be processed
      }
    ] as GdnDataRecord[];

    const result = await aggregateGdnData(
      malformedData,
      'aufwand',
      '001',
      '2023'
    );

    console.log('Result with malformed data:');
    console.log('Records processed:', result.metadata.totalRecords); // Should be 1
    console.log('Errors encountered:', result.errors?.length || 0);

    if (result.errors) {
      result.errors.forEach(error => console.log('Error:', error));
    }

    return result;
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
}

/**
 * Example: Getting available tree structures
 */
export async function exampleAvailableTreeStructures() {
  const aggregator = new TreeAggregator();

  try {
    const availableStructures = await aggregator.getAvailableTreeStructures();

    console.log('Available tree structures:');
    availableStructures.forEach(structure => {
      console.log(`- ${structure}`);
    });

    return availableStructures;
  } catch (error) {
    console.error('Error getting available tree structures:', error);
    return [];
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== TreeAggregator Examples ===\n');

  try {
    console.log('1. GDN Data Aggregation:');
    await exampleGdnAggregation();
    console.log('\n');

    console.log('2. STD Data Aggregation:');
    await exampleStdAggregation();
    console.log('\n');

    console.log('3. Custom Configuration:');
    await exampleCustomConfiguration();
    console.log('\n');

    console.log('4. Error Handling:');
    await exampleErrorHandling();
    console.log('\n');

    console.log('5. Available Tree Structures:');
    await exampleAvailableTreeStructures();
    console.log('\n');

    console.log('=== All examples completed successfully ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other modules
export default {
  exampleGdnAggregation,
  exampleStdAggregation,
  exampleCustomConfiguration,
  exampleErrorHandling,
  exampleAvailableTreeStructures,
  runAllExamples
};
