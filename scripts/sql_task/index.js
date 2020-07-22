const pg_sql = require('./pg_sql');
const ss_sql = require('./ss_sql');
const get_db_defs= require('./get_db_defs');

async function sql_task(sql,etl){
    let db_defs = await get_db_defs()
    let db_def = db_defs[etl.db]
    let result

    console.log(etl)
    
    if(db_def.type == 'postgresql') {
        result = await pg_sql(db_def,sql)
    }else if(db_def.type == 'sqlserver') {
        result = await ss_sql(db_def,sql)
    }
    return result
}

module.exports = sql_task
