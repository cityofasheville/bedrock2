let etl = require('./setup')
let db_defs = require('./data/db_connection_PRIVATE')
const { Pool } = require('pg')
var copyTo = require('pg-copy-streams').to     // pipe from a table _TO_ stream (copyOut - copy-to)
var copyFrom = require('pg-copy-streams').from // pipe to a table _FROM_ stream (copyIn - copy-from)

async function run(){
    let fromloc = db_defs[etl.source_location.location]
    fromloc.table = etl.source_location
    fromloc.fromto = 'from'

    let toloc = db_defs[etl.target_location.location]
    toloc.table = etl.target_location
    toloc.fromto = 'to'

    console.log(etl)
    console.log(fromloc)
    console.log(toloc)
    
    let from_stream, to_stream
    if(fromloc.type == 'pg') {
        from_stream = await get_pg_stream(fromloc)
    }else if(fromloc.type == 'ss') {
        from_stream = await get_ss_stream(fromloc)
    }
    if(toloc.type == 'pg') {
        to_stream = await get_pg_stream(toloc)
    }else if(fromloc.type == 'ss') {
        to_stream = await get_ss_stream(toloc)
    }
    from_stream.pipe(to_stream)
}

run()

function get_ss_stream(location) { return }

function get_pg_stream(location) {
    return new Promise((resolve, reject) => {
        let tablename = `${location.table.schemaname}.${location.table.tablename}`

        let pool = new Pool({
            connection: location.connection,
            username: location.username,
            password: location.password,
            database: location.database,
            max: 10,
            idleTimeoutMillis: 10000,
        });

        pool
        .connect()
        .then(client => {
            let stream
            if(location.fromto == 'from') {
                let query_string = `COPY ${tablename} TO STDOUT`
                stream = client.query(copyTo(query_string))
                stream.on('end', done)
                stream.on('error', reject)
            }else{
                let query_string = `COPY ${tablename} FROM STDIN`
                stream = client.query(copyFrom(query_string))
                stream.on('error', reject)
                stream.on('finish', done)  
            }
            function done() {
                client.release()
            }
            resolve( stream )
        })        
    })
}

