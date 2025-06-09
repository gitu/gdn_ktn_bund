/**
 * Example usage of the StatsDataLoader utility
 *
 * This file demonstrates how to use the StatsDataLoader to:
 * - Load available statistics
 * - Get canton and municipality data
 * - Aggregate data for federal level
 * - Perform comparisons and analysis
 */

import {
  StatsDataLoader,
  getAvailableStatistics,
  getCantonPopulation,
  getMunicipalityPopulation,
  getSwissPopulation,
} from '../utils/StatsDataLoader'

/**
 * Example: Basic usage with convenience functions
 */
export async function exampleBasicUsage() {
  console.log('\n=== Basic Stats Usage ===')

  try {
    // Get available statistics
    const availableStats = await getAvailableStatistics()
    console.log(
      'Available statistics:',
      availableStats.map((s) => s.id),
    )

    // Quick population access
    const zurichPop = await getCantonPopulation('1', 2023) // Canton Zurich
    console.log(`Zurich canton population (2023): ${zurichPop?.toLocaleString()}`)

    const zurichCityPop = await getMunicipalityPopulation('261', 2023) // Zurich city
    console.log(`Zurich city population (2023): ${zurichCityPop?.toLocaleString()}`)

    const swissPop = await getSwissPopulation(2023)
    console.log(`Total Swiss population (2023): ${swissPop?.toLocaleString()}`)
  } catch (error) {
    console.error('Error in basic usage:', error)
  }
}

/**
 * Example: Advanced usage with StatsDataLoader class
 */
export async function exampleAdvancedUsage() {
  console.log('\n=== Advanced Stats Usage ===')

  try {
    const loader = StatsDataLoader.getInstance()

    // Load canton data with filters
    const largeCantons = await loader.loadKtnData('pop', 2023, {
      minValue: 500000, // Only cantons with > 500k population
    })

    console.log('Large cantons (>500k population):')
    largeCantons.data.forEach((canton) => {
      console.log(`  ${canton.key}: ${canton.value.toLocaleString()}`)
    })

    // Get top 5 most populous cantons
    const topCantons = await loader.getTopEntities('pop', 2023, 'ktn', 5)
    console.log('\nTop 5 most populous cantons:')
    topCantons.forEach((canton, index) => {
      console.log(`  ${index + 1}. ${canton.key}: ${canton.value.toLocaleString()}`)
    })

    // Search municipalities by name
    const zurichMunicipalities = await loader.searchMunicipalities('pop', 2023, 'Zürich')
    console.log(`\nMunicipalities with "Zürich" in name: ${zurichMunicipalities.length}`)
    zurichMunicipalities.forEach((municipality) => {
      console.log(`  ${municipality.key}: ${municipality.value.toLocaleString()}`)
    })
  } catch (error) {
    console.error('Error in advanced usage:', error)
  }
}

/**
 * Example: Statistical analysis
 */
export async function exampleStatisticalAnalysis() {
  console.log('\n=== Statistical Analysis ===')

  try {
    const loader = StatsDataLoader.getInstance()

    // Get statistical summary for canton populations
    const cantonSummary = await loader.getStatsSummary('pop', 2023, 'ktn')
    console.log('Canton population statistics:')
    console.log(`  Total: ${cantonSummary.total.toLocaleString()}`)
    console.log(`  Average: ${Math.round(cantonSummary.average).toLocaleString()}`)
    console.log(`  Median: ${Math.round(cantonSummary.median).toLocaleString()}`)
    console.log(
      `  Largest: ${cantonSummary.max.entity} (${cantonSummary.max.value.toLocaleString()})`,
    )
    console.log(
      `  Smallest: ${cantonSummary.min.entity} (${cantonSummary.min.value.toLocaleString()})`,
    )
    console.log(
      `  Standard deviation: ${Math.round(cantonSummary.standardDeviation).toLocaleString()}`,
    )

    // Get statistical summary for municipality populations
    const municipalitySummary = await loader.getStatsSummary('pop', 2023, 'gdn')
    console.log('\nMunicipality population statistics:')
    console.log(`  Total municipalities: ${municipalitySummary.count}`)
    console.log(`  Average: ${Math.round(municipalitySummary.average).toLocaleString()}`)
    console.log(`  Median: ${Math.round(municipalitySummary.median).toLocaleString()}`)
    console.log(
      `  Largest: ${municipalitySummary.max.entity} (${municipalitySummary.max.value.toLocaleString()})`,
    )
    console.log(
      `  Smallest: ${municipalitySummary.min.entity} (${municipalitySummary.min.value.toLocaleString()})`,
    )
  } catch (error) {
    console.error('Error in statistical analysis:', error)
  }
}

