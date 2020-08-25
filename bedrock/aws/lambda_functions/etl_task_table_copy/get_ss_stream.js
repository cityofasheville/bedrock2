const sql = require('mssql');
const csv = require('csv');

async function get_ss_stream(location) { 
    try {
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
            if(db_def.domain){
                config.domain = db_def.domain
            }

            let pool = await sql.connect(config)
            const request = new sql.Request(pool);
            let stream = request
                .pipe(csv.stringify({
                    cast: {
                        date: (date)=>{
                            return date.toISOString()
                        },
                        boolean: (value)=>{
                            return value ? '1': '0'
                        }
                    }
                }))
            request.query(sql_string)
            stream.on('error', err => {
                throw(err)
            })
            stream.on('finish', () => {
                pool.close();
            })
            console.log("Copy from SQL Server: ", location.db, tablename) 
            return stream
        }else if(location.fromto == 'to'){
            throw ("SQL Server 'To' not implemented")
        }
    }
    catch(err){
        throw(err)
    }
}

module.exports = get_ss_stream

