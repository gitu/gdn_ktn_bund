import { type RecordType } from '../types';

// This will be populated by the build process with all available municipalities
const availableMunicipalities: string[] = [
  'Aarau',
  'Zürich',
  'Bern',
  // Add more municipalities as needed
];

// This will be populated by the build process with all available years
const availableYears: string[] = [
  '2008',
  '2009',
  '2010',
  // Add more years as needed
];

// Import all municipality data files
// In a real implementation, these would be dynamically imported based on the build process
// For now, we'll use a simple mapping
const municipalityData: Record<string, RecordType[]> = {
  // This is a placeholder. In reality, these would be actual imports of the split CSV files
  'Aarau': [],
  'Zürich': [],
  'Bern': [],
};

// Import all year-municipality data files
// In a real implementation, these would be dynamically imported based on the build process
const yearMunicipalityData: Record<string, Record<string, RecordType[]>> = {
  // This is a placeholder. In reality, these would be actual imports of the split CSV files
  '2008': {
    'Aarau': [],
    'Zürich': [],
    'Bern': [],
  },
  '2009': {
    'Aarau': [],
    'Zürich': [],
    'Bern': [],
  },
  '2010': {
    'Aarau': [],
    'Zürich': [],
    'Bern': [],
  },
};

// Get the latest year available
export function getLatestYear(): string {
  return availableYears.sort().reverse()[0];
}

// Get all available municipalities
export function getAvailableMunicipalities(): string[] {
  return availableMunicipalities;
}

// Get all available years
export function getAvailableYears(): string[] {
  return availableYears;
}

// Get data for a specific municipality (latest year)
export function getMunicipalityData(municipality: string): RecordType[] {
  return municipalityData[municipality] || [];
}

// Get data for a specific municipality and year
export function getMunicipalityDataForYear(municipality: string, year: string): RecordType[] {
  return yearMunicipalityData[year]?.[municipality] || [];
}

// Get all data for the latest year
export function getAllDataForLatestYear(): RecordType[] {
  const latestYear = getLatestYear();
  return Object.values(yearMunicipalityData[latestYear] || {}).flat();
}

// Get all data for a specific year
export function getAllDataForYear(year: string): RecordType[] {
  return Object.values(yearMunicipalityData[year] || {}).flat();
}

// In a real implementation, we would use Vite's import.meta.glob to dynamically import all CSV files
// For example:
// const municipalityFiles = import.meta.glob('../data/split/gemeinde/*.csv', { eager: true });
// const yearMunicipalityFiles = import.meta.glob('../data/split/jahr_gemeinde/**/*.csv', { eager: true });
