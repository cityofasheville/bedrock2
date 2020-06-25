'use strict';
//sad trombone
const fs = require("fs")
const csv = require('csv')
const sql = require('mssql');

const readstream = fs.createReadStream('../data/numb.txt')

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
    console.log('connected')

    const table = new sql.Table('dbo.moo')
    table.create = true
    table.columns.add('dat', sql.Int, { nullable: true})

    //////////////////////

    const request = new sql.Request(pool)
    let ret = await request.bulk(table)
    return ret
})
.then(() => {
    // pool.close()
})
.catch(err => {
    console.log(err)
});
//////////////////////
const parser = csv.parse({from_line: 2})
let rowcount = 0

parser.on('readable', async function(){
    rowcount++
    let record
    while (record = parser.read()) {
        table.rows.add(record)
    }
    if(rowcount===100) {
        rowcount = 0
        const request = new sql.Request(pool)
        await request.bulk(table)            
    }
})
parser.on('error', function(err){
    console.error(err.message)
})
parser.on('end', async function(){
    const request = new sql.Request(pool)
    await request.bulk(table)
    pool.close()
})
///////////////
readstream.pipe(parser) 

