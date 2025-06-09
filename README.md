# Swiss Financial Data Explorer 🇨🇭

> **🤖 Built Entirely with AI Agents** - This comprehensive financial data comparison application was developed through an innovative collaboration between human guidance and AI agents, showcasing the power of AI-assisted software development.

A modern web application for comparing and analyzing financial statements across different Swiss governmental entities - municipalities (Gemeinden), cantons (Kantone), and federal government (Bund). Built with Vue 3, TypeScript, and PrimeVue, this tool enables users to explore hierarchical financial data with advanced scaling and comparison features.

## 🤖 AI Development Story

### Revolutionary AI-Assisted Development

This entire application represents a groundbreaking example of **AI-driven software development**. Every component, feature, and line of code was crafted through an iterative collaboration between human vision and AI implementation:

**🧠 Human-AI Collaboration Process:**
- **Strategic Direction**: Human provided high-level requirements, user experience goals, and domain expertise about Swiss financial data
- **AI Implementation**: AI agents handled detailed code architecture, component development, testing strategies, and technical implementation
- **Iterative Refinement**: Continuous feedback loops between human insights and AI execution refined features and improved code quality
- **Quality Assurance**: AI agents implemented comprehensive testing suites, linting rules, and build processes

**🚀 AI Agent Capabilities Demonstrated:**
- **Full-Stack Development**: From Vue.js components to data processing scripts
- **Multilingual Implementation**: Complete i18n setup with German, French, Italian, and English translations
- **Complex Data Handling**: CSV parsing, tree structure generation, and financial data aggregation
- **Modern Tooling**: TypeScript integration, Vitest testing, Playwright e2e tests, and ESLint configuration
- **UI/UX Design**: PrimeVue component integration with Tailwind CSS styling

**💡 Key Insights from AI Development:**
- AI agents excel at maintaining consistency across large codebases
- Iterative human feedback dramatically improves AI output quality
- AI can handle complex domain-specific requirements when properly guided
- The combination of human creativity and AI execution accelerates development significantly

### Development Methodology

The project followed an **AI-first development approach**:

1. **Requirements Gathering**: Human defined functional requirements and user stories
2. **Architecture Planning**: AI designed component structure and data flow patterns
3. **Incremental Development**: AI implemented features in small, testable increments
4. **Continuous Testing**: AI wrote and maintained comprehensive test suites
5. **Iterative Improvement**: Human feedback guided AI refinements and optimizations

This methodology resulted in a production-ready application with enterprise-grade code quality, comprehensive testing, and excellent user experience.

## 🎯 Project Overview

### Core Purpose

The Swiss Financial Data Explorer addresses the challenge of comparing financial information across different levels of Swiss government. Traditional financial reports are often siloed by entity type, making cross-governmental analysis difficult. This application provides:

- **Unified Data Access**: Centralized access to financial data from municipalities, cantons, and federal government
- **Meaningful Comparisons**: Advanced scaling options (population, area, employment) for fair comparisons between entities of different sizes
- **Interactive Exploration**: Hierarchical tree navigation through balance sheets, income statements, and expenditure data
- **Multilingual Support**: Full interface localization for Switzerland's four official languages

### Key Features

🏛️ **Multi-Level Government Data**
- Municipal financial statements (Gemeinden)
- Cantonal financial data (Kantone)
- Federal government data (Bund)
- Aggregated datasets for comparative analysis

📊 **Advanced Data Visualization**
- Interactive tree tables with expandable/collapsible nodes
- Side-by-side financial statement comparisons
- Real-time data aggregation and filtering
- Responsive design for desktop and mobile

⚖️ **Intelligent Scaling**
- Population-based scaling for per-capita comparisons
- Area-based scaling for geographic analysis
- Employment-based scaling for economic comparisons
- Custom scaling factors from official Swiss statistics

🌍 **Comprehensive Internationalization**
- German (Deutsch) - Primary language
- French (Français) - Official language
- Italian (Italiano) - Official language
- English - International accessibility

🔍 **Powerful Search & Filtering**
- Entity name and code search
- Year range filtering
- Data type categorization
- Semantic entity mapping with human-readable names
## 🛠️ Technical Stack

### Frontend Framework
- **Vue 3** - Modern reactive framework with Composition API
- **TypeScript** - Type-safe development with excellent IDE support
- **Vue Router** - Client-side routing with URL state persistence
- **Pinia** - Lightweight state management for complex data flows

### UI Components & Styling
- **PrimeVue 4** - Comprehensive UI component library
- **PrimeIcons** - Professional icon set
- **Tailwind CSS 4** - Utility-first CSS framework
- **TailwindCSS PrimeUI** - Seamless integration between Tailwind and PrimeVue

### Data Processing & Utilities
- **Papa Parse** - Robust CSV parsing for financial data files
- **Vue I18n** - Internationalization with reactive language switching
- **Chart.js** - Data visualization capabilities

