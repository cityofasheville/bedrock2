import boto3
import os
import json
from toposort import toposort

BUCKETNAME = os.getenv('bedrock_bucketname')
WORKINGDIR = os.getenv('bedrock_workingdir', '.')

def convert_set_to_list(obj): # Function to convert sets to lists for JSON dump
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

all_assets = {}
dependency_map = {}
tmpfilepath = WORKINGDIR+'/tmp.json'

s3 = boto3.client('s3')

# Get dependency and location information for all active assets
objs = s3.list_objects_v2(Bucket=BUCKETNAME, Prefix='store/assets')['Contents']
for obj in objs:
    path = obj['Key'].split('/')
    if (len(path) > 1 and (path[-2] + '.json' == path[-1])):
        # This is the configuration file for the asset
        s3.download_file('managed-data-assets-dev', obj['Key'], tmpfilepath)
        with open(tmpfilepath, 'r') as f:
            config = json.load(f)
            if (config['active']):
                all_assets[config['name']] = {
                    'name': config['name'],
                    'depends': config['depends'],
                    'path': obj['Key']
                }
                dependency_map[config['name']] = {i for i in config['depends']}

# Figure out the run order, put it all together, and upload to S3. The run order
# is an list of sets: members of a given set can be run in any order, but following
# sets depend on prior ones.
run_map = { 'assets': all_assets, 'run_order': list(toposort(dependency_map)) }
with open(WORKINGDIR + '/asset_map.json', 'w') as f:
    f.write(json.dumps(run_map, default=convert_set_to_list))

s3.upload_file(Filename = WORKINGDIR + '/asset_map.json', Bucket=BUCKETNAME, Key='run/asset_map.json')

# And clean up
os.remove(tmpfilepath)
os.remove(WORKINGDIR + '/asset_map.json')