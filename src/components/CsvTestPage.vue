<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>CSV Loading Test Page</v-card-title>
          <v-card-subtitle>
            This page tests the updated CSV loading functionality with the correct directory structure
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- DataLoader Test Component -->
    <v-row>
      <v-col cols="12">
        <DataLoaderTest />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Test Standard Financial Data (ktn_zh)</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedYear"
              :items="['2020', '2021']"
              label="Year"
              variant="outlined"
              density="compact"
            ></v-select>
            <EnrichedDataDisplay
              entity-id="ktn_zh"
              :year="selectedYear"
              language="de"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Test GDN Data (gdn_010176)</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedGdnYear"
              :items="['2020', '2021']"
              label="Year"
              variant="outlined"
              density="compact"
            ></v-select>
            <EnrichedDataDisplay
              entity-id="gdn_010176"
              :year="selectedGdnYear"
              language="de"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EnrichedDataDisplay from './EnrichedDataDisplay.vue'
import { loadEntityData, constructDataPath, checkDataExists } from '../utils/DataLoader'

const selectedYear = ref('2020')
const selectedGdnYear = ref('2020')

// Test the DataLoader on component mount
onMounted(async () => {
  console.log('🧪 Testing DataLoader functionality...')

  try {
    // Test path construction
    const gdnPath = constructDataPath('010176', '2020')
    const stdPath = constructDataPath('ktn_zh', '2020')
    console.log('✅ Path construction:', { gdnPath, stdPath })

    // Test file existence
    const gdnExists = await checkDataExists('010176', '2020')
    const stdExists = await checkDataExists('ktn_zh', '2020')
    console.log('✅ File existence:', { gdnExists, stdExists })

    // Test data loading
    if (gdnExists) {
      const gdnData = await loadEntityData('010176', '2020')
      console.log(`✅ Loaded ${gdnData.length} GDN records`)
    }

    if (stdExists) {
      const stdData = await loadEntityData('ktn_zh', '2020')
      console.log(`✅ Loaded ${stdData.length} STD records`)
    }

    console.log('🎉 DataLoader tests completed successfully!')

  } catch (error) {
    console.error('❌ DataLoader test failed:', error)
  }
})
</script>
