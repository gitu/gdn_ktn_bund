# UI proposal: a fancier, mobile-first Finanzdaten-Explorer

Status: audit done 2026-11-07 (Chromium, 390×844 @2x and 1440×900, German locale). Phases 1–3 are
implemented in the same change, together with the data refresh, new statistics, plain-language texts and place
explainers (sections 5–7); phase 4 is the follow-up backlog.

## 1. What is wrong today

Measured, not guessed. Screens: `/`, `/about`, `/financial-comparison` (with the two demo comparisons),
`/c`.

### Mobile bugs (390 px wide)

| # | Where | Problem |
|---|-------|---------|
| M1 | `/about` | Page is 296 px wider than the screen. The 40-character commit hash cannot wrap. The cards use PrimeFlex classes (`flex-column`, `align-items-center`, `surface-50`, `border-round`, `border-left-3`) that do not exist in Tailwind 4, so rows collapse into three squeezed columns. |
| M2 | `/financial-comparison` | Dataset table is unusable: the name column is cut to "Aad", "Aara", "Aarb". A frozen name column plus two frozen right columns leave no room for content. |
| M3 | `/financial-comparison` | "Vollansicht öffnen" pushes the page 97 px too wide. |
| M4 | Demo cards | Card titles run under the "Demo-Daten laden" button. The footnote shows the raw key `financialDataScaling.options.pop` (wrong i18n namespace) and a hard-coded English "datasets". |
| M5 | Paginator | Reads "Zeige bis von Einträgen": the `{first}`/`{last}`/`{totalRecords}` placeholders are missing. |
| M6 | Layout | `@media (max-width: 600px)` sets `padding-left: .5rem` but leaves `padding-right: 2rem`, so every page is off-centre. |
| M7 | Topbar | The logo text wraps onto two lines; `2rem` side padding eats a third of the bar; the menu button has no accessible name. |
| M8 | Headings | `text-4xl`/`2.5rem` headings take 3–4 lines on a phone (home, comparison, about). |
| M9 | Result table | One value column fits; there is no hint that the table scrolls, the first column is not sticky by default, numbers are monospace instead of tabular figures. |
| M10 | Feedback | "Successfully loaded 5 datasets" is hard-coded English, 30 % opacity, and sits at the bottom of the page. |
| M11 | Selected datasets | The trash button on each selected row does nothing: the template passes the row object to `removeDataset(datasetId: string)`, which compares ids, so nothing matches. Only "Alle entfernen" worked. (Found while testing; not a visual problem, but it made the selection impossible to correct on any device.) |

### Visual / UX gaps (all sizes)

- **No identity.** The logo is a potted plant (a leftover from the template). The name "GDN KTN BUND" (Gemeinden,
  Kantone, Bund) is the same in all four languages and unexplained to anyone who does not know the abbreviations. The
  home page is three identical white cards with centred text.
- **Third-party font.** Lato is loaded from `fonts.cdnfonts.com` (blocks first paint, extra DNS/TLS, privacy,
  fails behind restrictive networks). Body text then falls back to the system sans.
- **Dark mode is a toggle that forgets.** It starts light every visit and ignores `prefers-color-scheme`.
- **`<html lang="">`** is empty and never follows the language selector (screen readers, hyphenation, translation prompts).
- **Scaling flashes.** With `?scaling=pop` the table first renders raw CHF totals while the dropdown already reads
  "Bevölkerung", then re-renders per-capita values ~150 ms after the load finishes (the scaling selector only reports
  its value once it is mounted, i.e. after the table). Loading five datasets took ~3.7 s of main-thread work in this
  sandbox's headless Chromium (a real phone will be slower); there is no skeleton, only a text line.

## 2. Design direction: "Swiss ledger"

Calm, editorial, data-forward. The numbers are the hero; chrome stays quiet.

- **Type:** Inter Variable, self-hosted (`@fontsource-variable/inter`), with `font-variant-numeric: tabular-nums` on all
  money. Fluid headings via `clamp()`.
- **Colour:** keep the emerald primary (it is already the PrimeVue/Lara default and the dark theme works with it),
  add a teal partner for gradients, a cool-slate neutral scale, and a warm paper background in light mode / deep ink in
  dark mode. Semantic red/green stay reserved for negative/positive differences.
- **Shape and depth:** 16 px card radius, 10 px control radius, one soft two-layer shadow, hairline borders that carry
  most of the structure. No heavy shadows.
