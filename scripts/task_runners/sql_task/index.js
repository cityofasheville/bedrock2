const pg_sql = require('./pg_sql');
const ss_sql = require('./ss_sql');

async function sql_task(db_defs,sql,etl){
    let result
    let db_def = db_defs[etl.db]

    console.log(etl)
    
    if(db_def.type == 'postgresql') {
        result = await pg_sql(db_def,sql)
    }else if(db_def.type == 'sqlserver') {
        result = await ss_sql(db_def,sql)
    }
    return result
}

module.exports = sql_task
