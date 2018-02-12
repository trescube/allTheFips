# zipsAndFips

ZipsAndFips provides a mapping of [US ZIP codes](https://en.wikipedia.org/wiki/ZIP_Code) to [places FIPS codes](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) and vice versa.  Since US ZIP codes and FIPS codes can have leading zeroes, all values are returned as strings.  

## Installation

```bash
$ npm install zipsAndFips
```

## Usage

Two functions are provided:

- `getFIPSCodes` that takes a string ZIP code parameter
- `getZIPCodes` that takes a string FIPS code parameter

Each ZIP code maps to 1 or more FIPS codes, eg: ZIP code 34433 maps to FIPS codes 1212450 (Citrus Springs, Florida) and 1257058 (Pine Ridge, Florida).  Each FIPS code maps to 1 or more ZIP codes, eg: FIPS code 3807200 (Bismarck, North Dakota) maps to ZIP codes 58501, 58503, 58504, and 58505.

Internally the module uses a [SQLite3](https://www.sqlite.org/) database.  

## Examples

Getting all FIPS codes for ZIP code 45409:

```js
var zipsAndFips = require('zipAndFips');
var fipsCodes = zipsAndFips.getFIPSCodes('45409');
assert.deepEqual(fipsCodes, [
  {
    state: '12',
    county: '124',
    place: '50',
    combined: '1212450'
  },
  {
    state: '12',
    county: '570',
    place: '58',
    combined: '1212450'
  }
]);
```

Getting all ZIP codes for FIPS code 3807200:

```js
var zipsAndFips = require('zipAndFips');
var zipCodes = zipsAndFips.getZIPCodes('3807200');
assert.deepEqual(zipCodes, ['58501', '58503', '58504', '58505']);
```

## Requirements

Node.js 4 or higher is required.

## Data

This module sources its data from the [US Census](https://www2.census.gov/geo/docs/maps-data/data/rel/zcta_place_rel_10.txt).  To update the data, run:

```bash
$ npm run rebuild_data
```

## Tests

To run the unit tests, execute:

```bash
$ npm test
```
