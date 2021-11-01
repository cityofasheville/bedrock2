import os
import boto3
import botocore
import json
import sys
import getopt

from utilities.connections import get_connection
from utilities.sql import execute_sql_statement
from utilities.construct_sql import sql_column
from utilities.print import print_list_in_columns
from utilities.constants import BLUEPRINTS_PREFIX

def list_blueprints(s3, bucket_name, prefix):
    objs = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)["Contents"]
    blist = []
    for obj in objs:
        nm = obj["Key"].split("/")[-1] # Remove the leading directories
        blist.append(nm[0:-5]) # Remove the trailing .json
    return blist

def create_table_from_blueprint(blueprint, table_name, dbtype = "postgresql"):
    if dbtype != "postgresql":
        raise Exception("create_table_from_blueprint: " + dbtype + " not yet implemented")
    sql = "CREATE TABLE " + table_name + " ("
    for i in range(len(blueprint["columns"])):
        is_last = (i == len(blueprint['columns']) - 1)
        sql = sql + sql_column(blueprint["columns"][i], is_last, dbtype)
    sql = sql + " )"
    return sql

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

def create_table(blueprint_name, bucket_name, connection_name, table):
    s3 = boto3.client("s3")
    tmpfilepath = os.getenv("BEDROCK_TMPFILE_DIR", ".") + "/" + os.getenv("BEDROCK_TMPFILE_NAME", "tmp.json")
    blueprint = None

    connection = get_connection(connection_name, bucket_name, s3, tmpfilepath)

    # Download the blueprint
    blueprint = get_blueprint(blueprint_name, bucket_name, s3, tmpfilepath)
    if blueprint == None:
        return -1

    sql = create_table_from_blueprint(blueprint, table, connection["type"])
    print('Execute the sql')
    print(sql)
    execute_sql_statement(connection, sql)

def usage():
    print('  Usage:  create_table_from_blueprint [-b|--bucket bucketname] [-h|--help] blueprint_name table_name')
    print('    The table name should be of the form SCHEMA.TABLENAME')

# Create a database table based on a blueprint

bucket_name = os.getenv("BEDROCK_BUCKETNAME")
connection_name = None

try: 
    opts, args = getopt.getopt(sys.argv[1:], "hb:c:", ["connection=", "bucket=", "help"])
except getopt.GetoptError as err:
    print(err)
    usage()
    sys.exit(2)

for opt, arg in opts:
    if opt in ("-h", "--help"):
        usage()
        sys.exit(0)
    elif opt in ("-c", "--connection"):
        connection_name = arg
    elif opt in ("-b", "--bucket"):
        bucket_name = arg

if bucket_name is None:
    print("You must specify a bucket name via the -b/--bucket option or the BEDROCK_BUCKETNAME environment variable")
    usage()
    sys.exit(2)

if connection_name is None:
    print("You must specify a connection name via the -c/--connection option")
    usage()
    sys.exit(2)


if len(args) < 2:
    usage()
    sys.exit(2)

blueprint_name = args[0]
table_name = args[1]

create_table(blueprint_name, bucket_name, connection_name, table_name)
