# Formats for ETL files in the managed-data-assets repository
Multiple tasks can be in each file

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
      "active": true
    }
  ]
}
```
### Table Copy Types

#### database
            "connection": "localss1",
            "schemaname": "dbo",
            "tablename": "testtable"
            <OPTIONAL> "append_serial": "objectid"
            <OPTIONAL> "sortasc": "fieldname",
            <OPTIONAL> "sortdesc": "fieldname",
            <OPTIONAL> "fixedwidth_noquotes": true                                  

#### CSV -S3
            "connection": "s3_data_files",
            "filepath": "/tmp/data.csv",
            "headerrow": 1

#### google_sheets
            "connection": "bedrock-googlesheets",
            "spreadsheetid": "9876234HIUFQER872345T",
            "range": 'Bad Actors!A5:B'
            
#### CSV -winshare
            "connection": "fileshare_g",
            "filepath": "/winshares/dont/work/on/lambda/(yet?)/data.csv",
            "headerrow": "2"



## Table Copy Since
```
{
    "run_group": "daily",
    "tasks": [
        {
            "type": "table_copy",
            <ALL THE TABLE COPY FIELDS>
            "num_weeks": 78,
            "column_to_filter": "ins_date"
        }
    ]
}
```
## SFTP
```
{
    "run_group": "daily",
    "tasks": [
      {
        "type": "encrypt",
        "s3_connection": "s3_data_files",
        "s3_path": "vendor/",
        "ftp_connection": "vendor_ftp",
        "filename": "vendor_asheville_${YYYY}${MM}${DD}.csv",
        "encrypted_filename": "vendor_asheville_${YYYY}${MM}${DD}.csv.pgp",
        "active": true
      },
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
## No-op
```
{
    "run_group": "daily",
    "tasks": [
        {
            "type": "noop",
            "active": true
        }
    ]
}
```