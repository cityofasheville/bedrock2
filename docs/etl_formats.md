
The data directory (src/db/bedrock-db-data/data) contains files that builds example data sources when ```make seed``` is run in the db dir.
Under data/, a subdir exists for each asset.
The canonical store for all Bedrock assets is now in a separate repo: managed-data-assets

# Asset File
- The **Asset** json file is shaped like this:
```
{
  "asset_id": "37bd47b12b6df817558a",
  "asset_name": "asset name",
  "description": "description",
  "location": {
    "path": "/AclaraAccountImportFiles/",
    "filename": "AccountImport.imp",
    "connection_id": "f9e12c45b170aa20733a"
  },
  "asset_type_id": "6145ff5349087fc33784",
  "owner_id": null,
  "notes": null,
  "link": null,
  "active": true,
  "custom_fields": {
    "d4171104f6b6116c4e87": "Hogshead per fortnight"
  },
  "depends": [
    "1de0c036af9e0c437c94"
  ],
  "tags": []
}
```

```"depends"``` is an array of other asset_id which must be created before this asset can be created.

  - ## Connection Classes
    - Depending on the type of asset, there can be different required fields in 'locations':
    - Each location will have the field "connection_id". This is a lookup for the secrets needed to retrieve the data, such as database passwords.
      - Database (SQL Server or Postgres)
        - "tablename": "base_employee",
        - "connection_id": "munis/munprod/fme_jobs",
        - "schemaname": "dbo"
      - File (SFTP, S3, or Windows File Share)
        - "path": "/AclaraAccountImportFiles/",
        - "filename": "AccountImport.imp",
        - "connection_id": "aclara_ftp"
      - Google Sheet
        - "tab": "Vendors",
        - "range": "A2:Z",
        - "filename": "abi_vendors",
        - "connection_id": "bedrock-googlesheets",
        - "spreadsheetid": "1lm_LdZS6yxxxvdD7ACU8Eo_pCkmNr81TvA"
      - API
        - "connection_id": "acumen_api"
    
  - ## Filenames: fillDateTemplate
    - Wherever filenames are used, they can include template strings.
    - When these are found in a filename, they are replaced at runtime with the current date.
      - ${YYYY}
      - ${MM}
      - ${DD}
    - It is also possible to use the 'adjustdate' option to use yesterday's date, or another number of days away from today. (file_copy only)

# ETL file
- Not every asset has an associated ETL job. If it does, another file will be in the same dir, with the same name, with the .ETL.json extension.
- **ETL** file example.
 
    ```
    {
      "asset_name": "ad_info.lib",
      "asset_id": "46377fb6749aeab04e7f",
      "run_group_id": "7d27de8121bfc20e543b",
      "active": true,
      "tasks": [
        {
          "task_id": "ea29ad0f90fdd7ea0851",
          "asset_id": "46377fb6749aeab04e7f",
          "seq_number": 0,
          "description": null,
          "type": "table_copy",
          "email": "only_on_error", (OPTIONAL)
          "active": true,
          "source": {
            "asset": "ad_info.mun"
          },
          "target": {
            "asset": "ad_info.lib"
          },
          "configuration": null
        }
      ]
    }
    ```

    - run_group_id looks up the run group to tell Bedrock when to run the ETL task.
    - The ETL job can have multiple tasks. For example, it might copy a table and then run an SQL script.
    - The "email": "only_on_error" flag means that if the task is successful, there is no need to send an email. (By default an email is sent for every set of tasks run.) If there are tasks without the flag run at the same time, the email will be sent.

## ETL Task Types
  The fields source, target, and configuration are used differently for different task types
- ## SQL
  ```
      "tasks": [
        {
          "type": "sql",
          "source": null,
          "target": {
            "connection": "pubrecdb1/mdastore1/dbadmin"
          },
          "configuration": "select * from foo",
        }
      ]
  ```
- ## Table Copy
  ```
      "tasks": [
        {
          "type": "table_copy",
          "source": {
            "asset": "assetname.mun",
            __SOURCE OPTIONS__
          },
          "target": {
            "asset": "assetname.s3",
            __TARGET OPTIONS__
          },
          "configuration": null
        }
      ]
  ```
  - ### TYPE INFO: Table Copy Types

