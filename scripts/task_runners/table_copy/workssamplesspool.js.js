'use strict';
//WORKS!
const sql = require('mssql');

function getpool(){
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
    return pool
}

const pool = getpool()
pool.connect()
.then(() => {
    console.log('connected');

    const table = new sql.Table('dbo.moo');
    table.create = true;
    table.columns.add('dat', sql.Int, { nullable: true});

    // add here rows to insert into the table
    table.rows.add(1010);
    table.rows.add(201);
    table.rows.add(301);

    const request = new sql.Request(pool);
    return request.bulk(table)
})
.then(data => {
    console.log(data);
    pool.close();
})
.catch(err => {
    console.log(err);
});