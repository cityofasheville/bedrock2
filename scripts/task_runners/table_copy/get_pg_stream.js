const { Pool } = require('pg')
const copyTo = require('pg-copy-streams').to     // pipe from a table _TO_ stream
const copyFrom = require('pg-copy-streams').from // pipe to a table _FROM_ stream

function get_pg_stream(location) {
    return new Promise((resolve, reject) => {
        let tablename = `${location.table.schemaname}.${location.table.tablename}`

        let pool = new Pool({
            host: location.host,
            port: location.port,
            user: location.username,
            password: location.password,
            database: location.database,
            max: 10,
            idleTimeoutMillis: 10000,
        });

        pool
        .connect()
        .then(client => {
            let stream
            let done = () => { client.release() }
            let err = (e) => { 
                client.release()
                console.error('query error', e.message, e.stack)
                reject(e)
            }
            if(location.fromto == 'from') {
                let query_string = `COPY ${tablename} TO STDOUT WITH (FORMAT csv, HEADER)`
                stream = client.query(copyTo(query_string))
                stream.on('end', done)
                stream.on('error', err)
            }else{
                let del_string = `DELETE FROM ${tablename}`
                stream = client.query(del_string)
                .catch(e => {
                    client.release()
                    console.error('query error', e.message, e.stack)
                  })
                let query_string = `COPY ${tablename} FROM STDIN WITH (FORMAT csv, HEADER)`
                stream = client.query(copyFrom(query_string))
                stream.on('error', err)
                stream.on('finish', done)  
            }

            resolve( stream )
        })        
    })
}

module.exports = get_pg_stream