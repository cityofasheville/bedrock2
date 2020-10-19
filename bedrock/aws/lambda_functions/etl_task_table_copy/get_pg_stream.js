const { Client } = require('pg')
const copyTo = require('pg-copy-streams').to     // pipe from a table _TO_ stream
const copyFrom = require('pg-copy-streams').from // pipe to a table _FROM_ stream

function get_pg_stream(location) {
    return new Promise(async function(resolve, reject) {
        try{
            let tablename = `${location.schemaname}.${location.tablename}`
            let temp_tablename = `temp_${location.tablename}`
            let conn_info = location.conn_info
            let client = new Client({
                host: conn_info.host,
                port: conn_info.port,
                user: conn_info.username,
                password: conn_info.password,
                database: conn_info.database,
                max: 10,
                idleTimeoutMillis: 10000,
            });
            let stream
            /////////
            let copy_from_temp = () => {
                let trans_string = `
                BEGIN TRANSACTION;
                TRUNCATE TABLE ${tablename};
                INSERT INTO ${tablename} SELECT * FROM ${temp_tablename};
                COMMIT;
                `
                client.query(trans_string, (err, res) => {
                    client.end()
                    if(err) reject("copyfromtemp error",err)
                })
            }

            await client.connect()
            .catch(err => { console.error('Connection error', err.stack); reject(err) } )

            if(location.fromto == 'from') {
                let query_string = `COPY ${tablename} TO STDOUT WITH (FORMAT csv)`
                stream = client.query(copyTo(query_string))

                stream.on('error', err=>{ client.end(); reject("from stream error",err) })
                stream.on('end', ()=>{ client.end() })
                console.log("Copy from Postgres: ", location.connection, tablename) 
            }else if(location.fromto == 'to'){
                // create empty temp table
                let createtemp_string = `SELECT * INTO TEMP ${temp_tablename} FROM ${tablename} WHERE 1=2;`;
                client.query(createtemp_string).catch((err)=>{ reject("into temp error", err) })

                let query_string = `COPY ${temp_tablename} FROM STDIN WITH (FORMAT csv)`
                stream = client.query(copyFrom(query_string))

                stream.on('error', err=>{ client.end(); reject("to stream error", err) })
                stream.on('finish', copy_from_temp)

                console.log("Copy to Postgres: ", location.connection, tablename)
            } 

            resolve(stream)
        }catch(err){
            reject("caught error", err)
        }   
    }) 
}

module.exports = get_pg_stream

/* parameter data structure
location = {
    schemaname,
    tablename,
    connection,
    conn_info: {
        host,
        post,
        ...
    }
}
*/