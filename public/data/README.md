# Swiss Municipality Financial Data

This directory contains financial data for Swiss municipalities (Gemeinden) with populations over 5,000.

## Data Structure

### Directory Structure

- `gdn/` - Contains subdirectories for each municipality, identified by their unique number (nr)
  - `<nr>/` - Contains CSV files for each year of data available for that municipality
    - `<jahr>.csv` - Financial data for a specific municipality in a specific year

### File: gdn-info.json

This file contains metadata about all municipalities in the dataset, including:

- `nr`: Unique identifier for the municipality
- `gemeinde`: Name of the municipality
- `jahre`: Array of years for which data is available for this municipality

Example:
```json
{
  "nr": "010002",
  "gemeinde": "Affoltern a.A.",
  "jahre": ["2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"]
}
```

### CSV File Structure

Each CSV file contains financial records for a specific municipality in a specific year with the following columns:

- `jahr`: Year of the financial data
- `nr`: Unique identifier for the municipality
- `gemeinde`: Name of the municipality
- `konto`: Account number
- `funktion`: Function code (if applicable)
- `betrag`: Amount in Swiss Francs (CHF)

## Data Source

The data is derived from the original dataset `gdn_ab_5000.csv` located in the `/data` directory, which contains financial information for Swiss municipalities with populations over 5,000.

## Data Processing

The data has been processed using a script (`scripts/processData.js`) that:

1. Reads the original CSV file
2. Splits the data by municipality number (nr) and year (jahr)
3. Creates individual CSV files for each municipality and year
4. Generates the `gdn-info.json` file with metadata about all municipalities

## Usage

This data can be used to analyze financial trends and patterns across Swiss municipalities over time. The structured format makes it easy to query data for specific municipalities or years.