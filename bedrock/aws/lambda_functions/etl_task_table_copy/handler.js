const get_pg_stream = require('./get_pg_stream')
const get_ss_stream = require('./get_ss_stream')
const get_connections= require('./get_connections')
const util = require('util');
const stream = require('stream');

const pipeline = util.promisify(stream.pipeline);

exports.lambda_handler = async (event) => {  
    // console.log("event",event)
    try{
        let etl = event.ETLJob.etl_tasks[event.TaskIndex]
        let connections = await get_connections()
        

        let fromloc = etl.source_location
        if (connections[fromloc.connection]) {
            fromloc.conn_info = connections[fromloc.connection]
        } else { 
            throw `Connection definition ${fromloc.connection} not found`
        }
        fromloc.fromto = 'from'

        let toloc = etl.target_location
        if (connections[toloc.connection]) {
            toloc.conn_info = connections[toloc.connection]
        } else { 
            throw `Connection definition ${toloc.connection} not found`
        }
        toloc.fromto = 'to'

        // console.log("fromtoloc",fromloc,toloc)

        let from_stream, to_stream
        
        if(fromloc.conn_info.type == 'postgresql') {
            from_stream = await get_pg_stream(fromloc)
        }else if(fromloc.conn_info.type == 'sqlserver') {
            from_stream = await get_ss_stream(fromloc)
        }
        if(toloc.conn_info.type == 'postgresql') {
            to_stream = await get_pg_stream(toloc)
        }else if(toloc.conn_info.type == 'sqlserver') {
            to_stream = await get_ss_stream(toloc) // not implemented
        }

        // These arent needed for pg. testing for ss
        // from_stream.on('error', (err)=>{
        //     console.log("from_stream",err)
        //     return returnError(err)
        // })
        // to_stream.on('error', (err)=>{
        //     console.log("to_stream",err)
        //     return returnError(err)
        // })
        // These arent needed for pg. testing for ss

        return pipeline(
        from_stream,
        to_stream)
        .then(() => {
            return {
                'statusCode': 200,
                'body': {
                    "lambda_output": `Table copied ${toloc.connection} ${toloc.schemaname}.${toloc.tablename}`
                }
            }
        })
        .catch(err=>{
            console.log("pipeline",err)
            return returnError(err) 
        })
    } catch (err) {
        console.log("caught")
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
