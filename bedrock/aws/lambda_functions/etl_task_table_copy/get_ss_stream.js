const sql = require('mssql');
const csv = require('csv');

async function get_ss_stream(location) { 
    try {
        if(location.fromto == 'from') {
            let tablename = `${location.schemaname}.${location.tablename}`
            let conn_info = location.conn_info

            let sql_string = `SELECT * FROM ${tablename}`
            const config = {
                server: conn_info.host,
                port: conn_info.port,
                user: conn_info.username,
                password: conn_info.password,
                database: conn_info.database,
                options: { enableArithAbort: true },
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            }
            if(conn_info.domain){
                config.domain = conn_info.domain
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
            console.log("Copy from SQL Server: ", location.connection, tablename) 
            return stream
        }else if(location.fromto == 'to'){
            throw ("SQL Server 'To' not implemented")
        }
    }
    catch(err){
        throw ["SQL Server stream error", err]
    }
}

module.exports = get_ss_stream

