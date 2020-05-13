#!/usr/bin/env python3
import boto3
import os
import json
from toposort import toposort

# To Do - Need to write some tests

def convert_set_to_list(obj): # Function to convert sets to lists for JSON dump
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

def get_active_asset_maps(bucket_name, prefix, s3, working_directory, run_group):
    objs = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)['Contents']

    is_in_run_group = []
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
        elif (len(path) > 1 and (path[-2] + '.etl.json' == path[-1])):
            # This is the etl file for the asset - verify in run group
            s3.download_file(bucket_name, obj['Key'], tmpfilepath)
            with open(tmpfilepath, 'r') as f:
                etl = json.load(f)
                if ( etl['run_group'] == run_group):
                    is_in_run_group.append(path[2])
    os.remove(tmpfilepath)
    # use dictionary comprehensions to filter for just this Run Group
    all_assets_in_run_group = { asset: all_assets[asset] for asset in is_in_run_group }
    dependency_map_in_run_group = { asset: dependency_map[asset] for asset in is_in_run_group }


    # result = [x for x in list_a if x[0] in list_b]
    return all_assets_in_run_group, dependency_map_in_run_group

def compute_run_order(dependency_map):
    return list(toposort(dependency_map))



def lambda_handler(event, context):
    run_group = "daily" # Hard coded to test, will be passed in
    BUCKETNAME = os.getenv('bedrock_bucketname') #export bedrock_bucketname=managed-data-assets-dev
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')
    s3 = boto3.client('s3')
    print('Load the asset maps')
    all_assets, dependency_map = get_active_asset_maps(BUCKETNAME, 'store/assets', s3, WORKINGDIR, run_group) #'assets' in prod?
    
    print('Compute run order and dump')
    run_map = { 'assets': all_assets, 'run_order': compute_run_order(dependency_map) }
    assetmap_filepath = WORKINGDIR + '/' + run_group + '.json'
    s3_filepath = 'run/' + run_group + '.json'
    with open(assetmap_filepath, 'w') as f:
        f.write(json.dumps(run_map, default=convert_set_to_list))

    print('Upload to S3 and clean up')
    s3.upload_file(Filename = assetmap_filepath, Bucket=BUCKETNAME, Key=s3_filepath)
    os.remove(assetmap_filepath)

    return {
        'statusCode': 200,
        'body': json.dumps('Updated run map')
    }

lambda_handler(None, None)
