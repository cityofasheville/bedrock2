import boto3
import botocore
import os
import json

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

def sql_column(col, is_last):
    if(col["type"] == "string"):
        if "length" in col and col["length"] > 0:
            res = col["name"] + " VARCHAR(" + str(col["length"])+")"
        else:
            res = col["name"] + " TEXT"
    else:
        return ""

    if not is_last:
        res = res + ",\n"
    return res



def create_table_from_blueprint(blueprint, table_name):
    sql = "CREATE TABLE " + table_name + " ("
    for i in range(len(blueprint["columns"])):
        is_last = (i == len(blueprint['columns']) - 1)
        print("is_last = " + str(is_last))
        sql = sql + sql_column(blueprint["columns"][i], is_last)
    sql = sql + " )"
    print("SQL is " + sql)
    return sql
