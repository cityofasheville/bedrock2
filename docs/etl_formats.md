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
      "type": "table_copy",
      "source_location": {
            <TYPE INFO, see below>
      },
      "target_location": {
            <TYPE INFO, see below>
      },
      "active": true
  }
  ]
}

### Table Copy Types

#### database
            "connection": "localss1",
            "schemaname": "dbo",
            "tablename": "testtable"

#### CSV -S3
            "connection": "s3_data_files",
            filepath: "/tmp/data.csv",
            headerrow: 1

#### google_sheets
            connection: "bedrock-googlesheets",
            spreadsheetid: "9876234HIUFQER872345T",
            range: 'Bad Actors!A5:B'
            
#### CSV -winshare
            connection: "fileshare_g",
            filepath: "/winshares/dont/work/on/lambda/(yet?)/data.csv",
            headerrow: "2"



## Table Copy Since

{
    "run_group": "daily",
    "tasks": [
        {
            "type": "table_copy_since",
            "source_location": {
                "type": "database",
                "db": "localss1",
                "schemaname": "dbo",
                "tablename": "testtable"
            },
            "target_location": {
                "type": "database",
                "db": "localpg1",
                "schemaname": "public",
                "tablename": "testtable"
            },
            "num_weeks": 78,
            "column_to_filter": "ins_date",
            "active": true
        }
    ]
}

## SFTP

{
    "run_group": "daily",
    "tasks": [
        {
            "type": "sftp",
            "direction": "download",
            "location": "ftpsite",  //This would link to bedrock_connections.json, where it would have passwords or keyfiles
            "directory": "/export/",
            "remotefile": "*.csv",
            "deleteremote": "true",
            "localfile":  {
                s3: "bedrock-data-files",
                filepath: "/tmp/data.csv"
            },
            "active": true
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
