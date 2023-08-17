# Formats for ETL files in the managed-data-assets repository
Multiple tasks can be in each file

Also see [Managed Data Assets README](https://github.com/cityofasheville/managed-data-assets/blob/production/README_file_formats.md)
## SQL
```
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
```
## Table Copy
```
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
      <OPTIONAL> "copy_since" : { (Only copy the latest data from a larger table.)
                    "num_weeks": 1,
                    "column_to_filter": "ACTIVITY_TIME"
                }
      "active": true
    }
  ]
}
```
### Table Copy Types

#### database
            "connection": "localss1",
            "schemaname": "dbo",
            "tablename": "testtable",
            __SOURCE OPTIONS__
            <OPTIONAL>: "tableheaders": true (this is mainly used for creating csv files)
            <OPTIONAL> "sortasc": "fieldname",
            <OPTIONAL> "sortdesc": "fieldname",
            <OPTIONAL> "fixedwidth_noquotes": true  (Tables converted to csv by default have strings with double quotes in the data quoted. For fixed width and XML files we don't want that)                               
            __TARGET OPTIONS__
            <OPTIONAL> "append": true  (By default, data is overwritten in table. Set to true to append as new rows.)       
            <OPTIONAL> "append_serial": "fieldname"  (Adds an integer auto-numbering key field to target table. A serial field with this name must appear as the last field in the target table.)

#### CSV -S3
            "connection": "s3_data_files",
            "filename": "users${YYYY}${MM}${DD}.csv",
            "path": "safetyskills/"

#### google_sheets
            "connection": "bedrock-googlesheets",
            "spreadsheetid": "9876234HIUFQER872345T",
            "range": 'Bad Actors!A5:B'
            __SOURCE OPTIONS__
            <OPTIONAL>: "append_asset_name": true (In the data an extra column is appended to each row with the name of the asset)
            __TARGET OPTIONS__
            <OPTIONAL> "append": true  (By default, data is overwritten in sheet. Set to true to append as new rows.)       
#### CSV -winshare
            "connection": "fileshare_g",
            "filepath": "/winshares/dont/work/on/lambda/(yet?)/data.csv",
            "headerrow": "2"



## File Copy
File copy can read and write from S3 and SFTP sites. Google Drive and maybe Windows fileshares to be added.
All locations have the same three fields: connection, filename, and path. Connections include a type field to distinguish S3 from SFTP, etc.
```
{
    "run_group": "daily",
    "tasks": [
        {
            "type": "file_copy",
            "source_location": {
                "connection": "",
                "filename": "",
                "path": ""
            },
            "target_location": {
                "connection": "",
                "filename": "",
                "path": ""
            },
            "active": true
        }
    ]
}
```

## Encrypt
Takes files from S3, encrypts them and writes them back to the same dir on S3.
```
    "run_group": "daily",
    "tasks": [
      {
        "type": "encrypt",
        "s3_connection": "s3_data_files",
        "path": "vendor/",
        "encrypt_connection": "vendor_ftp",
        "filename": "vendor_asheville_${YYYY}${MM}${DD}.csv",
        "encrypted_filename": "vendor_asheville_${YYYY}${MM}${DD}.csv.pgp",
        "active": true
      },
```

## SFTP
SFTP has mostly been superseded by file copy, which has more potential source and target destinations. It does include a few useful specialized FTP commands: list, delete, and getall
```
{
    "run_group": "daily",
    "tasks": [
      {
        "type": "sftp",
        "description": "Copy vendor S3 to FTP site",
        "action": "put",
        "s3_connection": "s3_data_files",
        "path": "telestaff-import-person/",
        "ftp_connection": "telestaff_ftp",
        "ftp_path": "/PROD/import/ongoing.unprocessed/",
        "filename": "vendor_asheville_${YYYY}${MM}${DD}.csv.pgp",
        "active": true
      }
    ]
}
// sftp actions can be one of these: (always include "type": "sftp", and "active": true too)
        {
            "action": "put",
            "s3_connection": "s3_data_files",
            "path": "telestaff-payroll-export/", 
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/person.errors/",
            "filename": "PD-220218-thu.csv"
        }

        {
            "action": "get",
            "s3_connection": "s3_data_files",
            "path": "telestaff-payroll-export/", 
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/person.errors/",
            "filename": "payroll-report-export.csv"
        }

        {
            "action": "list",
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/export/"
        }

        {
            "action": "del",
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/export/",
            "filename": "Yesterday.csv"
        }

        {
            "action": "getall",
            "s3_connection": "",
            "path": "", 
            "ftp_connection": "",
            "ftp_path": "/"
        }

```
## Run Lambda
Called Lambda must return standard format: ```{statusCode: 200,body: {lambda_output: ""}}```
```
{
    "run_group": "daily",
    "tasks": [
        {
            "type": "run_lambda",
            "lambda_arn": "arn:aws:lambda:us-east-1:acct:function:functionname",
            "otherparams: "params required by called lambda",
            "active": true
        }
    ]
}
```
Note: Running arbitrary code does mean that some Bedrock conventions can be bypassed. For example, normally an ETL job only creates one asset.
If your Lambda creates more than one asset, the work around we have used is to create the ETL job on one of the assets, and have the other ones depend on it.


## Aggregate
Aggregate task type takes multiple Google Sheets with data in the same format on each sheet and writes it to a single table.
It requires a staging table (called temp_table, but not a temp table in database terms) for the data to be collected in before writing to the final destination.
Each source spreadsheet tab has its own asset, and they share the data_connection and data_range, and have their own spreadsheetid's and tab names.

```
{
  "tasks": [
    {
      "type": "aggregate",
      "active": true,
      "source_location": {
        "temp_table": "nc_benchmarks_temp.lib", (name of the staging table asset)
        "aggregate": "nc_benchmarks",           (the aggregate name that matches a tag in each source sheet)
        "data_range": "A2:E",                   (all the sheets have to have the data in the same columns)
        "data_connection": "bedrock-googlesheets",
        "append_asset_name": true               (if true, each row of data has an additional column holding the name of the source asset)
      },
      "target_location": {
        "asset": "nc_benchmarks.lib"
      }
    }
  ]
}
```
Each aggregate source asset:
```
{
  "asset_name": "sog_billed_water_volume.ncb",
  "description": "Water SOG Benchmark: Billed Water Volume",
  "location": {
    "spreadsheetid": "1m2xD4JyH4BEBey_ybsEgrvYopsl0PjWNmY_PEv3l6D4",
    "tab": "billed_water_volume"
  },
  "active": true,
  "tags": [
    "nc_benchmarks"   (matches "source_location.aggregate" field in task)
  ]
}
```