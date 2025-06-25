/**
 * Optimization Constants
 * 
 * Constants used throughout the scaling optimization algorithms
 */

export const OPTIMIZATION_CONSTANTS = {
  // R-squared thresholds for different optimization scenarios
  DEFAULT_R_SQUARED_THRESHOLD: 0.7,
  SINGLE_ENTITY_R_SQUARED_THRESHOLD: 0.1,
  ACCOUNT_CODE_R_SQUARED_THRESHOLD: 0.1,
  
  // Scaling and variance thresholds
  SCALING_TARGET_VALUE: 100000,
  VARIANCE_FACTOR_THRESHOLD: 0.8,
  COEFFICIENT_OF_VARIATION_THRESHOLD: 0.01,
  IMPROVEMENT_THRESHOLD_PERCENT: 0.01, // 1%
  
  // Algorithm parameters
  MAX_OPTIMIZATION_ITERATIONS: 1000,
  DEFAULT_VARIANCE_WEIGHT: 1.0,
  
  // UI and performance settings
  DEBOUNCE_DELAY_MS: 300,
  LONG_OPERATION_TIMEOUT_MS: 30000,
  
  // Data loading and caching
  CACHE_EXPIRY_MS: 300000, // 5 minutes
  
  // Statistical analysis
  MIN_ENTITY_COUNT_FOR_OPTIMIZATION: 3,
  MAX_COEFFICIENT_VALUE: 1000000,
  
  // Display and formatting
  SIGNIFICANT_DIGITS: 6,
  PERCENTAGE_THRESHOLD_FOR_DISPLAY: 80,
} as const

export type OptimizationConstant = keyof typeof OPTIMIZATION_CONSTANTS