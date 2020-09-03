const sql = require('mssql');

async function ss_sql(db_def,sql_string) { 
    try {
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

        await sql.connect(config)
        const result = await sql.query(sql_string)
        return result
    } catch (err) {
        throw ["SQL Server error", err]
    }
}

module.exports = ss_sql

