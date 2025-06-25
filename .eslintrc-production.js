/**
 * ESLint configuration for production code quality
 * This extends the main config with stricter rules for production builds
 */

module.exports = {
  extends: ['./.eslintrc.cjs'],
  rules: {
    // Prevent console statements in production code (except console.error for critical issues)
    'no-console': ['error', { allow: ['error'] }],
    
    // Prevent debugger statements
    'no-debugger': 'error',
    
    // Prevent TODO/FIXME comments in production
    'no-warning-comments': ['warn', { 
      terms: ['todo', 'fixme', 'hack'], 
      location: 'start' 
    }],
    
    // Require proper error handling
    'prefer-promise-reject-errors': 'error',
    
    // Performance rules
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
  },
  
  overrides: [
    {
      // Allow console in test files
      files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Allow console in development utilities
      files: ['scripts/**/*', 'vite.config.ts', '*.config.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
}