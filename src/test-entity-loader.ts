// Test script for EntityLoader - can be imported in browser console
import { loadAllEntityOptions, loadGdnInfo, loadStdInfo, transformGdnToEntityOptions, transformStdToEntityOptions } from './utils/EntityLoader'

export async function testEntityLoader() {
  console.log('🧪 Testing EntityLoader...')
  
  try {
    // Test 1: Load GDN info
    console.log('1️⃣ Testing GDN info loading...')
    const gdnInfo = await loadGdnInfo()
    console.log(`✅ GDN info loaded: ${gdnInfo.length} entries`)
    console.log('Sample GDN entry:', gdnInfo[0])
    
    // Test 2: Load STD info  
    console.log('2️⃣ Testing STD info loading...')
    const stdInfo = await loadStdInfo()
    console.log(`✅ STD info loaded: ${stdInfo.length} entries`)
    console.log('Sample STD entry:', stdInfo[0])
    
    // Test 3: Transform GDN to entity options
    console.log('3️⃣ Testing GDN transformation...')
    const gdnOptions = transformGdnToEntityOptions(gdnInfo.slice(0, 5)) // Test with first 5
    console.log(`✅ GDN options created: ${gdnOptions.length} entries`)
    console.log('Sample GDN option:', gdnOptions[0])
    
    // Test 4: Transform STD to entity options
    console.log('4️⃣ Testing STD transformation...')
    const stdOptions = transformStdToEntityOptions(stdInfo.slice(0, 5)) // Test with first 5
    console.log(`✅ STD options created: ${stdOptions.length} entries`)
    console.log('Sample STD option:', stdOptions[0])
    
    // Test 5: Load all entity options
    console.log('5️⃣ Testing complete entity options loading...')
    const allOptions = await loadAllEntityOptions()
    console.log(`✅ All entity options loaded: ${allOptions.length} entries`)
    
    // Show breakdown by type
    const gdnCount = allOptions.filter(opt => opt.type === 'GDN').length
    const stdCount = allOptions.filter(opt => opt.type === 'STD').length
    console.log(`📊 Breakdown: ${gdnCount} GDN entities, ${stdCount} STD entities`)
    
    // Show sample entities
    console.log('🔍 Sample entities:')
    allOptions.slice(0, 10).forEach((entity, index) => {
      console.log(`  ${index + 1}. ${entity.name} (${entity.type}) - ${entity.availableYears.length} years`)
    })
    
    console.log('🎉 All tests passed!')
    return {
      gdnInfo,
      stdInfo,
      gdnOptions,
      stdOptions,
      allOptions
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Auto-run test when module is imported
console.log('EntityLoader test module loaded. Run testEntityLoader() to test.')
