# bedrock_common

Bedrock Common is a set of modules for shared code. It is deployed as Lambda Layers, so it is required for all Lambdas and must be deployed first.
It includes all the packages used by all the Lambdas as well as custom shared functions, such as getDBConnection.

## common
This module includes the bedrock_common module and most of the packages used by the Lambdas.

## table_copy
The table_copy module uses these additional packages.