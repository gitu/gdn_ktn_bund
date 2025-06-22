# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev          # Start development server at http://localhost:5173
npm run build        # Build for production (includes data generation and type checking)
npm run preview      # Preview production build locally
```

### Testing
```bash
npm run test         # Run all tests (unit + e2e with coverage)
npm run test:unit    # Run unit tests once
npm run test:unit:watch  # Run unit tests in watch mode
npm run test:e2e     # Run end-to-end tests
npm run test:e2e -- --project=chromium  # Run e2e tests on specific browser
npm run test:e2e -- --debug  # Debug e2e tests
npm run test:coverage  # Run unit tests with coverage report
```

### Code Quality
```bash
npm run lint         # Run all linters (OxLint + ESLint)
npm run format       # Format code with Prettier
npm run type-check   # Check TypeScript types
npm run pre-commit   # Full quality check before committing (lint + format + test + build)
```

### Data Processing
```bash
npm run build-data   # Generate available-data.json from public/data
npm run generate-synth  # Generate synthetic canton data
npm run fetch-atlas  # Fetch latest statistical data from Swiss Federal Statistical Office
```

## Architecture Overview

### Application Type
Vue 3 financial data comparison application for Swiss governmental entities (municipalities/cantons/federal), built entirely through AI-human collaboration.

### Core Technologies
- **Frontend**: Vue 3 with Composition API + TypeScript
- **UI**: PrimeVue 4 + Tailwind CSS 4
- **State**: Pinia stores
- **i18n**: Vue I18n (DE/FR/IT/EN)
- **Build**: Vite
- **Testing**: Vitest (unit) + Playwright (e2e)

### Key Architectural Patterns

#### Data Flow
1. **Data Loading**: Specialized loaders in `src/utils/`:
   - `DataLoader.ts` - Financial data from CSV files
   - `StatsDataLoader.ts` - Statistical scaling factors
   - `GeographicalDataLoader.ts` - Geographic boundaries
   - `EntitySemanticMapper.ts` - Human-readable entity names

2. **State Management**: Pinia store (`src/stores/financialData.ts`) manages:
   - Selected entities and years
   - Loaded financial data
   - Scaling factors and transformations
   - Aggregation and filtering state

3. **Component Architecture**:
   - **Views**: Page-level components in `src/views/`
   - **Components**: Reusable UI in `src/components/`
   - **Layout**: App structure in `src/layout/`

#### Data Structure
Financial data organized hierarchically:
- Entity type (`gdn`/`std`)
- Model type (varies by entity)
- Entity ID (BFS numbers)
- Year
- Tree structure with expandable nodes

#### Scaling System
Dynamic scaling based on:
- Population (per capita)
- Area (per hectare)
- Employment (per workplace)
Cached in browser for performance.

### Development Guidelines

#### Component Development
- Use Vue 3 Composition API with `<script setup lang="ts">`
- Prefer PrimeVue components over custom implementations
- Follow existing component patterns (see `DataBrowser.vue` for reference)
- All components must be fully typed with TypeScript

#### State Management
- Use Pinia stores for shared state
- Keep component-specific state local
- Use computed properties for derived state
- Actions should handle loading states and errors

#### Internationalization
- All user-facing text must use i18n
- Translation keys follow dot notation: `section.subsection.key`
- Support all 4 languages (DE/FR/IT/EN)
- Default language is German

#### Testing Requirements
- Unit tests for all utilities and complex logic
- Component tests for user interactions
- E2E tests for critical user flows
- Always add tests when modifying code (per copilot-instructions.md)

#### Code Quality Standards
- Run `npm run pre-commit` before committing
- No direct pushes to main - always use pull requests
- TypeScript strict mode enabled - no `any` types

### File Organization
```
src/
├── components/      # Reusable Vue components
├── views/          # Page-level components
├── stores/         # Pinia state management
├── utils/          # Data loaders and utilities
├── i18n/           # Translations
├── types/          # TypeScript definitions
└── layout/         # App layout components

public/data/        # Static CSV data files
├── gdn/           # Municipal data
├── std/           # Standard/aggregated data
└── stats/         # Statistical scaling data

scripts/           # Node.js data processing
```

### Important Implementation Notes

1. **Data Loading**: Financial data is loaded on-demand from CSV files. The `available-data.json` catalog must be regenerated when adding new data files.

2. **Performance**: Use lazy loading for routes and components. Financial data can be large - implement proper loading states and error handling.

3. **Browser Compatibility**: Target modern browsers with ES2020+ support. The application uses advanced Vue 3 features.

4. **Deployment**: Static site deployed to Cloudflare. Build process includes data generation steps.

5. **AI Development Heritage**: This codebase was developed through AI-human collaboration. Maintain consistency with existing patterns and conventions established throughout the codebase.