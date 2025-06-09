# Atlas Data Fetcher

This script automatically fetches statistical data from the Swiss Federal Statistical Office atlas (atlas.bfs.admin.ch) based on atlas IDs defined in the `stats.json` configuration file.

## Overview

The script reads the `public/data/stats/stats.json` file and fetches CSV data from the Swiss Federal Statistical Office atlas using the URL pattern:

```
https://www.atlas.bfs.admin.ch/core/projects/13/xshared/csv/{atlasId}_131.csv
```

## Usage

### Basic Usage

```bash
npm run fetch-atlas
```

This will:
1. Read the stats configuration from `public/data/stats/stats.json`
2. Extract all atlas IDs from the data entries
3. Fetch the corresponding CSV files from the atlas
4. Save them to the directories specified in the stats configuration
5. Skip files that already exist

### Force Overwrite

```bash
npm run fetch-atlas -- --force
```

Use the `--force` flag to overwrite existing files.

## Configuration

The script reads its configuration from `public/data/stats/stats.json`. The file should have the following structure:

```json
{
  "stats": [
    {
      "id": "pop",
      "name": {
        "de": "Anzahl Einwohner/-innen am Jahresende",
        "fr": "Nombre d'habitants à la fin de l'année",
        "it": "Numero di abitanti alla fine dell'anno",
        "en": "Number of inhabitants at the end of the year"
      },
      "unit": {
        "de": "Einwohner/Innen",
        "fr": "Habitants",
        "it": "Abitanti",
        "en": "Inhabitants"
      },
      "mode": "absolut",
      "source": "STATPOP via atlas.bfs.admin.ch",
      "lastUpdate": "2024-08-21",
      "data": {
        "ktn": [
          {
            "year": 2023,
            "file": "pop/ktn/2023.csv",
            "atlasId": "27862"
          }
        ],
        "gdn": [
          {
            "year": 2023,
            "file": "pop/gdn/2023.csv",
            "atlasId": "27864"
          }
        ]
      }
    }
  ]
}
```

## Output

The script will:
- Create the necessary directory structure under `public/data/stats/`
- Download CSV files to the paths specified in the `file` field
- Provide detailed progress information and error reporting
- Generate a summary report at the end

## Error Handling

The script includes comprehensive error handling:
- Network errors when fetching data
- File system errors when creating directories or writing files
- Invalid configuration file format
- Missing atlas IDs or file paths

## Data Source

The data is fetched from the Swiss Federal Statistical Office (BFS) atlas:
- **Source**: https://www.atlas.bfs.admin.ch/
- **API Endpoint**: https://www.atlas.bfs.admin.ch/core/projects/13/xshared/csv/
- **Data Format**: CSV with semicolon delimiters
- **Encoding**: UTF-8

## CSV Data Format

The fetched CSV files contain the following columns:
- `GEO_ID`: Geographic entity ID
- `GEO_NAME`: Geographic entity name
- `VARIABLE`: Variable description
- `VALUE`: Statistical value
- `UNIT`: Unit of measurement
- `STATUS`: Data status code
- `STATUS_DESC`: Data status description
- `DESC_VAL`: Value description
- `PERIOD_REF`: Reference period
- `SOURCE`: Data source
- `LAST_UPDATE`: Last update date
- `GEOM_CODE`: Geometry code
- `GEOM`: Geometry description
- `GEOM_PERIOD`: Geometry period
- `MAP_ID`: Map ID
- `MAP_URL`: Map URL

## Examples

### Adding New Statistics

To add a new statistic, update the `stats.json` file:

```json
{
  "id": "age",
  "name": {
    "de": "Durchschnittsalter",
    "en": "Average Age"
  },
  "data": {
    "ktn": [
      {
        "year": 2023,
        "file": "age/ktn/2023.csv",
        "atlasId": "12345"
      }
    ]
  }
}
```

Then run the fetch script:

```bash
npm run fetch-atlas
```

### Fetching Specific Years

The script automatically processes all years defined in the configuration. To fetch data for specific years, modify the `stats.json` file to include only the desired year entries.

## Integration

This script is designed to work with:
- **StatsDataLoader**: For loading the fetched statistical data
- **Build Process**: Can be integrated into the build pipeline
- **Data Management**: Part of the overall data management workflow

## Troubleshooting

### Common Issues

1. **Network Errors**: Check internet connection and atlas.bfs.admin.ch availability
2. **Permission Errors**: Ensure write permissions for the `public/data/stats/` directory
3. **Invalid Atlas IDs**: Verify atlas IDs in the stats.json configuration
4. **File Already Exists**: Use `--force` flag to overwrite existing files

### Debug Information

The script provides detailed logging including:
- Configuration loading status
- Individual file fetch progress
- Error messages with context
- Summary statistics

## Related Documentation

- [StatsDataLoader.md](./StatsDataLoader.md) - For loading the fetched data
- [Swiss Federal Statistical Office](https://www.bfs.admin.ch/) - Official data source
- [Atlas BFS](https://www.atlas.bfs.admin.ch/) - Interactive atlas interface
