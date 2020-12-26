from cement import Controller, ex
import os
import boto3
import botocore
import json
import sys

from ..src.utilities.print import pretty_print_list
from ..src.utilities.connections import get_connections
from ..src.blueprint.blueprint import get_blueprint, list_blueprints, create_table_from_blueprint
from ..src.utilities.sql import execute_sql_statement

class BedrockBlueprint(Controller):
    class Meta:
        label = "blueprint"
        stacked_type = "nested"
        stacked_on = "base"
    
    @ex(
        help="Create a table based on a blueprint",

        arguments=[
            ### create-table command help
            ( [ "-b", "--blueprint"],
              { "help": "blueprint name"} ),
            ( [ "-c", "--connection" ],
              { "help": "connection name"} ),
            ( [ "-t", "--table" ],
              { "help": "table name in form schema.tablename"} )
        ],
    )

    def create_table(self):
        bucket_name = os.getenv("BEDROCK_BUCKETNAME")
        prefix = "run/"
        tmpfilepath = "./tmp.json"
        connections = {}
        s3 = boto3.client("s3")

        if bucket_name is None:
            print("You must set the BEDROCK_BUCKETNAME environment variable to the appropriate bucket name.")
            return -1

        # Get the list of possible connections, then make sure we have chosen one.
        connections = get_connections(s3, bucket_name, tmpfilepath)
        if self.app.pargs.connection is None or self.app.pargs.connection not in connections:
            print("A connection name is required. Must be one of the following:")
            pretty_print_list(list(connections.keys()))
            return -1
        connection = connections[self.app.pargs.connection]

        # Download the blueprint
        blueprint_name = self.app.pargs.blueprint
        blueprint = None
        if blueprint_name is not None:
            blueprint = get_blueprint(s3, bucket_name, "store/blueprints/" + blueprint_name + ".json", tmpfilepath)
        if blueprint is None:
            blueprints = list_blueprints(s3, bucket_name, "store/blueprints/")
            print("Blue print " + (blueprint_name if blueprint_name is not None else "")  + " not found. Must be one of the following:")
            pretty_print_list(blueprints)
            return -1

        if self.app.pargs.table is None or len(self.app.pargs.table.split(".")) != 2:
            print("A table name of the form SCHEMA.TABLENAME is required - exiting")
            return -1

        sql = create_table_from_blueprint(blueprint, self.app.pargs.table)
        execute_sql_statement(connection, sql)
        pass

    
    @ex(
        help="create blueprint",

        arguments=[
            ### preprocess assets command help
            ( [ "-n", "--name" ],
              { "help" : "bedrock blueprint create -n NAME: Create a blueprint with name NAME" } ),
        ],
    )
    def create(self):
        print(self.app.pargs)