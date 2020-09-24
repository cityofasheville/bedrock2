const pg_sql = require('./pg_sql')
const ss_sql = require('./ss_sql')
const get_db_defs= require('./get_db_defs')
const get_sql_from_file = require('./get_sql_from_file')

exports.lambda_handler =  async function(event, context) {
    // timeout task  
    let timeleft = context.getRemainingTimeInMillis() - 300;
    const timeout = new Promise((resolve) => {
      setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft/1000)} seconds` }), timeleft);
    })
  
    const task = new Promise(async (resolve) => {
        try {
            let result, db_def
            let etl = event.ETLJob.etl_tasks[event.TaskIndex]
            if(!etl.active) {
                result = "Inactive: skipped"
            }else{
                let db_defs = await get_db_defs()
                let sql_filepath = 'store/assets/' + event.ETLJob.name + '/' + etl.file  // 
                let sql = await get_sql_from_file(sql_filepath)
                if(db_defs[etl.db])
                { db_def = db_defs[etl.db] }
                else { throw `Database definition ${etl.db} not found` }
                // console.log("db_def: \n" + JSON.stringify(db_def, null, 2))
                // console.log("sql: \n" + JSON.stringify(sql, null, 2))
                if(db_def.type == 'postgresql') {
                    result = await pg_sql(db_def,sql)
                }else if(db_def.type == 'sqlserver') {
                    result = await ss_sql(db_def,sql)
                }else{ 
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