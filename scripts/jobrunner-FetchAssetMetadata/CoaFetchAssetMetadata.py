#!/usr/bin/env python3
import boto3
import os
import json
from toposort import toposort

# To Do - Need to write some tests

def get_etl_file(bucket_name, prefix, s3, asset_name, working_directory):

    asset_file_name = asset_name + '.etl.json'
    etl_filename = prefix + '/' + asset_name + '/' + asset_file_name
    assetmap_filepath = working_directory + '/' + asset_file_name
    tmpfilepath = working_directory + '/tmp.json'
    print(bucket_name + '/--/' + etl_filename)
    
    s3.download_file(bucket_name, etl_filename, tmpfilepath)
    with open(assetmap_filepath, 'r') as f:
        etl_data = json.load(f)
    
    os.remove(assetmap_filepath)
   
    # TODO format data
    
    return etl_data


def lambda_handler(event, context):
    asset_name='coa_bc_address_master' # Hard code for test: This will be passed in
    BUCKETNAME = os.getenv('bedrock_bucketname') #managed-data-assets-dev
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')

    s3 = boto3.client('s3')
    print('Load the etl file')

    etl_data_list = get_etl_file(BUCKETNAME, 'store/assets', s3, asset_name, WORKINGDIR)

    for task in etl_data_list['tasks']:
        print(task)
        if task['type'] == 'sql':
            print('sql')
        elif task['type'] == 'table_copy':
            print('table_copy')

    return {
        'statusCode': 200,
        'body': json.dumps('Updated run map')
    }

lambda_handler(None, None)
