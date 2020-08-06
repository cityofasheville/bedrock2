const get_pg_stream = require('./get_pg_stream')
const get_ss_stream = require('./get_ss_stream')
const get_db_defs= require('./get_db_defs')
const { pipeline } = require('stream')

exports.lambda_handler = async (event) => {    
    let etl = event.ETLJob.etl_tasks[0]
    let db_defs = await get_db_defs()
    let fromloc = etl.source_location
    if (fromloc.type = 'database') {
        fromloc.db_def = db_defs[fromloc.db]
    }
    fromloc.fromto = 'from'

    let toloc = etl.target_location
    if (toloc.type = 'database') {
        toloc.db_def = db_defs[toloc.db]
    }
    toloc.fromto = 'to'

    // console.log(etl)
    // console.log(fromloc)
    // console.log(toloc)
    
    let from_stream, to_stream
    if(fromloc.db_def.type == 'postgresql') {
        from_stream = await get_pg_stream(fromloc)
    }else if(fromloc.db_def.type == 'sqlserver') {
        from_stream = await get_ss_stream(fromloc)
    }
    if(toloc.db_def.type == 'postgresql') {
        to_stream = await get_pg_stream(toloc)
    }else if(toloc.db_def.type == 'sqlserver') {
        to_stream = await get_ss_stream(toloc) // not implemented
    }
    pipeline(
    from_stream,
    to_stream,(err)=>{
        if(err){ throw(err) }
        return {
            'statusCode': 200,
            'body': {
                "lambda_output": "..."
            }
        }
    })
}
