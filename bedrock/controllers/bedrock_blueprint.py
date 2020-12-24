from cement import Controller, ex
import os
import boto3
import json

def list_print(a):
    ll = len(a)
    i = 0
    s = '     '
    for itm in a:
        if i == ll-1:
            s = s + itm
        else:
            s = s + itm + ',  '
        i = i + 1
        if i > 0 and i%5 == 0:
            s = s + '\n     '
    print(s)

def get_blueprints(s3, bucket_name, prefix):
    objs = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)['Contents']
    blist = []
    for obj in objs:
        nm = obj['Key'].split('/')[-1] # Remove the leading directories
        blist.append(nm[0:-5]) # Remove the trailing .json
    return blist

class BedrockBlueprint(Controller):
    class Meta:
        label = 'blueprint'
        stacked_type = 'nested'
        stacked_on = 'base'
    
    @ex(
        help='initialize table based on a blueprint',

        arguments=[
            ### init-table command help
            ( [ '-b', '--blueprint'],
              { 'help': 'blueprint name'} ),
            ( [ '-c', '--connection' ],
              { 'help': 'connection name'} ),
            ( [ '-t', '--table' ],
              { 'help': 'table name in form schema.tablename'} ),
        ],
    )
    def init_table(self):
        bucket_name = os.getenv('BEDROCK_BUCKETNAME')
        prefix = 'run/'
        tmpfilepath = './tmp.json'
        connections = {}
        s3 = boto3.client('s3')

        # Get the list of possible connections, then make sure we have chosen one.
        s3.download_file(bucket_name, prefix+'bedrock_connections.json', tmpfilepath)
        with open(tmpfilepath, 'r') as file_content:
            connections = json.load(file_content)
        os.remove(tmpfilepath)
        if self.app.pargs.connection is None or self.app.pargs.connection not in connections:
            print('A connection name is required. Must be one of the following:')
            list_print(list(connections.keys()))
            return -1

        # Download the blueprint
        if self.app.pargs.blueprint is None:
            print('A blueprint name is required - exiting')
            return -1
        blueprint_name = self.app.pargs.blueprint
        print('The blueprint name is ' + blueprint_name)
        blueprints = get_blueprints(s3, bucket_name, 'store/blueprints/')
        print(blueprints)
        if blueprint_name not in blueprints:
            print('Woah!')

        if self.app.pargs.table is None:
            print('A table name is required - exiting')
            return -1

 
        pass

    
    @ex(
        help='create blueprint',

        arguments=[
            ### preprocess assets command help
            ( [ '-n', '--name' ],
              { 'help' : 'bedrock blueprint create -n NAME: Create a blueprint with name NAME' } ),
        ],
    )
    def create(self):
        print(self.app.pargs)