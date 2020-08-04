const { Client } = require('pg')

function pg_sql(db_def,sql) {
    return new Promise(async (resolve, reject) => {
        const client = new Client({
            host: db_def.host,
            port: db_def.port,
            user: db_def.username,
            password: db_def.password,
            database: db_def.database,
            max: 10,
            idleTimeoutMillis: 10000,
        });
        try{
            await client.connect()
            const res = await client.query(sql)
            console.log(res)
            await client.end()
            resolve()
        } catch(err) {
            reject(err.errorMessage)
        }
    })
}

module.exports = pg_sql
 