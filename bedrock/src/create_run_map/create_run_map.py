  
#!/usr/bin/env python3
import boto3
import os
import json
from toposort import toposort

def create_run_map_function(bucket_name, run_group):
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')
    s3 = boto3.client('s3')
    downloaded_file = WORKINGDIR + '/all_assets.json'
    s3.download_file(bucket_name, 'run/all_assets.json', downloaded_file)
    with open(downloaded_file, 'r') as file_content:
        all_assets = json.load(file_content)
    os.remove(downloaded_file)
    dependency_map = {}
    for key, asset in all_assets.items():   # Ought to be a more pythonic approach using filter() and lambda, but punting for now
        if (asset['run_group'] == run_group):
            dependency_map[key] = {a for a in asset['depends']}

    return list(toposort(dependency_map))
