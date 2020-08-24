const { Client } = require('pg')

async function pg_sql(db_def,sql) {
    try {
        const client = new Client({
            host: db_def.host,
            port: db_def.port,
            user: db_def.username,
            password: db_def.password,
            database: db_def.database,
            max: 10,
            idleTimeoutMillis: 10000,
        });
        await client.connect()
        const res = await client.query(sql)
        await client.end()  
        return res.rowCount
    }
    catch(err){
        throw err
    }
}

module.exports = pg_sql
 

/* PG syntax error returns
{
  "length": 93,
  "name": "error",
  "severity": "ERROR",
  "code": "42601",
  "position": "1",
  "file": "scan.l",
  "line": "1128",
  "routine": "scanner_yyerror"
}

PG table not found
{
  "length": 114,
  "name": "error",
  "severity": "ERROR",
  "code": "42P01",
  "position": "13",
  "file": "parse_relation.c",
  "line": "1159",
  "routine": "parserOpenTable"
}

*/