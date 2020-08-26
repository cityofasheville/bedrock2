const get_pg_stream = require('./get_pg_stream')
const get_ss_stream = require('./get_ss_stream')
const get_db_defs= require('./get_db_defs')
const util = require('util');
const stream = require('stream');

const pipeline = util.promisify(stream.pipeline);

exports.lambda_handler = async (event) => {  
    try{
        let etl = event.ETLJob.etl_tasks[event.TaskIndex]
        let db_defs = await get_db_defs()
        let fromloc = etl.source_location
        if (fromloc.type = 'database') {
            if(db_defs[fromloc.db])
            { fromloc.db_def = db_defs[fromloc.db] }
            else { throw `Database definition ${fromloc.db} not found` }
        }
        fromloc.fromto = 'from'

        let toloc = etl.target_location
        if (toloc.type = 'database') {
            if(db_defs[toloc.db])
            { toloc.db_def = db_defs[toloc.db] }
            else { throw `Database definition ${toloc.db} not found` }
        }
        toloc.fromto = 'to'

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

        return pipeline(
        from_stream,
        to_stream)
        .then(() => {
            return {
                'statusCode': 200,
                'body': {
                    "lambda_output": `Table copied ${toloc.schemaname}.${toloc.tablename}`
                }
            }
        })
    } catch (err) {
        console.log(JSON.stringify(err, null, 2))
        return {
            'statusCode': 500,
            'body': {
                "lambda_output": err
            }
        }
    }
}
