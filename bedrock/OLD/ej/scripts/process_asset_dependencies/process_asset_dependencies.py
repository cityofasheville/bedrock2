import boto3
import os
import json
from toposort import toposort

# To Do - Need to write some tests


def convert_set_to_list(obj): # Function to convert sets to lists for JSON dump
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

def get_active_asset_maps(bucket_name, prefix, s3, working_directory):
    objs = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)['Contents']

    all_assets = {}
    dependency_map = {}
    tmpfilepath = working_directory + '/tmp.json'

    # Get dependency and location information for all active assets
    for obj in objs:
        path = obj['Key'].split('/')
        if (len(path) > 1 and (path[-2] + '.json' == path[-1])):
            # This is the configuration file for the asset
            s3.download_file(bucket_name, obj['Key'], tmpfilepath)
            with open(tmpfilepath, 'r') as f:
                config = json.load(f)
                if (config['active']):
                    all_assets[config['name']] = {
                        'name': config['name'],
                        'depends': config['depends'],
                        'path': obj['Key']
                    }
                    dependency_map[config['name']] = {i for i in config['depends']}
    
    os.remove(tmpfilepath)
   
    return all_assets, dependency_map

def compute_run_order(dependency_map):
    return list(toposort(dependency_map))



def lambda_handler(event, context):
    BUCKETNAME = os.getenv('bedrock_bucketname')
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')
    s3 = boto3.client('s3')
    print('Load the asset maps')
    all_assets, dependency_map = get_active_asset_maps(BUCKETNAME, 'store/assets', s3, WORKINGDIR)
    
    print('Compute run order and dump')
    run_map = { 'assets': all_assets, 'run_order': compute_run_order(dependency_map) }
    with open(WORKINGDIR + '/asset_map.json', 'w') as f:
        f.write(json.dumps(run_map, default=convert_set_to_list))

    print('Upload to S3 and clean up')
    s3.upload_file(Filename = WORKINGDIR + '/asset_map.json', Bucket=BUCKETNAME, Key='run/asset_map.json')
    os.remove(WORKINGDIR + '/asset_map.json')

    return {
        'statusCode': 200,
        'body': json.dumps('Updated run map')
    }

lambda_handler(None, None)
