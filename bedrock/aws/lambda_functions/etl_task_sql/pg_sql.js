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
        return res.rowCount ? "Row count: " + res.rowCount : "Completed: " + JSON.stringify(res)
    }
    catch(err){
      const pg_error_codes = require("./pg_error_codes")
      let errmsg = pg_error_codes[err.code]
      throw [{"Postgres error":errmsg},err]
    }
}

module.exports = pg_sql
