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
npm run fetch-data   # Download the EFV financial statistics CSVs into data/ (then: npm run split)
npm run fetch-stats  # Rebuild scaling statistics (population by age, jobs, roads) from BFS downloads
npm run build-rest   # Calculate "rest of canton" datasets (after split and fetch-stats)
npm run update-data  # All of the above in the right order: fetch-data, split, fetch-stats, build-rest, build-data
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

### UI Conventions (mobile-first)
- Design tokens live in `src/assets/layout/variables/_tokens.scss` (`--gk-*`, `--gutter`, `--topbar-h`, `--radius-*`); they switch with the `app-dark` class on `<html>`. Use them instead of hard-coded colours. Font is Inter Variable (self-hosted); use `font-variant-numeric: tabular-nums` for numbers.
- Phones are `max-width: 767px` (`PHONE_QUERY` in `src/composables/useMediaQuery.ts`). Under 768px navigation is the bottom bar (`AppBottomNav`), lists are cards instead of tables, touch targets are at least 44px and inputs 16px.
- No horizontal page scroll at 320-430px on any route; `e2e/mobile-layout.spec.ts` enforces it.
- PrimeFlex classes (`flex-column`, `align-items-center`, `surface-50`, `border-round`) do not exist here; use Tailwind 4 utilities or scoped CSS.
- Ready-made comparisons are defined once in `src/data/sampleComparisons.ts` (home page and empty comparison page); a unit test checks they exist in the catalogue.
- Vite may serve stale CSS after editing a Sass partial in `src/assets/layout/`; restart the dev server.
- The comparison page is a wizard (places → years → convert → result) in `src/components/wizard/`; places and years are converted to dataset ids by `src/utils/ComparisonSelection.ts`, the divisors of a scaling or custom formula are calculated by `src/utils/ScalingCalculator.ts` (used by the store and the preview in the convert step).
- Charts live in `src/components/charts/` (HTML/SVG, no chart library). Use the `--gk-series-1..8` tokens in fixed order (colour follows the place or account group, not its rank), `--gk-chart-pos/neg` for surplus/deficit, and give every chart a table twin through `ChartCard`'s `table` prop. Figures for charts come from `src/utils/charts/financialFigures.ts`.
- Numbers are formatted Swiss style (`1'234'567`, the `<lang>-CH` locale) through `src/utils/numberFormat.ts`; amounts in tables and charts go through `useAmountFormat()`, which applies the reader's choice of exact francs, thousands or millions (`AmountUnitSelect`, kept in localStorage `gk-amount-unit`). Don't call `Intl.NumberFormat` with the bare language.
- Design rationale and backlog: `docs/ui-proposal.md`.

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

6. **Pre Commit**: Before every commit run npm run pre-commit and fix *ALL* errors.