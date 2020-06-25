'use strict';
//WORKS!
const sql = require('mssql');


const config = {
    user: 'sa', 
    password: 'P@55w0rd', 
    server: 'localhost',
    database: 'rocktest',
    options: { enableArithAbort: true },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
}
const pool = new sql.ConnectionPool(config)

pool.connect()
.then(async () => {
    console.log('connected');

    const table = new sql.Table('dbo.moo');
    table.columns.add('dat', sql.Int, { nullable: true});

    // add here rows to insert into the table
    table.rows.add(13);
    table.rows.add(113);
    table.rows.add(1113);

    const request = new sql.Request(pool);
    const ret = await request.bulk(table)
    return ret
})
.then((data) => {
    console.log(data);
    pool.close();
})
.catch(err => {
    console.log(err);
});

