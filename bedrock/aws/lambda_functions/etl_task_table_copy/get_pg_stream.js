const { Pool } = require('pg')
const copyTo = require('pg-copy-streams').to     // pipe from a table _TO_ stream
const copyFrom = require('pg-copy-streams').from // pipe to a table _FROM_ stream

function get_pg_stream(location) {
    return new Promise((resolve, reject) => {
        let tablename = `${location.schemaname}.${location.tablename}`
        let temp_tablename = `temp_${location.tablename}`
        let db_def = location.db_def

        let pool = new Pool({
            host: db_def.host,
            port: db_def.port,
            user: db_def.username,
            password: db_def.password,
            database: db_def.database,
            max: 10,
            idleTimeoutMillis: 10000,
        });


        pool
        .connect()
        .then(client => {
            let stream
            /////////////////////
            let err_func = (e) => { 
                client.release()
                console.error('query error', e.message, e.stack)
                reject(e)
            }
            let done = () => { client.release() }
            let copy_from_temp = () => {
                let trans_string = `
                BEGIN TRANSACTION;
                TRUNCATE TABLE ${tablename};
                INSERT INTO ${tablename} SELECT * FROM ${temp_tablename};
                COMMIT;
                `
                stream = client.query(trans_string)
                .catch(err_func)
                client.release()
            }
            /////////////////////
            if(location.fromto == 'from') {
                let query_string = `COPY ${tablename} TO STDOUT WITH (FORMAT csv)`
                stream = client.query(copyTo(query_string))
                stream.on('end', done)
                stream.on('error', err_func)
                console.log("Copy from Postgres: ", location.db, tablename) 
            }else if(location.fromto == 'to'){
                // create temp table
                let createtemp_string = `SELECT * INTO TEMP ${temp_tablename} FROM ${tablename} WHERE 1=2;`;
                client.query(createtemp_string)
                .catch(err_func)
                let query_string = `COPY ${temp_tablename} FROM STDIN WITH (FORMAT csv)`
                stream = client.query(copyFrom(query_string))
                stream.on('error', err_func)
                stream.on('finish', copy_from_temp)  
                console.log("Copy to Postgres: ", location.db, tablename)
            }

            resolve( stream )
        })        
    })
}



module.exports = get_pg_stream