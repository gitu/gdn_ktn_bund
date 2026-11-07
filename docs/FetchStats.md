# Scaling statistics (`npm run fetch-stats`)

The scaling selector and the optimizer divide or fit financial figures by "statistics" (inhabitants, jobs, roads …).
They live in `public/data/stats/<id>/{gdn,ktn}/<year>.csv` and are registered in `public/data/stats/stats.json`.
Each CSV has the columns `GEO_ID;GEO_NAME;VALUE` (BFS municipality number or canton id 1–26).

The old BFS atlas (`atlas.bfs.admin.ch`, fetched by `fetchAtlasData.js`) was retired in 2026. The three scripts below
replace it; they download from `dam-api.bfs.admin.ch` and need no credentials. Behind a proxy set `NODE_USE_ENV_PROXY=1`.

| Script | Source | Statistic ids | Years |
|--------|--------|---------------|-------|
| `scripts/convertPxToStats.js` | STATPOP, PC-Axis cube `px-x-0102010000_101` (150 MB) | `pop`, `pop_0_19`, `pop_20_64`, `pop_65plus`, `pop_foreign` | 2015–2025 |
| `scripts/convertStatent.js` | STATENT, `px-x-0602010000_102` (5 MB) | `workplaces` (jobs), `fte`, `establishments`, `jobs_primary`, `jobs_secondary`, `jobs_tertiary` | 2015–2024 |
| `scripts/convertRoads.js` | `ts-x-11.03.01.07` | `road_length` (km, without national roads) | 2025 only |

```bash
npm run fetch-stats                 # all three
node scripts/convertStatent.js --dry
node scripts/convertPxToStats.js --px /path/to/local.px --first-year 2015
```

Each script is idempotent (same input, same files). Downloads are cached in `data/` (git-ignored). Use `--force` to
download again.

## Things to know

- **Municipal structure.** STATPOP is published with the municipalities of 6 April 2025 for *all* years, STATENT with
  those of 1 January 2024. Municipalities that merged before that are missing in earlier years; their financial data
  can still be shown but not scaled. Cantons are never affected.
- **Canton totals for jobs and roads** are the sum of the municipalities (the cubes have no canton rows). The canton of
  a municipality that no longer exists comes from the eCH-0071 register in `data/`.
- **Suppressed values.** STATENT hides small cells for privacy (`X`); those municipalities are left out of that file.
  Totals are almost always present; sector splits are missing for a few hundred municipalities.
- **`workplaces` changed meaning.** It used to be the BFS "Beschäftigte in aktiven Unternehmen" (UDEMO, one reference
  year labelled 2023). It is now the STATENT total of employed persons (including self-employed), per year, so values are
  about 10–15 % higher.
- **Roads** exist for 2025 only; the loader's nearest-year rule uses them for all years.
- `npm test` includes `scripts/__tests__/statsData.spec.js`, which checks the generated files (age groups add up to the
  total, canton sums equal municipal sums, no orphaned folders).

## Rest of canton (`npm run build-rest`)

`scripts/buildRestOfCantons.js` adds one calculated dataset per canton, `std/fs/gdn_<canton>_rest` ("Übrige Gemeinden
ZH (berechnet)"): the canton's all-municipalities aggregate minus the municipalities listed individually (the ones with
5,000+ inhabitants). It also adds a `rest_<cantonId>` row to the municipal statistics files so that the rest can be scaled
per inhabitant, job and so on.

It is an approximation and the app says so wherever it is used (`RestOfCantonNotice`, `placeFacts.about.cantonRest`):

- Transfers between municipalities (expenses 361-363, revenue 461-463) are left out: municipal files list them at gross,
  the canton aggregate nets them out.
- Any other account whose remainder would be negative is left out.
- There is no split by function (only the municipal files have it).
- No dataset where the remainder is under 1 % of the canton's assets (Glarus: all municipalities are listed).

Run it **after** `npm run split` (rewrites `std-info.json`) and `npm run fetch-stats` (rewrites the statistics files).
`npm run update-data` runs everything in the right order. The script is idempotent.
