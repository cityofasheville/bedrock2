
The data directory (src/db/bedrock-db-data/data) is the canonical store for all Bedrock assets.
Under data/, a subdir exists for each asset.

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

    - "depends" is an array of other asset_id which must be created before this asset can be created.

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
                <TYPE INFO, see below>
          },
          "target": {
                <TYPE INFO, see below>
          },
          "configuration": "null",
          "active": true
        }
      ]
  ```
  - ### TYPE INFO: Table Copy Types

  - #### Database
            "asset": "asset_name"
              __SOURCE OPTIONS__
              <OPTIONAL>: "tableheaders": true (include headers in data: this is mainly used for creating csv files)
              <OPTIONAL> "sortasc": "fieldname",
              <OPTIONAL> "sortdesc": "fieldname",
              <OPTIONAL> "fixedwidth_noquotes": true,  (Tables converted to csv by default have strings with double quotes in the data quoted. For fixed width and XML files we don't want that)
              <OPTIONAL> "crlf": true,                 (Tables converted to csv by default use record delimiters of LF. Set this true to use CRLF.)
              <OPTIONAL> "copy_since" : { (Only copy the latest data from a larger table.)
              "num_weeks": 1,
              "column_to_filter": "ACTIVITY_TIME"
              }  
              __TARGET OPTIONS__
              <OPTIONAL> "append": true  (By default, data is overwritten in table. Set to true to append as new rows.)       
              <OPTIONAL> "append_serial": "fieldname"  (Adds an integer auto-numbering key field to target table. A serial field with this name must appear as the last field in the target table.)

  - #### CSV -S3
            "asset": "asset_name"
              __SOURCE OPTIONS__
              <OPTIONAL>: "removeheaders": true (skip first row of csv file)
  - #### CSV -S3
            "asset": "asset_name"
              __SOURCE OPTIONS__
              <OPTIONAL>: "removeheaders": true (skip first row of csv file)

  - #### Google Sheets
            "asset": "asset_name"
              __SOURCE OPTIONS__
              <OPTIONAL>: "append_asset_name": true (In the data an extra column is appended to each row with the name of the asset)
              __TARGET OPTIONS__
              <OPTIONAL> "append": true  (By default, data is overwritten in sheet. Set to true to append as new rows.)       
  - #### Google Sheets
            "asset": "asset_name"
              __SOURCE OPTIONS__
              <OPTIONAL>: "append_asset_name": true (In the data an extra column is appended to each row with the name of the asset)
              __TARGET OPTIONS__
              <OPTIONAL> "append": true  (By default, data is overwritten in sheet. Set to true to append as new rows.)       


- ## File Copy
  File copy can read and write from S3, Windows file share, and SFTP sites. Google Drive to be added.
  All locations have the same three fields: connection, filename, and path. Connections include a type field to distinguish S3 from SFTP, etc.
  The option "adjustdate" on a target or source changes the filename created in fillDateTemplate by that number of days. (-1 means yesterday)
  ```
      "tasks": [
          {
              "type": "file_copy",
              "source": {
                  "asset": "asset_name",
                  <OPTIONAL>: "adjustdate": -1,
                  <OPTIONAL>: "config": {
                    <OPTIONAL>: "sort": "time",
                    <OPTIONAL>: "pick": -1,
                    <OPTIONAL>: "max_age": 23
                  }
              },
              "target": {
                  "asset": "asset_name"
                  <OPTIONAL>: "adjustdate": -1
              },
              "active": true
          }
      ]
  ```
The optional ```config``` member pertains only to an ```sftp``` source connection. For that case, if the ```filename``` parameter is enclosed in forward slashes (```/```), the name is interpreted as a regex expression that any file to be downloaded must match. The ```sort```, ```pick```, and ```max_age``` parameters in ```config``` select a final single file for download, as follows:
 - if ```max_age``` is greater than 0, it represents a maxiumum allowed age for files in hours (default is 60,000),
 - ```sort``` may be set to ```time``` or ```name``` (default is ```time```) and determines how the resulting list of files is sorted before applying the ```pick``` paramer,
 - ```pick``` can be ```first`` or 0 to pick the first value in the list, ```last``` or -1 to pick the last (default is -1) .

