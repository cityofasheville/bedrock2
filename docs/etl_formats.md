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
            <OPTIONAL> "append_serial": "fieldname"  (Adds an integer auto-numbering key field to target table. A serial field with this name must appear as the last field in the target table.)

#### CSV -S3
            "connection": "s3_data_files",
            "filename": "users${YYYY}${MM}${DD}.csv",
            "s3_path": "safetyskills/"

#### google_sheets
            "connection": "bedrock-googlesheets",
            "spreadsheetid": "9876234HIUFQER872345T",
            "range": 'Bad Actors!A5:B'
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
        "s3_path": "vendor/",
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
        "s3_path": "telestaff-import-person/",
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
            "s3_path": "telestaff-payroll-export/", 
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/person.errors/",
            "filename": "PD-220218-thu.csv"
        }

        {
            "action": "get",
            "s3_connection": "s3_data_files",
            "s3_path": "telestaff-payroll-export/", 
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
            "s3_path": "", 
            "ftp_connection": "",
            "ftp_path": "/"
        }

```
## Run Lambda
Note: Called Lambda must return standard format: ```{statusCode: 200,body: {lambda_output: ""}}```
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