- **Brand:** a small geometric mark (three ascending bars: Gemeinde, Kanton, Bund, on a gradient tile) next to the
  existing name, which stays because the page title and e2e tests use it. The long form "Schweizer
  Finanzdaten-Explorer" carries the home page headline.
- **Motion:** 150–250 ms fades/translates only, all disabled under `prefers-reduced-motion`. View transitions for the
  dark-mode switch already exist and stay.
- **All tokens live in one place** (`src/assets/layout/variables/_tokens.scss`) so a later re-theme is a one-file change.

## 3. Mobile strategy

1. **Fluid gutters, one source of truth.** `--gutter: clamp(.75rem, 4vw, 2rem)`; topbar and content use it.
2. **Bottom navigation under 768 px** (Home · Compare · About) with safe-area padding; the hamburger and sidebar stay
   for tablet and desktop. Thumb reach beats a drawer for a three-destination app.
3. **Tables become card lists where the data is a list.** The dataset picker renders each municipality/canton as a
   tappable card (name, year range, year select, add button) under 768 px; the DataTable stays on desktop. Selected
   datasets show as removable chips with a sticky "Compare (n)" action.
4. **Where the data is a matrix, keep the table but make it good:** sticky first column on by default under 768 px,
   narrower value columns, tabular figures, edge shadows that show there is more to scroll, header chips with a colour
   dot per dataset.
5. **Touch targets ≥ 44 px**, visible focus rings, no hover-only affordances (the column-compare feature currently
   relies on `title` tooltips; it gets a visible hint line instead).
6. **Never block on layout shift:** skeleton rows while loading, scaling applied before first paint of the table.
7. **Hard rule, tested:** no horizontal page scroll at 320–430 px on any route (Playwright assertion).

## 4. Plan

### Phase 1: foundation (this change)
- Self-host Inter; remove the CDN link; `lang` follows the locale; `theme-color`; `viewport-fit=cover`.
- Design tokens, fluid type, gutters, dark mode that follows the OS and remembers the choice (no flash on load).
  The chosen language is remembered too. (Browser-language detection is deliberately not added: it would change the
  default language the e2e tests and existing bookmarks rely on.)
- Topbar: compact, translucent blur, readable brand, labelled icon buttons. Bottom navigation on phones.
- Fix M6, M7, M8.

### Phase 2: pages (this change)
- **Home:** hero with gradient mesh, live stat chips from the catalogue (municipalities, cantons, years covered),
  three feature cards (compare, scale, share link) and two one-tap example comparisons.
- **Comparison:** compact header, card-list dataset picker on phones, chips for selection, fixed paginator text, demo
  cards redesigned (fixes M2–M5, M10), "Vollansicht öffnen" wraps (M3).
- **About:** rebuilt on Tailwind 4 utilities; commit hash wraps/truncates (M1); coverage text corrected to what is in
  the repo (see Data).
- **Result table:** M9 plus the scaling flash (apply scaling before first render).

### Phase 3: guard rails (this change)
- Unit tests for theme persistence and the new selector/cards; e2e test that asserts no horizontal overflow at
  320/390/430 px on all routes; existing e2e selectors (`tree-table`, `.entity-header`, `.comparison-tag`,
  `home-*` test IDs) are kept.

### Phase 4: backlog (not in this change)
- ~~Charts~~: done in phase 5 below.
- Saved comparisons / share sheet using the Web Share API on phones.
- Virtualised table rows for 10+ datasets; move the dataset load into a worker (the 3.7 s main-thread stall).
- PWA shell (offline catalogue, installable).
- Replace the 1,200-line `FinancialDataScalingSelector` with a bottom-sheet on phones.
- Visual regression baselines in CI (Playwright screenshots at 390 and 1440).

### Phase 5: comparison wizard, charts and years (2026-11-08)

The comparison page is now a four-step wizard; each step is one question, and the step bar above it shows what was
chosen and lets the user jump back.

1. **Places** (`PlacePicker`): search plus type chips (municipalities, cantons, Switzerland and federal, social
   insurance). Places are chosen without a year; their order is the order of chart rows and table columns. On phones
   the selection sits above the result list.
2. **Years** (`YearPicker`): one year (places side by side) or several (development over time), with "last 3 / 5 /
   all" presets. Each year shows how many of the places have data. A link that lists its own mix of places and years
   still works as is; the step says so before a change turns it into "every place in every year".
