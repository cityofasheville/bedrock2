const { Client } = require('pg')
const copyTo = require('pg-copy-streams').to     // pipe from a table _TO_ stream
const copyFrom = require('pg-copy-streams').from // pipe to a table _FROM_ stream

async function get_pg_stream(location) {
    let tablename = `${location.schemaname}.${location.tablename}`
    let temp_tablename = `temp_${location.tablename}`
    let db_def = location.db_def
    let client = new Client({
        host: db_def.host,
        port: db_def.port,
        user: db_def.username,
        password: db_def.password,
        database: db_def.database,
        max: 10,
        idleTimeoutMillis: 10000,
    });
    await client.connect()
    try {
        let stream
        /////////
        let copy_from_temp = async () => {
            let trans_string = `
            BEGIN TRANSACTION;
            TRUNCATE TABLE ${tablename};
            INSERT INTO ${tablename} SELECT * FROM ${temp_tablename};
            COMMIT;
            `
            await client.query(trans_string)
            await client.end()
        }
        //////////
        if(location.fromto == 'from') {
            let query_string = `COPY ${tablename} TO STDOUT WITH (FORMAT csv)`
            stream = await client.query(copyTo(query_string))

            stream.on('error', ()=>{ throw err })
            stream.on('end', async ()=>{ await client.end() })
            console.log("Copy from Postgres: ", location.db, tablename) 
        }else if(location.fromto == 'to'){
            // create empty temp table
            let createtemp_string = `SELECT * INTO TEMP ${temp_tablename} FROM ${tablename} WHERE 1=2;`;
            await client.query(createtemp_string)

            let query_string = `COPY ${temp_tablename} FROM STDIN WITH (FORMAT csv)`
            stream = await client.query(copyFrom(query_string))

            stream.on('error', ()=>{ throw err })
            stream.on('finish', copy_from_temp)

            console.log("Copy to Postgres: ", location.db, tablename)
        }

        return stream
    }catch(err) {
        console.log("pg err", err)
        await client.end()
        throw err
    }
}

module.exports = get_pg_stream