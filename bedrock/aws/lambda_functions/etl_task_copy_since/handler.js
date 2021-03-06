const get_pg_stream = require('./get_pg_stream')
const get_ss_stream = require('./get_ss_stream')
const get_google_stream = require('./get_google_stream')
const stream_debug = require('./stream_debug')
const get_connections= require('./get_connections')
const util = require('util');
const stream = require('stream');

const pipeline = util.promisify(stream.pipeline);

exports.lambda_handler = async (event) => {  
    // console.log("event",event)
    try{
        let etl = event.ETLJob.etl_tasks[event.TaskIndex]
        if (!etl.active) {
            return {'statusCode': 200,'body': {"lambda_output": "Inactive: skipped"}}
        }else{
            let connections = await get_connections()
            let streams = {}

            let bothloc = [ 
                {name: 'source_location'},
                {name: 'target_location'}
            ]
            for (const eachloc of bothloc) {
                eachloc.location = etl[eachloc.name]
                eachloc.location.fromto = eachloc.name
                if (connections[eachloc.location.connection]) {
                    eachloc.location.conn_info = connections[eachloc.location.connection]
                } else { 
                    throw `Connection definition ${eachloc.location.connection} not found`
                }
                // console.log(JSON.stringify(eachloc.location,null,2))
                if(eachloc.location.conn_info.type === 'postgresql') {
                    streams[eachloc.name] = await get_pg_stream(eachloc.location)
                }else if(eachloc.location.conn_info.type === 'sqlserver') {
                    streams[eachloc.name] = await get_ss_stream(eachloc.location)
                }else if(eachloc.location.conn_info.type === 'google_sheets') {
                    streams[eachloc.name] = await get_google_stream(eachloc.location)
                }
            }

            return pipeline(
            streams.source_location,
            // stream_debug,
            streams.target_location)
            .then(() => {
                return {
                    'statusCode': 200,
                    'body': {
                        "lambda_output": `Table copied ${etl.target_location.connection} ${etl.target_location.schemaname}.${etl.target_location.tablename}`
                    }
                }
            })
            .catch(err=>{
                return returnError(err)
            })
        }
    } catch (err) {
        return returnError(err)
    }
}

function returnError(err){
    return {
        'statusCode': 500,
        'body': {
            "lambda_output": err.toString()
        }
    }
}
