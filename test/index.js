const assert = require('assert');
const fs = require('fs');
const Database = require('better-sqlite3');

let db;

before(() => {
  if (fs.existsSync('all_the_fips.db')) {
    fs.renameSync('all_the_fips.db', 'all_the_fips.db.bak');
  }

  db = new Database('all_the_fips.db');

  db.exec('CREATE TABLE zips2fips (zipcode TEXT PRIMARY KEY, fipscodes TEXT);');
  db.exec('CREATE TABLE fips2zips (fipscode TEXT PRIMARY KEY, zipcodes TEXT);');

  // ZIP code that maps to 1 valid FIPS code
  db.exec('INSERT INTO zips2fips (zipcode, fipscodes) VALUES (\'12121\', \'2121212\')');

  // // ZIP code that maps to 2 valid FIPS codes
  db.exec('INSERT INTO zips2fips (zipcode, fipscodes) VALUES (\'13131\', \'3131313,3232323\')');

  // // ZIP code that maps to 2 invalid and 1 valid FIPS codes
  db.exec('INSERT INTO zips2fips (zipcode, fipscodes) VALUES (\'14141\', \'414141,4141414,41414141\')');

  // // FIPS code that maps to 1 valid ZIP code
  db.exec('INSERT INTO fips2zips (fipscode, zipcodes) VALUES (\'2121212\', \'12121\')');

  // // FIPS code that maps to 2 valid ZIP codes
  db.exec('INSERT INTO fips2zips (fipscode, zipcodes) VALUES (\'3131313\', \'13131,23232\')');

  // // FIPS code that maps to 2 invalid and 1 valid ZIP codes
  db.exec('INSERT INTO fips2zips (fipscode, zipcodes) VALUES (\'4141414\', \'1414,14141,141414\')');

});

describe('lookup FIPS codes from ZIP codes', () => {
  it('ZIP code mapping to a single FIPS code should unmarshall to a single object', done => {
    const zipsAndFips = require('..');

    assert.deepEqual(zipsAndFips.getFIPSCodes('12121'), [
      {
        state: '21',
        county: '212',
        place: '12',
        combined: '2121212'
      }
    ]);

    done();

  });

  it('ZIP code mapping to multiple FIPS codes should unmarshall each', done => {
    const zipsAndFips = require('..');

    assert.deepEqual(zipsAndFips.getFIPSCodes('13131'), [
      {
        state: '31',
        county: '313',
        place: '13',
        combined: '3131313'
      },
      {
        state: '32',
        county: '323',
        place: '23',
        combined: '3232323'
      }
    ]);

    done();

  });

  it('only 7-digit FIPS codes should be returned', done => {
    const zipsAndFips = require('..');

    assert.deepEqual(zipsAndFips.getFIPSCodes('14141'), [
      {
        state: '41',
        county: '414',
        place: '14',
        combined: '4141414'
      }
    ]);

    done();

  });

  it('ZIP code not found should return an empty array', done => {
    const zipsAndFips = require('..');

    assert.deepEqual(zipsAndFips.getFIPSCodes('16161'), []);

    done();

  });

});

describe('lookup ZIP codes from FIPS codes', () => {
  it('FIPS code mapping to a single ZIP code should return single-element array', done => {
    const zipsAndFips = require('..');

    assert.deepEqual(zipsAndFips.getZIPCodes('2121212'), [ '12121' ]);
    done();

  });

  it('FIPS code mapping to multiple ZIP codes should return multi-element array', done => {
    const zipsAndFips = require('..');

    assert.deepEqual(zipsAndFips.getZIPCodes('3131313'), ['13131', '23232']);

    done();

  });

  it('only 5-digit ZIP codes should be returned', done => {
    const zipsAndFips = require('..');

    assert.deepEqual(zipsAndFips.getZIPCodes('4141414'), ['14141']);

    done();

  });

  it('FIPS code not found should return an empty array', done => {
    const zipsAndFips = require('..');

    assert.deepEqual(zipsAndFips.getZIPCodes('5151515'), []);

    done();

  });

});

after(() => {
  db.close();

  fs.unlinkSync('all_the_fips.db');

  if (fs.existsSync('all_the_fips.db.bak')) {
    fs.renameSync('all_the_fips.db.bak', 'all_the_fips.db');
  }
});
