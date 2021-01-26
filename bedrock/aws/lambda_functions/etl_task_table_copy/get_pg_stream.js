const { Client } = require('pg')
const copyTo = require('pg-copy-streams').to     // pipe from a table _TO_ stream
const copyFrom = require('pg-copy-streams').from // pipe to a table _FROM_ stream

function get_pg_stream(location) {
    return new Promise(async function(resolve, reject) {
        // console.log(location)
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
                let serial_to_append = ''
                if(location.append_serial) {
                    serial_to_append=`alter table ${temp_tablename} add column ${location.append_serial} serial;`
                }
                let trans_string = `
                BEGIN TRANSACTION;
                ${serial_to_append}
                TRUNCATE TABLE ${tablename};
                INSERT INTO ${tablename} SELECT * FROM ${temp_tablename};
                COMMIT;
                `
                client.query(trans_string, (err, res) => {
                    console.log(res)
                    client.end()
                    if(err) reject(err)
                })
            }

            await client.connect()
            .catch(err => { console.error('Connection error', err.stack); reject(err) } )

            if(location.fromto == 'source_location') {
                let query_string = `COPY (SELECT * FROM ${tablename}) TO STDOUT WITH (FORMAT csv)`
                stream = client.query(copyTo(query_string))

                stream.on('error', err=>{ client.end(); reject(err) })
                stream.on('end', ()=>{ client.end() })
                console.log("Copy from Postgres: ", location.connection, tablename) 
            }else if(location.fromto == 'target_location'){
                // create empty temp table
                let createtemp_string = `SELECT * INTO TEMP ${temp_tablename} FROM ${tablename} WHERE 1=2;`;
                await client.query(createtemp_string).catch((err)=>{ reject(err) })
                if(location.append_serial) {  //The serial column appears in target but not source, so drop it first and readd it after stream
                    let dropserial_string = `alter table ${temp_tablename} drop column ${location.append_serial};`;
                    await client.query(dropserial_string).catch((err)=>{ reject(err) })
                }

                let query_string = `COPY ${temp_tablename} FROM STDIN WITH (FORMAT csv)`
                stream = client.query(copyFrom(query_string))

                stream.on('error', err=>{ client.end(); reject(err) })
                stream.on('finish', copy_from_temp)

                console.log("Copy to Postgres: ", location.connection, tablename)
            } 

            resolve(stream)
        }catch(err){
            reject(err)
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