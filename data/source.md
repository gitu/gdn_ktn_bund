Overview page of the EFV (Finanzstatistik data, lists all downloads):
https://www.efv.admin.ch/de/fs-daten

Downloads used by `fetch-data.sh` (served by the EFV data portal since 2025; the previous
`efv.admin.ch/dam/...` URLs return 404):

- Municipalities with 5,000+ inhabitants:
  https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/gdn_ab_5000-d.csv
- Standard evaluation (Bund, cantons, municipalities per canton, social insurance):
  https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/standardauswertung.csv
- Its code list:
  https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/standardauswertung_codelist.csv

Open data catalogue entry (main aggregates and forecasts):
https://opendata.swiss/de/dataset/hauptaggregate-und-prognosen-im-fs-und-gfs-modell

Scaling statistics (`npm run fetch-stats`, downloaded from dam-api.bfs.admin.ch; the old BFS atlas is gone):
- Population by age and nationality, STATPOP, PC-Axis cube px-x-0102010000_101 (asset 36733988):
  https://statistik.admin.ch/de/asset/36733988
- Jobs, establishments and sectors, STATENT, px-x-0602010000_102 (asset 36734273):
  https://statistik.admin.ch/de/asset/36734273
- Road length without national roads, ts-x-11.03.01.07 (asset 36195696):
  https://statistik.admin.ch/de/asset/36195696
