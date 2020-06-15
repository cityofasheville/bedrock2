const csv = require('csv');
const {
    fix_data_types,
    choose_columns,
    filter_bad_data
} = require('../transform_data');


const fs = require('fs');

  const rowSource = fs.createReadStream('tmp/payroll-export--T20200305-I000-S1583427600712.csv', "utf8");
  const fileOut = fs.createWriteStream('tmp/out.csv', "utf8");
    rowSource
    .pipe(fix_data_types)
    .pipe(choose_columns)
    .pipe(filter_bad_data)
    .pipe(csv.stringify())
    .pipe(fileOut);