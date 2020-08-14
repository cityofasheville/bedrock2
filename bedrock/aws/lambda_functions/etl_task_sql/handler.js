const pg_sql = require('./pg_sql')
const ss_sql = require('./ss_sql')
const get_db_defs= require('./get_db_defs')
const get_sql_from_file = require('./get_sql_from_file')

exports.lambda_handler =  async function(event) {
    console.log("EVENT: \n" + JSON.stringify(event, null, 2))
    try {
        let result
        let etl = event.ETLJob.etl_tasks[0]

        let db_defs = await get_db_defs()
        let sql_filepath = 'store/assets/' + event.ETLJob.name + '/' + etl.file  // 
        let sql = await get_sql_from_file(sql_filepath)
        let db_def = db_defs[etl.db]
        // console.log("db_def: \n" + JSON.stringify(db_def, null, 2))
        // console.log("sql: \n" + JSON.stringify(sql, null, 2))
        if(db_def.type == 'postgresql') {
            result = await pg_sql(db_def,sql)
        }else if(db_def.type == 'sqlserver') {
            result = await ss_sql(db_def,sql)
        }else{ 
            throw("Invalid DB Type")
        }

        return {
            'statusCode': 200,
            'body': {
                "lambda_output": result
            }
        }
    }
    catch(err) {
        console.log("Err: \n" + err) // debugging
        throw err
        throw{
            'statusCode': 400,
            'body': {
                "lambda_output": err
            }
        }
    }
}