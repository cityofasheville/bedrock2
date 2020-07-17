
const sql_task = require('../scripts/task_runners/sql_task/index')
const db_defs = require('./test_connections')

async function run(){
    let etl, sql, result

    etl = {
        type: 'sql',
        file: "insertdata.sql",
        db: "localss1",
        active: "true"
    }
    sql = "insert into testtable(a,b,c,d) values (33.3,'NEW data',GETDATE(),GETDATE())"

    result = await sql_task(db_defs,sql,etl)
    console.log(result)

    etl = {
        type: 'sql',
        file: "insertdata.sql",
        db: "localpg1",
        active: "true"
    }
    sql = "insert into testtable(a,b,c,d) values (33.3,'NEW data',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"

    result = await sql_task(db_defs,sql,etl)
    console.log(result)

}
run()