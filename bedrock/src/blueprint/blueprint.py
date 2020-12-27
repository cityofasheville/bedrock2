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
    for i in range(len(cdefs)):
        name, nullable, type, length, precision, radix, scale, ord = cdefs[i]
        col = {
            "name": name
        }
        print(name, type, length, sep=", ")
    return []

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
    # else:
        # print("Connection type " + bedrock_connection["type"] + " not yet implemented")