- ## Encrypt
  Takes files from S3, encrypts them and writes them back to the same dir on S3.
  ```
      "tasks": [
    {
      "type": "encrypt",
      "source": null,
      "target": {
        "path": "aip/",
        "type": "encrypt",
        "active": true,
        "filename": "CityofAsheville5871_To_InfoArmor_FULL_${YYYY}${MM}${DD}.txt",
        "s3_connection": "s3_data_files",
        "encrypt_connection": "aip_ftp",
        "encrypted_filename": "CityofAsheville5871_To_InfoArmor_FULL_${YYYY}${MM}${DD}"
      },
      "configuration": null
    }
      ]
  ```

- ## SFTP
  SFTP has mostly been superseded by file copy, which has more potential source and target destinations. It does include a few useful specialized FTP commands: list, delete, and getall
  ```
      "tasks": [
        {
          "type": "sftp",      
          "source": null,
          "target": {
            "description": "Copy vendor S3 to FTP site",
            "action": "put",
            "s3_connection": "s3_data_files",
            "path": "telestaff-import-person/",
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/import/ongoing.unprocessed/",
            "filename": "vendor_asheville_${YYYY}${MM}${DD}.csv.pgp",
            "active": true
          }
        }
      ]
  // sftp actions can be one of these: (always include "type": "sftp", and "active": true too)
- ## SFTP
  SFTP has mostly been superseded by file copy, which has more potential source and target destinations. It does include a few useful specialized FTP commands: list, delete, and getall

  // sftp actions can be one of these: (always include "type": "sftp", and "active": true too)
  ```
[
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

  ```
- ## Run Lambda
  Called Lambda must return standard format: ```{statusCode: 200,body: {lambda_output: ""}}```
  ```
      "tasks": [
          "target": {
              "type": "run_lambda",
              "lambda_arn": "arn:aws:lambda:us-east-1:acct:function:functionname",
              "otherparams: "params required by called lambda",
              "active": true
          }
      ]
  ```
  Note: Running arbitrary code does mean that some Bedrock conventions can be bypassed. For example, normally an ETL job only creates one asset.
  If your Lambda creates more than one asset, the work around we have used is to create the ETL job on one of the assets, and have the other ones depend on it.


- ## Aggregate
  Aggregate task type takes multiple Google Sheets with data in the same format on each sheet and writes it to a single table.
  It requires a staging table (called temp_table, but not a temp table in database terms) for the data to be collected in before writing to the final destination.
  Each source spreadsheet tab has its own asset, and they share the data_connection and data_range, and have their own spreadsheetid's and tab names.
- ## Aggregate
  Aggregate task type takes multiple Google Sheets with data in the same format on each sheet and writes it to a single table.
  It requires a staging table (called temp_table, but not a temp table in database terms) for the data to be collected in before writing to the final destination.
  Each source spreadsheet tab has its own asset, and they share the data_connection and data_range, and have their own spreadsheetid's and tab names.

  ```
    "tasks": [
      {
        "type": "aggregate",
        "active": true,
        "source": {
          "temp_table": "nc_benchmarks_temp.lib", (name of the staging table asset)
          "aggregate": "nc_benchmarks",           (the aggregate name that matches a tag in each source sheet)
          "data_range": "A2:E",                   (all the sheets have to have the data in the same columns)
          "data_connection": "bedrock-googlesheets",
          "append_asset_name": true               (if true, each row of data has an additional column holding the name of the source asset)
        },
        "target": {
          "asset": "nc_benchmarks.lib"
        }
      }
    ]
    
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
      "8723t4r8t"   (id that looks up to match "source.aggregate" field in task)
    ]
  }
  ``` 