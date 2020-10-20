const sql = require('mssql');
const csv = require('csv');
const { close_all_pools, get_pool } = require("./ss_pools")

async function get_ss_stream(location) { 
    return new Promise(async function(resolve, reject) {
        sql.on('error', err => {
            reject(err)
        })
        try {
            if(location.fromto == 'from') {
                let tablename = `${location.schemaname}.${location.tablename}`
                let conn_info = location.conn_info
                let pool_name = location.connection

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
                if(conn_info.domain) config.domain = conn_info.domain

                let pool = await get_pool(pool_name, config)
                const request = await pool.request()
                request.stream = true

                request.query(sql_string)
                request.on('error', err => {
                    reject(err)
                })
                request.on('finish', () => { //done?
                    close_all_pools();
                })
                console.log("Copy from SQL Server: ", location.connection, tablename) 
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
                resolve( stream )
            }else if(location.fromto == 'to'){
                reject ("SQL Server 'To' not implemented")
            }
        }
        catch(err){
            reject( ["SQL Server stream error", err] )
        }
    })
}

module.exports = get_ss_stream

