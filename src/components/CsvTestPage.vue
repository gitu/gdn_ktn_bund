<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>CSV Loading Test Page</h1>
        <p>This page tests the CSV loading functionality for the EnrichedDataDisplay component.</p>
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
import { ref } from 'vue'
import EnrichedDataDisplay from './EnrichedDataDisplay.vue'

const selectedYear = ref('2020')
const selectedGdnYear = ref('2020')
</script>
