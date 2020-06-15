const debugStream = require('debug-stream')('new: ')
const sql = require('mssql');
const fs = require('fs');
const csv = require('csv');
const {
  fix_data_types,
  choose_columns,
  filter_bad_data
} = require('./transform_data');


require('dotenv').config({path:'./.env'})

async function load_one_file(filenm, pool) {
  try {
    const table = new sql.Table('[avl].[telestaff_import_time]');
    let db_loader = csv.transform(function(data){
        return data;
    });
    db_loader.on('readable', function(){
      while(data = db_loader.read()){
        table.rows.add(...data);
      }
    });

    const rowSource = fs.createReadStream('tmp/' + filenm, "utf8");
    rowSource
    .pipe(fix_data_types)
    .pipe(choose_columns)
    .pipe(filter_bad_data)
    .pipe(debugStream())
    .pipe(db_loader);


    let request = await pool.request();
    request.stream = true;

    table.create = true;
    // setup columns
    table.columns.add('source', sql.VarChar(32), { nullable: true });
    table.columns.add('group', sql.VarChar(32), { nullable: true });
    table.columns.add('emp_id', sql.Int, { nullable: true });
    table.columns.add('pay_code', sql.SmallInt, { nullable: true });
    table.columns.add('date_worked', sql.Date, { nullable: true });
    table.columns.add('hours_worked', sql.Decimal(19,10), { nullable: true });
    table.columns.add('note', sql.VarChar(128), { nullable: true });
    table.columns.add('date_time_from', sql.DateTime, { nullable: true });
    table.columns.add('date_time_to', sql.DateTime, { nullable: true });

    if(table.rows > 0) request.bulk(table);

    return filenm;
  } catch(err) {
    throw new Error(err);
  }
}

module.exports = load_one_file;