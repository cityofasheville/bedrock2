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

def get_active_asset_maps(bucket_name, prefix, s3, working_directory):
    objs = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)['Contents']

    run_groups = {}
    rg_list = []
    all_assets = {}
    grouped_assets = {}
    dependency_map = {} # { asset: {deps}}
    grouped_dep_map = {} # { rungrp: { asset: {deps}}}
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
            # This is the etl file for the asset - put in correct run group
            s3.download_file(bucket_name, obj['Key'], tmpfilepath)
            with open(tmpfilepath, 'r') as f:
                etl = json.load(f)
                asset_name = path[-2]
                asset_run_group = etl['run_group']
                run_groups.update({ asset_name: asset_run_group })
    os.remove(tmpfilepath)

    # Group assets and dependencies by Run Group
    for asset, dependency_list in dependency_map.items():
        rg = run_groups[asset]
        if (rg in rg_list):
            grouped_dep_map[rg].update({asset: dependency_list})
            grouped_assets[rg].update({asset: all_assets[asset]})
        else:
            rg_list.append(rg)
            grouped_dep_map.update({rg: {asset: dependency_list}})
            grouped_assets.update({rg: {asset: all_assets[asset]}})

    return grouped_assets, grouped_dep_map

def compute_run_order(dependency_map):
    return list(toposort(dependency_map))

def lambda_handler(event, context):
    BUCKETNAME = os.getenv('bedrock_bucketname')
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')
    s3 = boto3.client('s3')
    print('Load the asset maps')
    grouped_assets, grouped_dependency_map = get_active_asset_maps(
        BUCKETNAME, 'store/assets', s3, WORKINGDIR)
    
    print('Compute run order and write files')
    for rungrp in grouped_dependency_map:
        run_map = { 'assets': grouped_assets[rungrp], 'run_order': compute_run_order(grouped_dependency_map[rungrp]) }
        assetmap_filepath = WORKINGDIR + '/' + rungrp + '.json'
        s3_filepath = 'run/' + rungrp + '.json'
        with open(assetmap_filepath, 'w') as f:
            f.write(json.dumps(run_map, default=convert_set_to_list))

        print('Upload to S3: ' + s3_filepath)
        # s3.upload_file(Filename = assetmap_filepath, Bucket=BUCKETNAME, Key=s3_filepath)
        # os.remove(assetmap_filepath)

    return {
        'statusCode': 200,
        'body': json.dumps('Updated run map')
    }

lambda_handler(None, None)
