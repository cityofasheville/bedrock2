const { Client } = require('pg')

async function pg_sql(connection,sql) {
    try {
        const client = new Client({
            host: connection.host,
            port: connection.port,
            user: connection.username,
            password: connection.password,
            database: connection.database,
            max: 10,
            idleTimeoutMillis: 10000,
        });
        await client.connect()
        const res = await client.query(sql)

        await client.end()  
        return res.rowCount ? "Row count: " + res.rowCount : "Completed"
    }
    catch(err){
      const pg_error_codes = require("./pg_error_codes")
      let errmsg = pg_error_codes[err.code]
      throw [{"Postgres error":errmsg},err]
    }
}

module.exports = pg_sql
