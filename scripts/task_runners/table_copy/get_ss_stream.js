const sql = require('mssql');
const csv = require('csv');

function get_ss_stream(location) { 
    return new Promise(async (resolve, reject) => {
        let tablename = `${location.table.schemaname}.${location.table.tablename}`
        let sql_string = `SELECT * FROM ${tablename}`
        const config = {
            server: location.host,
            user: location.username,
            password: location.password,
            database: location.database,
            options: { enableArithAbort: true },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }
        try {
            let pool = await sql.connect(config)
            const request = new sql.Request(pool);
            let stream = request
                .pipe(csv.stringify())
            request.query(sql_string)
            stream.on('error', err => {
                reject(err)
            })
            stream.on('finish', () => {
                pool.close();
            })
            resolve( stream )
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = get_ss_stream

