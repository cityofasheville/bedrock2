const sql = require('mssql');
const csv = require('csv');

function get_ss_stream(location) { 
    return new Promise(async (resolve, reject) => {
        if(location.fromto == 'from') {
            let tablename = `${location.schemaname}.${location.tablename}`
            let db_def = location.db_def

            let sql_string = `SELECT * FROM ${tablename}`
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
            try {
                let pool = await sql.connect(config)
                const request = new sql.Request(pool);
                let stream = request
                    .pipe(csv.stringify({
                        cast: {
                            date: function xx(date){
                                return date.toISOString()
                            },
                            boolean: function(value){
                                return value ? '1': '0'
                              }
                        }
                    }))
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
        }else if(location.fromto == 'to'){
            reject("SQL Server 'To' not implemented")
        }
    })
}

module.exports = get_ss_stream

