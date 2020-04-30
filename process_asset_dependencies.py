#In progress ... don't beat me up yet.
import boto3
import os
import json
from toposort import toposort

BUCKETNAME = os.getenv('bedrock_bucketname')
WORKINGDIR = os.getenv('bedrock_workingdir', '.')

s3 = boto3.client('s3')
objs = s3.list_objects_v2(Bucket=BUCKETNAME)['Contents']
all_assets = {}
dependency_map = {}
for obj in objs:
    path = obj['Key'].split('/')
    if (len(path) > 1 and (path[-2] + '.json' == path[-1])):
        # This is the configuration file for the asset
        filepath = WORKINGDIR+'/tmp.json'
        s3.download_file('managed-data-assets-dev', obj['Key'], filepath)
        with open(filepath, 'r') as f:
            config = json.load(f)
            if (config['active']):
                all_assets[config['name']] = {
                    'name': config['name'],
                    'depends': config['depends'],
                    'path': obj['Key']
                }
                dependency_map[config['name']] = {i for i in config['depends']}
print('All Assets')
print(all_assets)
print('Dependency Map')
print(dependency_map)
print('Sorted Dependencies')
print(list(toposort(dependency_map)))
