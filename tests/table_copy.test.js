
const table_copy = require('../scripts/table_copy/index')
const db_defs = require('./test_connections')

async function run(){
    let etl
    etl = {
        type: "table_copy",
        source_location: {
            type: "database",
            db: "localss1",
            schemaname: "dbo",
            tablename: "testtable",  
        },
        target_location: {
            type: "database",
            db: "localpg1",
            schemaname: "public",
            tablename: "testtable",
        },
        active: true
    }

    await table_copy(db_defs,etl)


    etl = {
        type: "table_copy",
        source_location: {
            type: "database",
            db: "localpg1",
            schemaname: "public",
            tablename: "testtable",  

        },
        target_location: {
            type: "database",
            db: "localpg2",
            schemaname: "public",
            tablename: "testtable",
        },
        active: true
    }

    await table_copy(db_defs,etl)
}
run()