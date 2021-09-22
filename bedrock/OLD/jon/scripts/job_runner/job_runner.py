#!/usr/bin/env python3
import boto3
import os
import json
from toposort import toposort

# To Do - Need to write some tests

def get_etl_file(bucket_name, prefix, s3, working_directory, asset_name):

    etl_filename = asset_name + '.etl.json'
    tmpfilepath = working_directory + '/' + etl_filename

    s3.download_file(bucket_name, etl_filename, tmpfilepath)
    with open(tmpfilepath, 'r') as f:
        etl_data = json.load(f)
    
    os.remove(tmpfilepath)
   
    return etl_data


def lambda_handler(event, context):
    asset_name='coa_bc_address_master' # Hard code for test: This will be passed in
    BUCKETNAME = os.getenv('bedrock_bucketname') #managed-data-assets-dev
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')
    s3 = boto3.client('s3')
    print('Load the etl file')
    etl_data_list = get_etl_file(BUCKETNAME, 'store/assets', s3, WORKINGDIR, asset_name) #'assets' in prod?
    
    print('Dump to file')
    with open(WORKINGDIR + '/' + asset_name + '.etl.json', 'w') as f:
        f.write(json.dumps(etl_data_list))

    # TODO process file

    return {
        'statusCode': 200,
        'body': json.dumps('Updated run map')
    }

lambda_handler(None, None)
