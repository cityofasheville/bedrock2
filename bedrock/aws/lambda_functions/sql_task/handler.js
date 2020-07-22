const pg_sql = require('./pg_sql')
const ss_sql = require('./ss_sql')
const get_db_defs= require('./get_db_defs')
const get_sql_from_file = require('./get_sql_from_file')

exports.lambda_handler = async (event) => {
    return new Promise(async (resolve, reject) => {
        try {
            let result
            let etl = event.ETLJob.etl_tasks[0]  // ?
            let db_defs = await get_db_defs()
            let sql_filepath = 'store/assets/' + etl.assetname + '/' + etl.file  // ?
            let sql = await get_sql_from_file(sql_filepath)
            let db_def = db_defs[etl.db]

            console.log(etl)
            
            if(db_def.type == 'postgresql') {
                result = await pg_sql(db_def,sql)
            }else if(db_def.type == 'sqlserver') {
                result = await ss_sql(db_def,sql)
            }else{ reject('invalid type') }
            resolve(result)
        }
        catch(err) {
            reject(err)
        }
    })
}

module.exports = sql_task
