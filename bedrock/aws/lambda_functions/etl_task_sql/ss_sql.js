const sql = require('mssql');

async function ss_sql(connection,sql_string) { 
    try {
        const config = {
            server: connection.host,
            port: connection.port,
            user: connection.username,
            password: connection.password,
            database: connection.database,
            options: { enableArithAbort: true },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }
        if(connection.domain){
            config.domain = connection.domain
        }

        await sql.connect(config)
        const result = await sql.query(sql_string)
        return result
    } catch (err) {
        throw ["SQL Server error", err]
    }
}

module.exports = ss_sql

