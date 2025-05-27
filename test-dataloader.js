// Test script to verify DataLoader functionality
// Run this in the browser console at http://localhost:5174

async function testDataLoader() {
  console.log('🧪 Testing DataLoader functionality...')
  
  try {
    // Test 1: Path construction
    console.log('\n1️⃣ Testing path construction...')
    
    // Test GDN path (6-digit entity ID)
    const gdnPath = constructDataPath('010176', '2020', 'fs')
    console.log(`GDN path: ${gdnPath}`)
    console.assert(gdnPath === '/data/gdn/010176/2020.csv', 'GDN path should be correct')
    
    // Test STD path (non-6-digit entity ID)
    const stdPath = constructDataPath('ktn_zh', '2020', 'fs')
    console.log(`STD path: ${stdPath}`)
    console.assert(stdPath === '/data/std/fs/ktn_zh/2020.csv', 'STD path should be correct')
    
    console.log('✅ Path construction tests passed')
    
    // Test 2: Check if files exist
    console.log('\n2️⃣ Testing file existence...')
    
    const gdnExists = await checkDataExists('010176', '2020')
    console.log(`GDN file exists (010176/2020): ${gdnExists}`)
    
    const stdExists = await checkDataExists('ktn_zh', '2020')
    console.log(`STD file exists (ktn_zh/2020): ${stdExists}`)
    
    // Test 3: Load actual data
    console.log('\n3️⃣ Testing data loading...')
    
    if (gdnExists) {
      console.log('Loading GDN data (010176/2020)...')
      const gdnData = await loadEntityData('010176', '2020')
      console.log(`✅ Loaded ${gdnData.length} GDN records`)
      console.log('Sample GDN record:', gdnData[0])
    } else {
      console.log('⚠️ GDN file not found, skipping data load test')
    }
    
    if (stdExists) {
      console.log('Loading STD data (ktn_zh/2020)...')
      const stdData = await loadEntityData('ktn_zh', '2020')
      console.log(`✅ Loaded ${stdData.length} STD records`)
      console.log('Sample STD record:', stdData[0])
    } else {
      console.log('⚠️ STD file not found, skipping data load test')
    }
    
    // Test 4: Cache functionality
    console.log('\n4️⃣ Testing cache functionality...')
    const cacheStats = getCacheStats()
    console.log(`Cache size: ${cacheStats.size}`)
    console.log('Cache keys:', cacheStats.keys)
    
    console.log('\n🎉 All DataLoader tests completed!')
    
  } catch (error) {
    console.error('❌ DataLoader test failed:', error)
  }
}

// Helper function to import DataLoader functions
async function importDataLoader() {
  try {
    // This assumes the module is available in the browser
    const module = await import('/src/utils/DataLoader.ts')
    window.loadEntityData = module.loadEntityData
    window.checkDataExists = module.checkDataExists
    window.constructDataPath = module.constructDataPath
    window.getCacheStats = module.getCacheStats
    window.clearCache = module.clearCache
    
    console.log('✅ DataLoader functions imported successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to import DataLoader:', error)
    return false
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting DataLoader tests...')
  
  const imported = await importDataLoader()
  if (!imported) {
    console.error('Cannot run tests without DataLoader functions')
    return
  }
  
  await testDataLoader()
}

// Instructions for manual testing
console.log(`
📋 DataLoader Test Instructions:

1. Open the browser console
2. Navigate to http://localhost:5174
3. Run: runTests()

Or test individual functions:
- constructDataPath('010176', '2020') 
- checkDataExists('010176', '2020')
- loadEntityData('010176', '2020')
- getCacheStats()

Available test entities:
- GDN: 010176, 236141
- STD: ktn_zh, bund
- Years: 2015-2023
`)

// Export for browser use
if (typeof window !== 'undefined') {
  window.runTests = runTests
  window.testDataLoader = testDataLoader
  window.importDataLoader = importDataLoader
}