#### database
            __SOURCE OPTIONS__
            <OPTIONAL>: "tableheaders": true (include headers in data: this is mainly used for creating csv files)
            <OPTIONAL> "sortasc": "fieldname",
            <OPTIONAL> "sortdesc": "fieldname",
            <OPTIONAL> "fixedwidth_noquotes": true,  (Tables converted to csv by default have strings with double quotes in the data quoted. For fixed width and XML files we don't want that)
            <OPTIONAL> "crlf": true,                 (Tables converted to csv by default use record delimiters of LF. Set this true to use CRLF.)    
            __TARGET OPTIONS__
            <OPTIONAL> "append": true  (By default, data is overwritten in table. Set to true to append as new rows.)       
            <OPTIONAL> "append_serial": "fieldname"  (Adds an integer auto-numbering key field to target table. A serial field with this name must appear as the last field in the target table.)

#### CSV -S3
            __SOURCE OPTIONS__
            <OPTIONAL>: "removeheaders": true (skip first row of csv file)

#### google_sheets
            __SOURCE OPTIONS__
            <OPTIONAL>: "append_asset_name": true (In the data an extra column is appended to each row with the name of the asset)
            __TARGET OPTIONS__
            <OPTIONAL> "append": true  (By default, data is overwritten in sheet. Set to true to append as new rows.)       


## File Copy
File copy can read and write from S3, Windows file share (SMB), and SFTP sites. Google Drive to be added.
```
      "tasks": [
        {
          "type": "file_copy",
          "source": {
            "asset": "assetname.ftp",
            __OPTIONS__
          },
          "target": {
            "asset": "assetname.s3",
            __OPTIONS__
          },
          "configuration": null
        }
      ]

      __OPTIONS__ Both source and target can have this option
            <OPTIONAL>: "adjustdate": -1

      The option "adjustdate" on a target or source changes the filename created in fillDateTemplate by that number of days. (-1 means yesterday)
```

## Encrypt
Takes files from S3, encrypts them and writes them back to the same dir on S3.
```
    "tasks": [
      {
        "type": "encrypt",
        "source": null,
        "target": {
          "s3_connection": "s3_data_files",
          "path": "vendor/",
          "encrypt_connection": "vendor_ftp",
          "filename": "vendor_asheville_${YYYY}${MM}${DD}.csv",
          "encrypted_filename": "vendor_asheville_${YYYY}${MM}${DD}.csv.pgp"
        },
        "configuration": null
      },
      "configuration": null
    }
      ]
  ```

## SFTP
SFTP has mostly been superseded by file copy, which has more potential source and target destinations. It does include a few useful specialized FTP commands: list, delete, and getall
```
    "tasks": [
      {
        "type": "encrypt",
        "source": null,
        "target": {
          "action": "sftp_action",
          "s3_connection": "s3_data_files",
          "path": "vendor/",
          "ftp_connection": "telestaff_ftp",
          "ftp_path": "/PROD/import/ongoing.unprocessed/",
          "filename": "vendor_asheville_${YYYY}${MM}${DD}.csv.pgp"
        },
        "configuration": null
      },
    ]

// sftp actions can be one of these: (always include "type": "sftp", and "active": true too)
        {
          "type": "sftp",      
          "source": null,
          "target": {
            "description": "Copy vendor S3 to FTP site",
            "action": "put",
            "s3_connection": "s3_data_files",
            "path": "telestaff-import-person/",
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
      "source": null,
      "target": {
        "type": "run_lambda",
        "active": true,
        "lambda_arn": "arn:aws:lambda:us-east-1:acct:function:functionname",
      },
      "configuration": null
```
Note: Running arbitrary code does mean that some Bedrock conventions can be bypassed. For example, normally an ETL job only creates one asset.
If your Lambda creates more than one asset, the work around we have used is to create the ETL job on one of the assets, and have the other ones depend on it.


## Aggregate
Aggregate task type takes multiple Google Sheets with data in the same format on each sheet and writes it to a single table.
It requires a staging table (called temp_table, but not a temp table in database terms, you will need to create a table with that name) for the data to be collected in before writing to the final destination.
Each source spreadsheet tab has its own asset, and they share the data_connection and data_range, and have their own spreadsheetid's and tab names.

```
{
  "tasks": [
    "target": {
      "action": "put",
      "s3_connection": "s3_data_files",
      "path": "telestaff-payroll-export/", 
      "ftp_connection": "telestaff_ftp",
      "ftp_path": "/PROD/person.errors/",
      "filename": "PD-220218-thu.csv"
    },
    "target": {
      "action": "get",
      "s3_connection": "s3_data_files",
      "path": "telestaff-payroll-export/", 
      "ftp_connection": "telestaff_ftp",
      "ftp_path": "/PROD/person.errors/",
      "filename": "payroll-report-export.csv"
    },
    "target": {
      "action": "list",
      "ftp_connection": "telestaff_ftp",
      "ftp_path": "/PROD/export/"
    },
    "target": {
      "action": "del",
      "ftp_connection": "telestaff_ftp",
      "ftp_path": "/PROD/export/",
    },
    "target": {
      "action": "getall",
      "s3_connection": "",
      "path": "", 
      "ftp_connection": "",
      "ftp_path": "/"
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
    "connection_id": "76085554183a536a7fae",
    "tab": "billed_water_volume"
  },
  "active": true,
  "tags": [
    "nc_benchmarks"   (matches "source_location.aggregate" field in task)
  ]
}
```
