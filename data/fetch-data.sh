#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Since 2025 the EFV serves the Finanzstatistik CSVs from its data portal (the old
# efv.admin.ch/dam/... links return 404). Links as listed on https://www.efv.admin.ch/de/fs-daten
BASE=https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard

curl --fail --location --show-error --silent -o gdn_ab_5000-d.csv "$BASE/gdn_ab_5000-d.csv"
curl --fail --location --show-error --silent -o standardauswertung.csv "$BASE/standardauswertung.csv"
curl --fail --location --show-error --silent -o standardauswertung_codelist.csv "$BASE/standardauswertung_codelist.csv"
