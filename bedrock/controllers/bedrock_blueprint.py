from cement import Controller, ex
import os
import boto3
import botocore
import json
import sys
import psycopg2

def list_print(a):
    ll = len(a)
    i = 0
    s = "     "
    for itm in a:
        if i == ll-1:
            s = s + itm
        else:
            s = s + itm + ",  "
        i = i + 1
        if i > 0 and i%5 == 0:
            s = s + "\n     "
    print(s)

def get_blueprints(s3, bucket_name, prefix):
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
        s3.download_file(bucket_name, prefix+"bedrock_connections.json", tmpfilepath)
        with open(tmpfilepath, "r") as file_content:
            connections = json.load(file_content)
        os.remove(tmpfilepath)
        if self.app.pargs.connection is None or self.app.pargs.connection not in connections:
            print("A connection name is required. Must be one of the following:")
            list_print(list(connections.keys()))
            return -1
        connection = connections[self.app.pargs.connection]

        # Download the blueprint
        blueprint_name = self.app.pargs.blueprint
        blueprint = None
        if blueprint_name is not None:
            blueprint = get_blueprint(s3, bucket_name, "store/blueprints/" + blueprint_name + ".json", tmpfilepath)
        if blueprint is None:
            blueprints = get_blueprints(s3, bucket_name, "store/blueprints/")
            print("Blue print " + (blueprint_name if blueprint_name is not None else "")  + " not found. Must be one of the following:")
            list_print(blueprints)
            return -1

        if self.app.pargs.table is None or len(self.app.pargs.table.split(".")) != 2:
            print("A table name of the form SCHEMA.TABLENAME is required - exiting")
            return -1

        conn = None
        try:
            conn = psycopg2.connect(
                host=connection["host"],
                database=connection["database"],
                user=connection["username"],
                password=connection["password"]
            )
            cur = conn.cursor()
            sql = """
                CREATE TABLE internal2.ejtmp (
                    employee_name VARCHAR(67),
                    employee_id INTEGER NOT NULL
                )
                """
            print("SQL is " + sql)
            cur.execute(sql)
            cur.close()
            conn.commit()
            conn.close()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
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