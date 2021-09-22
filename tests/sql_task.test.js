
const sql_task = require('../bedrock/aws/lambda_functions/etl_task_sql/pg_sql')
require('dotenv').config()

async function run(){
    try {
        let connection, sql, result

        connection = {
            host: process.env.host,
            port: process.env.port,
            user: process.env.username,
            password: process.env.password,
            database: process.env.database,
        }
        sql = `
        insert into testtable(a,b,c,d) values (random(),array_to_string(
        ARRAY (
        SELECT substring(
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' 
        FROM (random() *36)::int FOR 1)
        FROM generate_series(1, 12) ), '' ) ,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`
        for(let x=0;x<1000;x++){
            result = await sql_task(connection,sql)
            console.log("rowCount: ",result)
        }
    } catch(err) {
        console.log(err)
    }
}
run()