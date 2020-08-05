const sql = require('mssql');

function ss_sql(db_def,sql_string) { 
    return new Promise(async (resolve, reject) => {
        const config = {
            server: db_def.host,
            port: db_def.port,
            user: db_def.username,
            password: db_def.password,
            database: db_def.database,
            options: { enableArithAbort: true },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }
        if(db_def.domain){
            config.domain = db_def.domain
        }
        try {
            await sql.connect(config)
            const result = await sql.query(sql_string)
            console.dir(result)
            resolve()
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = ss_sql

