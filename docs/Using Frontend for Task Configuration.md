# Configuring ETL tasks in the frontend
Assets can have ETL task associated with them. Each type of task has different configuration parameters in the three fields: Source, Target, and Configuration. Source and Target are formatted as JSON objects, and Configuration is a text field.


## Standard Fields
| Task Type| Source                       | Target                             | Configuration  |
|----------|------------------------------|------------------------------------|--------------- |
|table_copy|{"asset": "source_asset_name"}|{"asset": "target_asset_name"}      |null            |
|file_copy |{"asset": "source_asset_name"}|{"asset": "target_asset_name"}      |null            |
|sql       |null                          |{"connection":"connection_name"}    |SELECT * FROM x;|
|run_lambda|null                          |{"lambda_arn": "arn:aws:lambda:..."}|null            |
|aggregate |{"aggregate": "aggr_name", "data_range": "A3:B", "temp_table": "assetname_temp", "append_tab_name": true, "data_connection": "bedrock-googlesheets"}|{"asset": "maintenance_responsibilities.lib"}|null|


### OPTIONAL fields
#### Table_Copy
##### database
      __SOURCE OPTIONS__
      <OPTIONAL>: "tableheaders": true (include headers in data: this is mainly used for creating csv files)
      <OPTIONAL> "sortasc": "fieldname",
      <OPTIONAL> "sortdesc": "fieldname",
      <OPTIONAL> "fixedwidth_noquotes": true,  (Tables converted to csv by default have strings with double quotes in the data quoted. For fixed width and XML files we don't want that)
      <OPTIONAL> "crlf": true,                 (Tables converted to csv by default use record delimiters of LF. Set this true to use CRLF.)    
      __TARGET OPTIONS__
      <OPTIONAL> "append": true  (By default, data is overwritten in table. Set to true to append as new rows.)       
      <OPTIONAL> "append_serial": "fieldname"  (Adds an integer auto-numbering key field to target table. A serial field with this name must appear as the last field in the target table.)

##### CSV -S3
      __SOURCE OPTIONS__
      <OPTIONAL>: "removeheaders": true (skip first row of csv file)

##### google_sheets
      __SOURCE OPTIONS__
      <OPTIONAL>: "append_asset_name": true (In the data an extra column is appended to each row with the name of the asset)
      __TARGET OPTIONS__
      <OPTIONAL> "append": true  (By default, data is overwritten in sheet. Set to true to append as new rows.)       


#### File Copy
      __OPTIONS__ Both source and target can have this option
            <OPTIONAL>: "adjustdate": -1

      The option "adjustdate" on a target or source changes the filename created in fillDateTemplate by that number of days. (-1 means yesterday)


## File Types
Bedrock ETL works mainly with CSV files, but other types are supported.
### Table Copy
When copying from a database to S3 files, XML and fixed width files can be created in source databases as views. XML is passed into Bedrock as a one column, one row table, and fixed width appears as one column and multiple rows. Either way you probably want to include the ```fixedwidth_noquotes: true``` flag in the source options. 

### File Copy
Other text file formats and binary files can be copied.