3. **Convert** (`ScalingStep`): francs, per inhabitant, per job, per hectare, another statistic, an own formula
   (built from buttons for statistics and operators, applied with a button), or "let it find a formula" (the
   optimiser, now with an account picker instead of typed codes). The step shows **what each column is divided by**,
   for every place and year, before any account is loaded, and marks when a statistic comes from another year (area is
   only available for 2018). This calculation lives in `src/utils/ScalingCalculator.ts`, separate from the store; the
   store applies the same numbers to the loaded columns.
4. **Result** (`ResultBar` + charts or table): places, year and conversion stay visible and editable. With one year,
   ‹ › steps to the previous/next year and keeps places and conversion; with several years a "year of the charts
   below" control does the same for the snapshot charts. The conversion is recalculated with each year's own
   statistics.

The URL keeps `datasets`, `scaling`, `comparisons` and `opt` as before (old links open the result) and adds `step`
and `view=table`. Step changes are history entries, so the browser's back button goes back one step.

**Charts** (`src/components/charts/`, hand-written HTML/SVG rather than chart.js, so they use the colour tokens,
switch with dark mode without re-rendering, and can be unit tested):
- Ertrag und Aufwand: grouped horizontal bars per place (labels above the bars, so long names never squeeze the plot).
- Ergebnis: diverging bars, blue surplus / red deficit, from a real zero line.
- Woher kommt das Geld? / Wofür wird das Geld ausgegeben?: 100 % stacked bars of the HRM2 groups (taxes, fees,
  transfers …; personnel, goods, transfers, depreciation …), small groups combined into "Übrige", fixed colours per group.
- Entwicklung (several years): one line per place for revenue, expenses, result, net debt (liabilities minus
  financial assets) or any account; gaps where a year is missing; crosshair tooltip and arrow-key readout.
- Im Vergleich (one year): the same figure picker as bars.

Every chart has a table twin, a legend from two series up, tooltips on hover, tap and keyboard focus, and leaves out
(and names) columns that have no divisor, instead of mixing francs with francs per inhabitant. The categorical palette
was checked for colour-vision deficiency and contrast against both surfaces with the dataviz palette validator; three
light-mode slots are below 3:1 on white, which is why values are labelled and the table view exists.

Also: an account row in the table now expands or collapses when its name is clicked, not only on the small caret.

## 5. Data

### What changed in this refresh (2026-11-07)

| Set | Before | Now |
|-----|--------|-----|
| Municipalities `gdn/fs/*` (≥ 5,000 inhabitants) | 415, 2015–2022 | **423, 2015–2024** (413 with 2024) |
| Standard evaluation `std/fs/*` | 91, 2015–2022, 2023 for only 38 | 91, **2015–2024**, 2025 for 8 (Bund, social insurance) |
| Population `pop` | one year (2023, atlas) | **per year 2015–2025** (STATPOP) |
| Age and nationality: `pop_0_19`, `pop_20_64`, `pop_65plus`, `pop_foreign` | – | new, 2015–2025 |
| Jobs `workplaces`, plus `fte`, `establishments`, `jobs_primary/secondary/tertiary` | one mislabelled year (UDEMO 2021 as "2023") | **per year 2015–2024** (STATENT) |
| `road_length` (km, without national roads) | – | new, 2025 only |
| `total_area`, `overbuilt` | 2018 | unchanged (the BFS only offers them as SDMX dataflows, see below) |

- The EFV moved its downloads to `www.data.finance.admin.ch`; both URLs in the old `data/fetch-data.sh` returned 404.
  The script, `data/source.md` and the new `npm run fetch-data` use the new location.
- The EFV revised earlier figures: about 790 municipal values for 2022 and about 170 standard values per year for
  2015–2021 changed materially (provisional → definitive, function re-allocations). The old 2023 standard files were
  inconsistent (other dimensions, no balance sheet) and are replaced.
- The retired BFS atlas is replaced by three scripts (`npm run fetch-stats`, see `docs/FetchStats.md`) that read the BFS
  PC-Axis cubes and a CSV from `dam-api.bfs.admin.ch`. Validation: for 2023 they reproduce the old atlas figures for
  more than 2,090 of 2,136 municipalities exactly; the differences are municipal mergers and boundary changes, because the
  BFS restates all years to the 2025 municipal structure.
- `workplaces` now counts all employed persons (STATENT) and is therefore about 10–15 % higher than the old UDEMO figure.

Integrity checks (all pass, enforced by `scripts/__tests__/statsData.spec.js` and the existing tests):

