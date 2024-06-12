# bedrock_common

Bedrock Common is a set of modules for shared code. It is deployed as Lambda Layers, so it is required for all Lambdas and must be deployed first.
It includes all the packages used by all the Lambdas as well as custom shared functions, such as getDBConnection.

## bedrock_common
Custom functions. 

## packages
Most of the packages used by the ETL and API Lambdas.

## table_copy and encrypt
Etl_task_table_copy and etl_task_encrypt have their own layers.