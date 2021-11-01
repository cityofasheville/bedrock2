import os
import boto3
import json
import sys
import getopt

from utilities.construct_sql import get_table_info_sql
from utilities.connections import get_connection
from utilities.types import ss_types, pg_types
from utilities.sql import execute_sql_statement_with_return

def blueprint_columns_from_table(db_type, cdefs):
    if db_type == "postgresql":
        typemap = pg_types
    elif db_type == "sqlserver":
        typemap = ss_types
    else:
        raise Exception("blueprint_columns_from_table: unknown database type " + db_type)

    columns = []
    for i in range(len(cdefs)):
        name, nullable, in_type, in_length, in_precision, in_radix, in_scale, ord = cdefs[i]
        col = {
            "name": name,
            "description": "TBD",
            "type": None,
        }
        if in_type not in typemap:
            raise Exception("ERROR: Unknown column type " + in_type + " for column " + name)
        col["type"] = typemap[in_type]["bedrock_type"]
        if "length" in typemap[in_type]:
            col["length"] = typemap[in_type]["length"]
        if nullable == "NO":
            col["nullable"] = False
        if in_type in ("character varying", "character", "varchar"):
            col["length"] = in_length
        if in_type == "numeric":
            col["precision"] = str(in_precision) + "," + str(in_scale)
        if col["type"] == "real" and "length" not in col:
            col["length"] = 8
            if "precision" in col and col["precision"] <= 24:
                col["length"] = 4
            
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
        "columns": blueprint_columns_from_table(bedrock_connection["type"], res)
    }
    return blueprint

def usage():
    print('  Usage:  create_blueprint [-b|--bucket bucketname] [-h|--help] [-t|--table table_name] blueprint_name')
    print('    The table name should be of the form SCHEMA.TABLENAME')

bucket_name = os.getenv("BEDROCK_BUCKETNAME")
table_name = None
connection_name = None
tmpfilepath = os.getenv("BEDROCK_TMPFILE_DIR", ".") + "/" + os.getenv("BEDROCK_TMPFILE_NAME", "tmp.json")

try: 
    opts, args = getopt.getopt(sys.argv[1:], "hb:c:t:", ["connection=", "bucket=", "table=", "help"])
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
    elif opt in ("-t", "--table"):
        table_name = arg

if table_name is not None:
    if connection_name is None or bucket_name is None:
        print('To base a blueprint on a table, you must specify both a connection and a bucket')

        if connection_name is None:
            print("You must specify a connection name via the -c/--connection option")
            usage()
            sys.exit(2)

        if bucket_name is None:
            print("You must specify a bucket name via the -b/--bucket option or the BEDROCK_BUCKETNAME environment variable")
            usage()
            sys.exit(2)

if len(args) < 1:
    print('Missing blueprint name')
    usage()
    sys.exit(2)

blueprint_name = args[0]

blueprint = {
    "name": blueprint_name,
    "description": "TBD",
    "columns": []
}

if table_name is not None: # Looks like we are deriving from an existing table or view
    s3 = boto3.client("s3")
    connection = get_connection(connection_name, bucket_name, s3, tmpfilepath)
    if connection == None:
        print('Unable to get connection information for ', connection_name)
        sys.exit(2)

    blueprint = create_blueprint_from_table(connection, blueprint_name, table_name)

fname = "./" + blueprint_name + ".1.0.json"
with open(fname, 'w') as f:
    f.write(json.dumps(blueprint, indent = 4)+ "\n")
print("Blueprint written to " + fname)
