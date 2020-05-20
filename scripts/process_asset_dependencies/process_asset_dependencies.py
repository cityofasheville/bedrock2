#!/usr/bin/env python3
import boto3
import os
import json
from toposort import toposort

# To Do - Need to write some tests

def convert_set_to_list(obj): 
    """Function to convert sets to lists for JSON dump"""
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

def compute_run_order(dependency_map):
    return list(toposort(dependency_map))

def download_files(bucket_name, prefix, s3, working_directory):
    """ Get all asset and etl files from S3 """
    file_data = {'assets': {},'etl': {}}
    tmpfilepath = working_directory + '/tmp.json'

    objs = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)['Contents']

    for obj in objs:
        path = obj['Key'].split('/')
        if (len(path) > 1 and ( (path[-2] + '.json' == path[-1]) or (path[-2] + '.etl.json' == path[-1])) ):
            s3.download_file(bucket_name, obj['Key'], tmpfilepath)
            with open(tmpfilepath, 'r') as file_content:
                if path[-1][-9:] == '.etl.json':
                    file_data['etl'].update({path[-2]: json.load(file_content)})    # ETL file
                else:
                    file_data['assets'].update({path[-2]: {'path': obj['Key'], 'file': json.load(file_content)}})    # Asset configuration file
    os.remove(tmpfilepath)
    return file_data


def get_active_asset_maps(file_data):
    """ Create list of assets by group and map of dependencies for active assets """
    run_groups = {} # { asset: rungrp }
    all_assets = {}
    rg_list = [] # [ rungrp ]
    grouped_assets = {}  # { rungrp: { asset: {name dep uniq path}}}

    for asset in file_data['assets']:
        config = file_data['assets'][asset]
        if (config['file']['active']):
            all_assets[asset] = {
                'name': config['file']['name'],
                'depends': config['file']['depends'],
                'path': config['path'] }
    for etl in file_data['etl']:
        config = file_data['etl'][etl]
        #asset_name = etl.split('/')[-1]
        asset_run_group = config['run_group']
        run_groups.update({ etl: asset_run_group })

    # Group assets and dependencies by Run Group
    for asset in all_assets:
        rg = run_groups[asset]
        if (rg in rg_list):
            grouped_assets[rg].update({asset: all_assets[asset]})
        else:
            rg_list.append(rg)
            grouped_assets.update({rg: {asset: all_assets[asset]}})

    return grouped_assets


def write_map_files(grouped_assets, bucket_name, prefix, s3, working_directory):
    """Compute run order and write files"""
    print('Compute run order and write files')
    for rungrp in grouped_assets:
        dependency_map = {}
        for asset in grouped_assets[rungrp]:
            dependency_map[asset] = {i for i in grouped_assets[rungrp][asset]['depends']} 
        run_map = { 'assets': grouped_assets[rungrp], 
                    'run_order': compute_run_order(dependency_map) }
        assetmap_filepath = working_directory + '/' + rungrp + '.json'
        s3_filepath = prefix + '/' + rungrp + '.json'
        with open(assetmap_filepath, 'w') as f:
            f.write(json.dumps(run_map, default=convert_set_to_list))

        print('Upload to S3: ' + s3_filepath)
        # s3.upload_file(Filename = assetmap_filepath, Bucket=bucket_name, Key=s3_filepath)
        # os.remove(assetmap_filepath)    


def lambda_handler(event, context):
    BUCKETNAME = os.getenv('bedrock_bucketname')
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')
    s3 = boto3.client('s3')

    print('Load the asset maps')
    file_data = download_files(BUCKETNAME, 'store/assets', s3, WORKINGDIR)
    grouped_assets = get_active_asset_maps(file_data)
    write_map_files(grouped_assets, BUCKETNAME, 'run', s3, WORKINGDIR)

    return {
        'statusCode': 200,
        'body': json.dumps('Updated run map')
    }

lambda_handler(None, None)
