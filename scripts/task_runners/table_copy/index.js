let fs = require("fs")

const { Pool } = require('pg')
var copyTo = require('pg-copy-streams').to     // pipe from a table _TO_ stream
var copyFrom = require('pg-copy-streams').from // pipe to a table _FROM_ stream
let db_defs = JSON.parse(fs.readFileSync('./data/bedrock_connections.json'))
let etl = require('./setup')
const {
    parse_data,
    transform_data,
    stringify_data
  } = require('./transform_data');

async function run(){
    let fromloc = db_defs[etl.source_location.connection]
    fromloc.table = etl.source_location
    fromloc.fromto = 'from'

    let toloc = db_defs[etl.target_location.connection]
    toloc.table = etl.target_location
    toloc.fromto = 'to'

    console.log(etl)
    console.log(fromloc)
    console.log(toloc)
    
    let from_stream, to_stream
    if(fromloc.type == 'postgresql') {
        from_stream = await get_pg_stream(fromloc)
    }else if(fromloc.type == 'sqlserver') {
        from_stream = await get_ss_stream(fromloc)
    }
    if(toloc.type == 'postgresql') {
        to_stream = await get_pg_stream(toloc)
    }else if(fromloc.type == 'sqlserver') {
        to_stream = await get_ss_stream(toloc)
    }
    from_stream
    .pipe(parse_data)
    .pipe(transform_data)
    .pipe(stringify_data)
    .pipe(to_stream)
}

run()

function get_ss_stream(location) { return }

function get_pg_stream(location) {
    return new Promise((resolve, reject) => {
        let tablename = `${location.table.schemaname}.${location.table.tablename}`

        let pool = new Pool({
            host: location.host,
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
                reject()
            }
            if(location.fromto == 'from') {
                let query_string = `COPY ${tablename} TO STDOUT`
                stream = client.query(copyTo(query_string))
                stream.on('end', done)
                stream.on('error', reject)
            }else{
                let del_string = `DELETE FROM ${tablename}`
                stream = client.query(del_string)
                .catch(e => {
                    client.release()
                    console.error('query error', e.message, e.stack)
                  })
                let query_string = `COPY ${tablename} FROM STDIN`
                stream = client.query(copyFrom(query_string))
                stream.on('error', reject)
                stream.on('finish', done)  
            }

            resolve( stream )
        })        
    })
}
