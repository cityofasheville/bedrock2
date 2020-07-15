// Not working yet
async function sql_task(db_defs,etl){
    let location = db_defs[etl.location.connection]
    location.table = etl.source_location

    console.log(location)
    
    let from_stream, to_stream
    if(location.type == 'postgresql') {
        from_stream = await get_pg_stream(location)
    }else if(location.type == 'sqlserver') {
        from_stream = await get_ss_stream(location)
    }
    if(toloc.type == 'postgresql') {
        to_stream = await get_pg_stream(toloc)
    }else if(toloc.type == 'sqlserver') {
        to_stream = await get_ss_stream(toloc) // not implemented
    }
    from_stream.pipe(process.stdout)
    from_stream.pipe(to_stream)
}

module.exports = sql_task
