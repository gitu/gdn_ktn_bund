/**
 * Ready-made comparisons offered on the home page and on the empty comparison page.
 * Names and descriptions live in i18n under `financialDataComparison.sampleDatasets.<key>`.
 */
export interface SampleComparison {
  datasets: string[]
  /** Scaling statistic id (see public/data/stats/stats.json), e.g. 'pop' for per-capita values */
  scaling?: string
}

export const SAMPLE_COMPARISONS = {
  governmentalLevels: {
    datasets: [
      'std/fs/gdn:2024',
      'std/fs/ktn:2024',
      'std/fs/bund:2024',
      'std/fs/bund_ktn_gdn:2024',
    ],
  },
  zurichMunicipalities: {
    datasets: [
      'gdn/fs/010261:2024',
      'gdn/fs/010230:2024',
      'gdn/fs/010156:2024',
      'gdn/fs/010058:2024',
      'std/fs/gdn_zh:2024',
    ],
    scaling: 'pop',
  },
  // Several years: the development of Zürich and Winterthur, per inhabitant of each year
  zurichWinterthurTrend: {
    datasets: ['gdn/fs/010261', 'gdn/fs/010230'].flatMap((place) =>
      ['2018', '2019', '2020', '2021', '2022', '2023', '2024'].map((year) => `${place}:${year}`),
    ),
    scaling: 'pop',
  },
} as const satisfies Record<string, SampleComparison>

export type SampleComparisonKey = keyof typeof SAMPLE_COMPARISONS

/** Query string parameters understood by the comparison page (`datasets`, `scaling`). */
export function sampleComparisonQuery(sample: SampleComparison): Record<string, string> {
  const query: Record<string, string> = { datasets: sample.datasets.join(',') }
  if (sample.scaling) {
    query.scaling = sample.scaling
  }
  return query
}
