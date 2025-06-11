#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

wget https://www.efv.admin.ch/dam/efv/de/dokumente/finanzstatistik/daten/fs_gdn/gemeinden-ab-5000-einwohner.csv.download.csv/gdn_ab_5000-d.csv -O gdn_ab_5000-d.csv
wget https://www.efv.admin.ch/dam/efv/de/dokumente/finanzstatistik/daten/standardauswertung.csv.download.csv/standardauswertung.csv -O standardauswertung.csv
