
const sql_task = require('../index')

async function run(){
    try {
        let etl, sql, result

        // etl = {
        //     type: 'sql',
        //     file: "insertdata.sql",
        //     db: "localss1",
        //     active: "true"
        // }
        // sql = "insert into testtable(a,b,c,d) values (33.3,'NEW data',GETDATE(),GETDATE())"

        // result = await sql_task(sql,etl)
        // console.log(result)

        etl = {
            type: 'sql',
            file: "insertdata.sql",
            db: "localpg1",
            active: "true"
        }
        sql = `
        insert into testtable(a,b,c,d) values (random(),array_to_string(
        ARRAY (
        SELECT substring(
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' 
        FROM (random() *36)::int FOR 1)
        FROM generate_series(1, 12) ), '' ) ,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`
        for(let x=0;x<1000;x++){
            result = await sql_task(sql,etl)
            console.log("rowCount: ",result)
        }
    } catch(err) {
        console.log(err)
    }
}
run()