### Development & Testing
- **Vite** - Lightning-fast build tool and development server
- **Vitest** - Unit testing framework with Vue component support
- **Playwright** - End-to-end testing across multiple browsers
- **Vue Test Utils** - Official testing utilities for Vue components

### Code Quality & Tooling
- **ESLint** - Code linting with Vue and TypeScript rules
- **Prettier** - Consistent code formatting
- **OxLint** - Additional fast linting for correctness
- **TypeScript ESLint** - TypeScript-specific linting rules

### Build & Deployment
- **npm-run-all2** - Parallel and sequential script execution
- **PostCSS** - CSS processing and optimization
- **Autoprefixer** - Automatic vendor prefix handling

## 📊 Data Sources

### Official Swiss Government Data

All financial data comes from authoritative Swiss government sources:

**🏛️ Federal Finance Administration (EFV)**
- Primary source: [Swiss Federal Finance Administration](https://www.efv.admin.ch/efv/en/home/themen/finanzstatistik/daten.html)
- Coverage: Municipal and cantonal financial statistics
- Format: Standardized financial reporting according to Swiss accounting standards
- Update frequency: Annual releases with historical data back to 2015

**📈 Federal Statistical Office (BFS)**
- Scaling data source: [Swiss Federal Statistical Office Atlas](https://www.atlas.bfs.admin.ch/)
- Population statistics (STATPOP)
- Geographic and demographic data
- Employment and economic indicators

### Data Coverage

**📅 Temporal Coverage**
- Financial data: 2015-2023 (varies by entity)
- Statistical data: 2018-2023 (varies by indicator)
- Regular updates as new official data becomes available

**🗺️ Geographic Coverage**
- **2,148 Municipalities** - All Swiss municipalities (Gemeinden)
- **26 Cantons** - All Swiss cantons and half-cantons (Kantone)
- **Federal Level** - Swiss Confederation (Bund)
- **Aggregated Datasets** - Combined views across governmental levels

**💰 Financial Statement Types**
- **Balance Sheets** (Bilanz) - Assets and liabilities
- **Income Statements** (Erfolgsrechnung) - Revenue and expenses
- **Expenditure Analysis** (Aufwand) - Detailed spending breakdowns
- **Investment Accounts** (Investitionsrechnung) - Capital expenditures

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: latest LTS version)
- **npm** 9+ (comes with Node.js)
- Modern web browser with ES2020+ support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gitu/gdn_ktn_bund.git
   cd gdn_ktn_bund
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers** (for e2e testing)
   ```bash
   npx playwright install
   ```

### Development

**Start development server**
```bash
npm run dev
```
- Opens at `http://localhost:5173`
- Hot module replacement enabled
- TypeScript checking in real-time

**Build for production**
```bash
npm run build
```
- Generates optimized production build in `dist/`
- Includes data processing and type checking
- Ready for deployment to any static hosting service

### Testing

**Run all tests**
```bash
npm run test
```

**Unit tests only**
```bash
npm run test:unit          # Single run
npm run test:unit:watch    # Watch mode
npm run test:coverage      # With coverage report
```

**End-to-end tests**
```bash
npm run test:e2e           # All browsers
npm run test:e2e -- --project=chromium  # Chromium only
npm run test:e2e -- --debug             # Debug mode
```

### Code Quality

**Linting and formatting**
```bash
npm run lint              # Run all linters
npm run format            # Format code with Prettier
npm run pre-commit        # Full quality check (lint + format + test + build)
```

### Data Processing

**Build data catalogs**
```bash
npm run build-data        # Generate available-data.json
npm run fetch-atlas       # Fetch latest statistical data
```

## 📁 Project Structure

```
gdn_ktn_bund/
├── src/
│   ├── components/          # Vue components
│   │   ├── DataBrowser.vue           # Data selection interface
│   │   ├── DatasetSelector.vue       # Dataset management
│   │   ├── FinancialDataComparison.vue    # Main comparison view
│   │   ├── FinancialDataDisplay.vue       # Tree table display
│   │   ├── FinancialDataScalingSelector.vue  # Scaling controls
│   │   └── LanguageSelector.vue      # Language switching
│   ├── views/               # Page-level components
│   │   ├── HomeView.vue              # Landing page
│   │   ├── AboutView.vue             # About page
│   │   ├── FinancialDataComparisonView.vue  # Main comparison page
│   │   └── FinancialDataFullView.vue        # Full-screen view
│   ├── stores/              # Pinia state management
│   │   └── financialData.ts          # Financial data store
│   ├── utils/               # Utility functions
│   │   ├── DataLoader.ts             # Financial data loading
│   │   ├── AvailableDataLoader.ts    # Data catalog management
│   │   ├── StatsDataLoader.ts        # Statistical data loading
│   │   ├── GeographicalDataLoader.ts # Geographic data handling
│   │   └── EntitySemanticMapper.ts   # Entity name mapping
│   ├── i18n/                # Internationalization
│   │   ├── index.ts                  # i18n configuration
│   │   └── locales/                  # Translation files
│   │       ├── de.json               # German translations
│   │       ├── fr.json               # French translations
│   │       ├── it.json               # Italian translations
│   │       └── en.json               # English translations
│   ├── types/               # TypeScript type definitions
│   └── layout/              # Layout components
├── public/
│   └── data/                # Static data files
│       ├── gdn/             # Municipal financial data
│       ├── std/             # Standard/aggregated data
│       └── stats/           # Statistical scaling data
├── scripts/                 # Build and data processing scripts
│   ├── buildAvailableData.js         # Generate data catalogs
│   ├── fetchAtlasData.js             # Fetch statistical data
│   └── processData.js                # Data transformation
├── e2e/                     # End-to-end tests
├── tests/                   # Unit tests
└── docs/                    # Documentation
```

## 🌟 Key Features in Detail

### 1. Multi-Entity Financial Comparison

Compare financial statements across different governmental levels:

- **Municipal Level**: Individual municipalities (Gemeinden) with populations over 5,000
- **Cantonal Level**: All 26 Swiss cantons and half-cantons
- **Federal Level**: Swiss Confederation (Bund)
- **Aggregated Views**: Combined datasets for cross-level analysis

### 2. Advanced Scaling Capabilities

Normalize financial data for meaningful comparisons:

- **Population Scaling**: Per-capita financial metrics
- **Geographic Scaling**: Per-hectare or per-square-kilometer analysis
- **Economic Scaling**: Per-workplace or per-employee metrics
- **Custom Scaling**: Flexible scaling based on available statistical data

### 3. Interactive Data Exploration

Navigate complex financial hierarchies:

- **Expandable Tree Structure**: Drill down from high-level categories to detailed accounts
- **Real-time Aggregation**: Dynamic calculation of totals and subtotals
- **Multi-column Comparison**: Side-by-side entity comparison in a single view
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 4. Comprehensive Search & Filtering

Find relevant data quickly:

- **Semantic Search**: Search by entity names, not just codes
- **Year Range Filtering**: Focus on specific time periods
- **Data Type Filtering**: Separate municipal from aggregated data
- **Smart Suggestions**: Auto-complete for entity names and codes

### 5. Professional Data Visualization

Present financial data clearly:

- **Hierarchical Tables**: Tree-like structure preserving accounting hierarchy
- **Conditional Formatting**: Visual indicators for positive/negative values
- **Scaling Indicators**: Clear display of applied scaling factors
- **Export Capabilities**: Data export for further analysis

## 🔧 Configuration & Customization

### Environment Variables

Create a `.env.local` file for local development:

```bash
# Development settings
VITE_API_BASE_URL=http://localhost:5173
VITE_ENABLE_DEBUG=true

# Build settings
VITE_BUILD_TIME=auto
VITE_GIT_COMMIT_HASH=auto
```

### Internationalization

Add new languages by:

1. Creating a new locale file in `src/i18n/locales/`
2. Adding the locale to `src/i18n/index.ts`
3. Updating the language selector component

### Data Sources

Add new data sources by:

1. Updating `public/data/stats/stats.json`
2. Adding corresponding CSV files
3. Running `npm run build-data` to regenerate catalogs

## 🤝 Contributing

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Make changes** following the existing code patterns
3. **Add tests** for new functionality
4. **Run quality checks**: `npm run pre-commit`
5. **Submit a pull request** with a clear description

### Code Standards

- **TypeScript**: All new code must be TypeScript
- **Vue 3 Composition API**: Use `<script setup lang="ts">`
- **PrimeVue Components**: Prefer PrimeVue over custom components
- **Tailwind CSS**: Use utility classes over custom CSS
- **Testing**: Unit tests for utilities, e2e tests for user flows

### AI Development Insights

This project demonstrates best practices for AI-assisted development:

- **Clear Requirements**: Well-defined user stories and acceptance criteria
- **Iterative Feedback**: Regular human review and guidance
- **Comprehensive Testing**: AI-generated tests ensure code quality
- **Documentation**: AI-maintained documentation stays current with code changes

## 📄 License

This project is open source but keep in mind that the data used in this project is not open source and cannot be used for commercial purposes. For commercial use please contact the Swiss Federal Finance Administration.

## 🙏 Acknowledgments

- **Swiss Federal Finance Administration** for providing comprehensive financial data
- **Swiss Federal Statistical Office** for demographic and geographic data
- **Vue.js Community** for excellent framework and ecosystem
- **PrimeVue Team** for professional UI components
- **AI Development Community** for pioneering human-AI collaboration techniques

---

**Built with ❤️ and 🤖 in Switzerland**

*This project showcases the future of software development through human-AI collaboration, demonstrating how AI agents can handle complex implementation while humans provide strategic direction and domain expertise.*