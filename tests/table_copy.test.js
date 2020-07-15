
const table_copy = require('../scripts/task_runners/table_copy/index')
const db_defs = require('./test_connections')

async function run(){
    let etl
    etl = {
        source_location: {
            type: "database",
            connection: "localss1",
            schemaname: "dbo",
            tablename: "testtable",  

        },
        target_location: {
            type: "database",
            connection: "localpg1",
            schemaname: "public",
            tablename: "testtable",
        }
    }

    await table_copy(db_defs,etl)


    etl = {
        source_location: {
            type: "database",
            connection: "localpg1",
            schemaname: "public",
            tablename: "testtable",  

        },
        target_location: {
            type: "database",
            connection: "localpg2",
            schemaname: "public",
            tablename: "testtable",
        }
    }

    await table_copy(db_defs,etl)
}
run()