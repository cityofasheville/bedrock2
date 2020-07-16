const pg_sql = require('./pg_sql');
const ss_sql = require('./ss_sql');

async function sql_task(db_defs,sql,etl){
    let result
    let location = etl.location
    let db_def = db_defs[location.connection]

    console.log(location)
    
    if(location.type == 'postgresql') {
        result = await pg_sql(db_def,sql)
    }else if(location.type == 'sqlserver') {
        result = await ss_sql(db_def,sql)
    }
    return result
}

module.exports = sql_task
