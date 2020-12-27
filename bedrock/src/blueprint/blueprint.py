import boto3
import botocore
import os
import json
import psycopg2

from ..utilities.construct_sql import sql_column

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
    sql = "CREATE TABLE " + table_name + " ("
    for i in range(len(blueprint["columns"])):
        is_last = (i == len(blueprint['columns']) - 1)
        sql = sql + sql_column(blueprint["columns"][i], is_last, dbtype)
    sql = sql + " )"
    return sql

def columns_from_pg_table(cdefs):
    columns = []
    for i in range(len(cdefs)):
        name, nullable, in_type, in_length, in_precision, in_radix, in_scale, ord = cdefs[i]
        col = {
            "name": name,
            "description": "TBD",
            "type": None,
            "nullable": True if nullable != "NO" else False
        }
        if in_type == "character varying":
            col["type"] = "string"
            col["length"] = in_length
        elif in_type == "character":
            col["type"] = in_type
            col["length"] = in_length
        elif in_type == "integer":
            col["type"] = "integer"
        elif in_type == "bigint":
            col["type"] = "bigint"
        elif in_type == "smallint":
            col["type"] = "smallint"
        elif in_type == "boolean":
            col["type"] = "boolean"
        elif in_type == "double precision":
            col["type"] = "double"
        elif in_type == "real":
            col["type"] = "float"
        elif in_type == "numeric":
            col["type"] = "decimal"
            col["precision"] = str(in_precision) + "," + str(in_scale)
        elif in_type == "timestamp without time zone":
            col["type"] = "datetime"
        elif in_type == "date":
            col["type"] = "date"
        elif in_type == "time without time zone":
            col["type"] = "time"
        else:
            raise Exception("ERROR: Unknown column type " + in_type + " for column " + name)
        columns.append(col)
    return columns

def create_blueprint_from_table(bedrock_connection, blueprint_name, table_name):
    if len(table_name.split('.')) != 2:
        print("Tablename " + table_name + " not valid - must be in the form SCHEMA.TABLENAME")
        return None
    schema, table = table_name.split('.')
    sql = """
            SELECT column_name, is_nullable, data_type,
                character_maximum_length, numeric_precision, numeric_precision_radix, numeric_scale, ordinal_position
            FROM information_schema.columns """
    sql = sql + "WHERE table_name = '" + table + "' AND table_schema = '" + schema + "' ORDER BY ordinal_position ASC"
    print(sql)
    conn = None
    if bedrock_connection["type"] == "postgresql":
        try:
            conn = psycopg2.connect(
                host=bedrock_connection["host"],
                database=bedrock_connection["database"],
                user=bedrock_connection["username"],
                password=bedrock_connection["password"]
            )
            cur = conn.cursor()
            cur.execute(sql)
            res = cur.fetchall()
            blueprint = {
                "name": blueprint_name,
                "description": "TBD",
                "columns": columns_from_pg_table(res)
            }
            cur.close()
            conn.commit()
            conn.close()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
    else:
        print("Connection type " + bedrock_connection["type"] + " not yet implemented")
    
    print(json.dumps(blueprint, indent=4))