const fs = require("fs")

const db_defs = JSON.parse(fs.readFileSync('./data/bedrock_connections.json'))
const etl = require('./setup')
const {
    parse_data,
    transform_data,
    stringify_data
  } = require('./transform_data');
const get_pg_stream = require('./get_pg_stream');
const get_ss_stream = require('./get_ss_stream');

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
        from_stream = await get_pg_stream(fromloc) // stream buffer
    }else if(fromloc.type == 'sqlserver') {
        from_stream = await get_ss_stream(fromloc) // objects
    }
    if(toloc.type == 'postgresql') {
        to_stream = await get_pg_stream(toloc) // stream buffer
    }else if(toloc.type == 'sqlserver') {
        console.error("not implemented")
        // to_stream = await get_ss_stream(toloc)
    }
    from_stream.pipe(process.stdout)
    from_stream
    // .pipe(parse_data)
    // .pipe(transform_data)
    // .pipe(stringify_data)
    .pipe(to_stream)
}

run()
