# Formats for ETL files in the managed-data-assets repository
Multiple tasks can be in each file

## SQL

{
    "run_group": "daily",
    "tasks": [
        {
            "type": "sql",
            "file": "1-coa_bc_address_master_base.sql",
            "db": "datastore1",
            "active": true
        }
    ]
}

## Table Copy

{
    "run_group": "daily",
    "tasks": [
        {
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
    ]
}

## No-op

{
"run_group": "daily",
    "tasks": [
        {
            "type": "noop",
            "active": true
        }
    ]
}
