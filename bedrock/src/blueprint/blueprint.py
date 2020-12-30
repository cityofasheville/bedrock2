import boto3
import botocore
import os
import json

from ..utilities.sql import execute_sql_statement_with_return
from ..utilities.construct_sql import get_table_info_sql
from ..utilities.constants import BLUEPRINTS_PREFIX
from ..utilities.print import print_list_in_columns

def list_blueprints(s3, bucket_name, prefix):
    objs = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)["Contents"]
    blist = []
    for obj in objs:
        nm = obj["Key"].split("/")[-1] # Remove the leading directories
        blist.append(nm[0:-5]) # Remove the trailing .json
    return blist

def get_blueprint(blueprint_name, bucket_name, s3, tmpfilepath):
    blueprint = None
    if blueprint_name is not None:
        try:
            s3.download_file(bucket_name, BLUEPRINTS_PREFIX + blueprint_name + ".json", tmpfilepath)
            with open(tmpfilepath, "r") as file_content:
                blueprint = json.load(file_content)
            os.remove(tmpfilepath)
        except botocore.exceptions.ClientError as error:
            blueprint = None

        if blueprint is None:
            print("\nBlue print " + blueprint_name  + " not found. Must be one of:\n")
    else:
        print("You must specify a blueprint using the -b option. Must be one of:")

    if blueprint is None:
        blueprints = list_blueprints(s3, bucket_name, BLUEPRINTS_PREFIX)
        print_list_in_columns(blueprints)

    return blueprint

def columns_from_table(bedrock_connection, cdefs):
    type_map = {
        "character varying": "string",
        "varchar": "string",
        "text": "string",
        "character": "character",
        "integer": "integer",
        "int": "integer",
        "bigint": "bigint",
        "smallint": "smallint",
        "boolean": "boolean",
        "double precision": "double",
        "real": "float",
        "numeric": "decimal",
        "timestamp without time zone": "datetime",
        "datetime": "datetime",
        "date": "date",
        "time without time zone": "time",
        "bytea": "binary",
        "USER-DEFINED": "UNKNOWN"
    }
    columns = []
    for i in range(len(cdefs)):
        name, nullable, in_type, in_length, in_precision, in_radix, in_scale, ord = cdefs[i]
        col = {
            "name": name,
            "description": "TBD",
            "type": None,
        }
        if in_type not in type_map:
            raise Exception("ERROR: Unknown column type " + in_type + " for column " + name)
        col["type"] = type_map[in_type]
        if nullable == "NO":
            col["nullable"] = False
        if in_type in ("character varying", "character", "varchar"):
            col["length"] = in_length
        if in_type == "numeric":
            col["precision"] = str(in_precision) + "," + str(in_scale)
            
        columns.append(col)
    return columns

def create_blueprint_from_table(bedrock_connection, blueprint_name, table_name):
    if len(table_name.split('.')) != 2:
        print("Tablename " + table_name + " not valid - must be in the form SCHEMA.TABLENAME")
        return None
    schema, table = table_name.split('.')
    sql = get_table_info_sql(bedrock_connection, schema, table)
    res = execute_sql_statement_with_return(bedrock_connection, sql)
    if len(res) == 0:
        raise Exception("Table " + table_name + " not found.")
    blueprint = {
        "name": blueprint_name,
        "description": "TBD",
        "columns": columns_from_table(bedrock_connection, res)
    }
    return blueprint
