import boto3
import botocore
import os
import json

from ..utilities.construct_sql import sql_column
from ..utilities.sql import execute_sql_statement_with_return

def list_blueprints(s3, bucket_name, prefix):
    objs = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)["Contents"]
    blist = []
    for obj in objs:
        nm = obj["Key"].split("/")[-1] # Remove the leading directories
        blist.append(nm[0:-5]) # Remove the trailing .json
    return blist

def get_blueprint(s3, bucket_name, blueprint_name, tmpfilepath):
    try:
        s3.download_file(bucket_name, blueprint_name, tmpfilepath)
    except botocore.exceptions.ClientError as error:
        if error.response["Error"]["Code"] == "404":
            return None
    bp = {}
    with open(tmpfilepath, "r") as file_content:
        bp = json.load(file_content)
    os.remove(tmpfilepath)
    return bp

def create_table_from_blueprint(blueprint, table_name, dbtype = "postgresql"):
    if dbtype != "postgresql":
        raise Exception("create_table_from_blueprint: " + dbtype + " not yet implemented")
    sql = "CREATE TABLE " + table_name + " ("
    for i in range(len(blueprint["columns"])):
        is_last = (i == len(blueprint['columns']) - 1)
        sql = sql + sql_column(blueprint["columns"][i], is_last, dbtype)
    sql = sql + " )"
    return sql

def columns_from_table(bedrock_connection, cdefs):
    type_map = {
        "character varying": "string",
        "varchar": "string",
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
        "time without time zone": "time"
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

def create_table_info_sql(bedrock_connection, schema, table):
    if bedrock_connection["type"] == "postgresql":
        sql = """
                SELECT column_name, is_nullable, data_type,
                    character_maximum_length, numeric_precision, numeric_precision_radix, numeric_scale, ordinal_position
                FROM information_schema.columns """
        sql = sql + "WHERE table_name = '" + table + "' AND table_schema = '" + schema + "' ORDER BY ordinal_position ASC"
    elif bedrock_connection["type"] == "sqlserver":
        sql = """
            SELECT 
                COLUMN_NAME as column_name,
                IS_NULLABLE as is_nullable,
                DATA_TYPE as data_type,
                CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
                NUMERIC_PRECISION as numeric_precision,
                NULL as numeric_precision_radix,
                NUMERIC_SCALE as numeric_scale,
                ORDINAL_POSITION as ordinal_position
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '"""
        sql = sql + table + "' AND TABLE_SCHEMA = '" + schema + "' ORDER BY ORDINAL_POSITION ASC"
    return sql

def create_blueprint_from_table(bedrock_connection, blueprint_name, table_name):
    if len(table_name.split('.')) != 2:
        print("Tablename " + table_name + " not valid - must be in the form SCHEMA.TABLENAME")
        return None
    schema, table = table_name.split('.')
    sql = create_table_info_sql(bedrock_connection, schema, table)
    res = execute_sql_statement_with_return(bedrock_connection, sql)
    blueprint = {
        "name": blueprint_name,
        "description": "TBD",
        "columns": columns_from_table(bedrock_connection, res)
    }
    fname = "./" + blueprint_name + ".1.0.json"
    with open(fname, 'w') as f:
        f.write(json.dumps(blueprint, indent = 4)+ "\n")
    print("Blueprint written to " + fname)
    return blueprint
