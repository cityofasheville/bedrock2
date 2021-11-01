import os
import boto3
import botocore
import json
import sys
import getopt

from .utilities.print import print_list_in_columns
from .utilities.connections import get_connection
from .blueprint.blueprint import get_blueprint, list_blueprints, create_blueprint_from_table, create_table_from_blueprint
from .utilities.sql import execute_sql_statement
    # @ex(
    #     help="Create a blueprint, possibly based on a table",

    #     arguments=[
    #         ### create-table command help
    #         ( [ "-b", "--blueprint"],
    #           { "help": "blueprint name"} ),
    #         ( [ "-c", "--connection" ],
    #           { "help": "connection name"} ),
    #         ( [ "-t", "--table" ],
    #           { "help": "table name in form schema.tablename"} )
    #     ],
    # )

bucket_name = os.getenv("BEDROCK_BUCKETNAME")
tmpfilepath = os.getenv("BEDROCK_TMPFILE_DIR", ".") + "/" + os.getenv("BEDROCK_TMPFILE_NAME", "tmp.json")

s3 = boto3.client("s3")

if bucket_name is None:
    print("You must set the BEDROCK_BUCKETNAME environment variable to the appropriate bucket name.")
    return -1
blueprint_name = self.app.pargs.blueprint
if blueprint_name is None:
    print("You must set a blueprint name with the -b option.")
    return -1

blueprint = {
    "name": blueprint_name,
    "description": "TBD",
    "columns": []
}

if self.app.pargs.table is not None: # Looks like we are deriving from an existing table or view
    connection = get_connection(self.app.pargs.connection, bucket_name, s3, tmpfilepath)
    if connection == None:
        return -1
    blueprint = create_blueprint_from_table(connection, blueprint_name, self.app.pargs.table)

fname = "./" + blueprint_name + ".1.0.json"
with open(fname, 'w') as f:
    f.write(json.dumps(blueprint, indent = 4)+ "\n")
print("Blueprint written to " + fname)
