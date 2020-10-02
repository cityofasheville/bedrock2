const pg_sql = require('./pg_sql')
const ss_sql = require('./ss_sql')
const get_connections= require('./get_connections')
const get_sql_from_file = require('./get_sql_from_file')

exports.lambda_handler =  async function(event, context) {
    // timeout task  
    let timeleft = context.getRemainingTimeInMillis() - 300;
    const timeout = new Promise(( resolve ) => {
      setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft/1000)} seconds` }), timeleft);
    })
  
    const task = new Promise(async ( resolve ) => {
        try {
            let result, connection
            let etl = event.ETLJob.etl_tasks[event.TaskIndex]
            if (!etl.active) {
                result = "Inactive: skipped"
            }else{
                let connections = await get_connections()
                let sql_filepath = 'store/assets/' + event.ETLJob.name + '/' + etl.file  // 
                let sql = await get_sql_from_file( sql_filepath )
                console.log("etl: \n" + JSON.stringify(etl, null, 2))
                console.log("connection: \n" + JSON.stringify(connections, null, 2))
                console.log("sql: \n" + JSON.stringify(sql, null, 2))
                if (connections[etl.connection]) {
                    connection = connections[etl.connection]
                } else { 
                    throw `Database definition ${etl.connection} not found`
                }

                if (connection.type == 'postgresql') {
                    result = await pg_sql( connection,sql )
                } else if (connection.type == 'sqlserver') {
                    result = await ss_sql( connection,sql )
                } else { 
                    throw("Invalid DB Type")
                }
            }

            resolve ({
                'statusCode': 200,
                'body': {
                    "lambda_output": result
                }
            })
        }
        catch(err) {
            resolve ({
                'statusCode': 500,
                'body': {
                    "lambda_output": err
                }
            })
        }

    })
    
    // race the timeout task with the real task-ready steady go!
    const res = await Promise.race([task, timeout]);
    return res;
}