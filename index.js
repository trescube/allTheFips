const Database = require('better-sqlite3');
const db = new Database('all_the_fips.db');

const selectFIPSCodesSQL = db.prepare('SELECT fipscodes FROM zips2fips WHERE zipcode = ?');
const selectZIPCodesSQL = db.prepare('SELECT zipcodes FROM fips2zips WHERE fipscode = ?');

module.exports = {
  getFIPSCodes: zipCode => {
    const result = selectFIPSCodesSQL.get(zipCode);

    // if there are no known FIPS codes for the supplied zipcode, return an empty array
    if (!result) {
      return [];
    }

    // otherwise, split by comma and convert to objects
    return result.fipscodes.
      split(',').
      filter(fipscode => fipscode.length === 7).
      map(fipscode => ({
          state: fipscode.substr(0, 2),
          county: fipscode.substr(2, 3),
          place: fipscode.substr(5, 2),
          combined: fipscode
      }));

  },
  getZIPCodes: fipsCode => {
    const result = selectZIPCodesSQL.get(fipsCode);

    // if there are no known ZIP codes for the supplied FIPS code, return an empty array
    if (!result) {
      return [];
    }

    return result.zipcodes.split(',').filter(zipcode => zipcode.length === 5);

  }
};