- All 4,670 financial CSVs parse; every `jahr` column equals its file name; empty `value` cells are blanks.
- Municipal balance sheets balance: 2,899 of 2,900 to the franc, one differs by CHF 2 (rounding).
- Age groups add up to the total population for every municipality and canton; canton job totals equal the sum of their
  municipalities; every demo comparison exists in the catalogue.

### Known limits

- **Merged municipalities** cannot be scaled: the BFS statistics use the 2025 structure, so a municipality that no longer
  exists (e.g. La Tène, data until 2024) has no population series. Coverage of scalable municipality-years is 98–99.8 %.
- **Roads** exist for 2025 only; the loader uses them for all years. **Area** (2018) comes from the old atlas files.
- **Jobs** are missing for a few municipalities (privacy suppression), sector splits for a few hundred.

### Rest of canton (municipalities under 5,000 inhabitants): built as an approximation

`std/fs/gdn_<canton>_rest` ("Übrige Gemeinden ZH (berechnet)") is the canton's all-municipalities aggregate minus the
municipalities listed individually, per 3-digit account, with matching `rest_<cantonId>` population, jobs and road
statistics so it can be scaled like everything else. 250 datasets (25 cantons × 10 years, `npm run build-rest`).

The data supports it for the **balance sheet** (remainders are positive and plausible in all 26 cantons: 8 % of assets
in ZH, 48 % in AG, 27 % in BL) but only partly for the **income statement**: municipal files list transfers between
municipalities (expenses 361–363, revenue 461–463) at gross, the canton aggregate nets them out (Canton Zürich 2022,
account 362: CHF 1.0 billion difference). Therefore:

- accounts 361–363 and 461–463 are never derived, and any account with a negative remainder is left out (about 1 in 12);
- there is no split by function (only the municipal files have it);
- totals and profit/loss of a rest column are therefore only partly comparable with other columns;
- no dataset where the remainder is below 1 % of the canton's assets (Glarus: all municipalities are listed);
- a warning (`RestOfCantonNotice`) appears on the comparison page and the full view whenever such a column is selected,
  and its card in "The places at a glance" says it is calculated, not published; the name says "(berechnet)".

### Not done: area, housing, vehicles, land use

The BFS publishes dwellings (`DF_GWS_REG5`), vacancies (`DF_LWZ_1`), vehicles (`DF_MFZ_0_COMMUNE`), the land-use survey
and sealed surface (`DF_AREA_*`) as SDMX dataflows only (no file), served by `disseminate.stats.swiss`. That host is not
reachable from the sandbox. They are the most promising additional optimisation factors (infrastructure, housing stock).

## 6. Plain language and explainers

- **Swiss spelling and plain wording** across the four languages: "Datensätze" → "Einträge/Spalten", "Skalierung" →
  "Beträge umrechnen", "Regierungseinheiten" → "Gemeinden, Kantone und Bund", "Entitäten" → "Orte", `ß` → `ss`.
  The home texts, the e2e translation tests and the selector placeholder changed accordingly.
- **"So lesen Sie die Zahlen"** (`HowToRead`): what balance sheet, income statement and result mean, why "per
  inhabitant", how to compare two columns, where the figures come from (provisional last years) and what limits
  comparisons (accounting rules and task sharing differ between cantons).
- **"Die Orte im Überblick"** (`PlaceFacts`): one card per selected column saying what it covers (municipality, canton
  without its municipalities, all municipalities of a canton, federal level, social insurance) with inhabitants, share
  of 65+ and foreign residents, jobs, roads and area, taken from the same statistics the scaling uses.
- Bugs found on the way: the German label of "all municipalities of a canton" used the **English** canton name ("Zurich",
  "Basel-City", "Grisons"); summing the federal level counted the area three times (the area file also lists Switzerland
  and large regions), which also affected per-area scaling of the Bund.

## 7. Dependencies and deployment

See the section at the end of this document ("Status of dependencies and deployment") once completed.

## 8. Open questions for the product owner

1. The rest of canton is built with the limits above. Should it be restricted to the balance sheet, or should the
   comparable P&L accounts be reported with an explicit "excluding transfers between public bodies" total?
2. Which further cost drivers matter most (housing, vehicles, land use need access to `disseminate.stats.swiss`)?
3. Municipalities that merged: show their old financial data unscaled (today), or build historic population per
   pre-merger municipality from the BFS "Gemeindemutationen" history?