/**
 * Example: Year-over-year comparison (if multiple years available)
 */
export async function exampleYearComparison() {
  console.log('\n=== Year-over-Year Comparison ===')

  try {
    const loader = StatsDataLoader.getInstance()

    // Get available years for population data
    const availableYears = await loader.getAvailableYears('pop')
    console.log('Available years for population data:')
    console.log(`  Canton data: ${availableYears.ktn.join(', ')}`)
    console.log(`  Municipality data: ${availableYears.gdn.join(', ')}`)

    // If we have multiple years, compare them
    if (availableYears.ktn.length >= 2) {
      const years = availableYears.ktn.sort((a, b) => b - a) // Sort descending
      const comparison = await loader.compareYears('pop', years[1], years[0], 'ktn')

      console.log(`\nPopulation changes from ${years[1]} to ${years[0]}:`)
      console.log('Top 5 fastest growing cantons:')
      comparison.changes
        .filter((change) => change.percentageChange > 0)
        .slice(0, 5)
        .forEach((change) => {
          console.log(
            `  ${change.geoName}: +${change.percentageChange.toFixed(2)}% (+${change.absoluteChange.toLocaleString()})`,
          )
        })

      console.log('Top 5 fastest declining cantons:')
      comparison.changes
        .filter((change) => change.percentageChange < 0)
        .slice(0, 5)
        .forEach((change) => {
          console.log(
            `  ${change.geoName}: ${change.percentageChange.toFixed(2)}% (${change.absoluteChange.toLocaleString()})`,
          )
        })
    } else {
      console.log('Only one year of data available, cannot perform comparison.')
    }
  } catch (error) {
    console.error('Error in year comparison:', error)
  }
}

/**
 * Example: Working with specific entities
 */
export async function exampleSpecificEntities() {
  console.log('\n=== Specific Entity Examples ===')

  try {
    const loader = StatsDataLoader.getInstance()

    // Get data for specific cantons
    const zurichData = await loader.getCantonData('pop', 2023, '1') // Zurich
    const bernData = await loader.getCantonData('pop', 2023, '2') // Bern
    const vaudData = await loader.getCantonData('pop', 2023, '22') // Vaud

    console.log('Major canton populations:')
    if (zurichData) console.log(`  Zurich: ${zurichData.value.toLocaleString()}`)
    if (bernData) console.log(`  Bern: ${bernData.value.toLocaleString()}`)
    if (vaudData) console.log(`  Vaud: ${vaudData.value.toLocaleString()}`)

    // Get data for specific municipalities
    const zurichCityData = await loader.getMunicipalityData('pop', 2023, '261') // Zurich city
    const baselCityData = await loader.getMunicipalityData('pop', 2023, '2701') // Basel city
    const genevaData = await loader.getMunicipalityData('pop', 2023, '6621') // Geneva

    console.log('\nMajor city populations:')
    if (zurichCityData) console.log(`  Zurich: ${zurichCityData.value.toLocaleString()}`)
    if (baselCityData) console.log(`  Basel: ${baselCityData.value.toLocaleString()}`)
    if (genevaData) console.log(`  Geneva: ${genevaData.value.toLocaleString()}`)
  } catch (error) {
    console.error('Error in specific entities example:', error)
  }
}

/**
 * Example: Error handling
 */
export async function exampleErrorHandling() {
  console.log('\n=== Error Handling Examples ===')

  const loader = StatsDataLoader.getInstance()

  // Test with non-existent statistic
  try {
    await loader.loadKtnData('nonexistent', 2023)
  } catch (error) {
    console.log(
      'Expected error for non-existent statistic:',
      error instanceof Error ? error.message : String(error),
    )
  }

  // Test with non-existent year
  try {
    await loader.loadKtnData('pop', 1900)
  } catch (error) {
    console.log(
      'Expected error for non-existent year:',
      error instanceof Error ? error.message : String(error),
    )
  }

  // Test with non-existent entity
  const nonExistentEntity = await loader.getCantonData('pop', 2023, '999')
  console.log('Non-existent entity result:', nonExistentEntity) // Should be null
}

/**
 * Run all examples
 */
export async function runAllStatsExamples() {
  try {
    console.log('=== StatsDataLoader Examples ===')

    await exampleBasicUsage()
    await exampleAdvancedUsage()
    await exampleStatisticalAnalysis()
    await exampleYearComparison()
    await exampleSpecificEntities()
    await exampleErrorHandling()

    console.log('\n=== All stats examples completed successfully! ===')
  } catch (error) {
    console.error('Error running stats examples:', error)
  }
}

// Uncomment the line below to run examples when this file is executed directly
// runAllStatsExamples();
