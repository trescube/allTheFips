const Database = require('better-sqlite3');
const request = require('request');
const sink = require('through2-sink');
const csv_stream = require('csv-stream');
const fs = require('fs');

// this URL contains the zips<->fips mappings
const url = 'https://www2.census.gov/geo/docs/maps-data/data/rel/zcta_place_rel_10.txt';

const csv_parse_stream = csv_stream.createStream();
// override default encoding which is not set properly for Node.js 8
// see https://github.com/lbdremy/node-csv-stream/issues/13
csv_parse_stream._encoding = 'utf8';

// keep track of mappings between zip codes and FIPS codes
const zips2fips = {};
const fips2zips = {};

console.log(`retrieving source data from ${url}`);

request.get(url)
  .on('response', response => {
    if (response.statusCode !== 200) {
      console.error(`could not retrieve source data, status code: ${response.statusCode}`)
      process.exit(1);
    }
  })
  .pipe(csv_parse_stream)
  .pipe(sink.obj(record => {
    if (!zips2fips.hasOwnProperty(record.ZCTA5)) {
      zips2fips[record.ZCTA5] = [];
    }
    if (!fips2zips.hasOwnProperty(record.GEOID)) {
      fips2zips[record.GEOID] = [];
    }

    zips2fips[record.ZCTA5].push(record.GEOID);
    fips2zips[record.GEOID].push(record.ZCTA5);

  }))
  .on('finish', () => {
    const db = new Database('all_the_fips_tmp.db');

    db.exec('CREATE TABLE zips2fips (zipcode TEXT PRIMARY KEY, fipscodes TEXT)');
    db.exec('CREATE TABLE fips2zips (fipscode TEXT PRIMARY KEY, zipcodes TEXT)');

    const zips2FipsStmt = db.prepare('INSERT INTO zips2fips (zipcode, fipscodes) VALUES (?, ?)');
    const fips2ZipsStmt = db.prepare('INSERT INTO fips2zips (fipscode, zipcodes) VALUES (?, ?)');

    db.prepare('BEGIN').run();

    try {
      // insert the zipcode and concatenated FIPS codes
      Object.keys(zips2fips).forEach(zip  => zips2FipsStmt.run(zip,  zips2fips[zip].join(',')));
      Object.keys(fips2zips).forEach(fips => fips2ZipsStmt.run(fips, fips2zips[fips].join(',')));

      db.prepare('COMMIT').run();

      console.log(`inserted ${Object.keys(zips2fips).length} zip codes`);
      console.log(`inserted ${Object.keys(fips2zips).length} FIPS codes`);

    } finally {
      if (db.inTransaction) {
        db.prepare('ROLLBACK').run();
        db.close();

        // remove the temporary db file since something went wrong
        fs.unlinkSync('all_the_fips_tmp.db');

      }
      else {
        db.close();

        // switcheroo the db files
        if (fs.existsSync('all_the_fips.db')) {
          fs.unlinkSync('all_the_fips.db');
        }
        fs.renameSync('all_the_fips_tmp.db', 'all_the_fips.db');

      }

    }

  });
