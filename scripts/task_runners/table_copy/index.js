const get_pg_stream = require('./get_pg_stream');
const get_ss_stream = require('./get_ss_stream');
const { pipeline } = require('stream')

async function table_copy(db_defs,etl){
    return new Promise(async (resolve, reject) => {
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
        }else if(toloc.type == 'sqlserver') {
            to_stream = await get_ss_stream(toloc) // not implemented
        }
        pipeline(
        from_stream,
        to_stream,()=>{
            resolve()
        })
    })
}


module.exports = table_copy
