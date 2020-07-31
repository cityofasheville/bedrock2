  #!/usr/bin/env python3
import boto3
import os
import json
from toposort import toposort

def create_run_map_function(bucket_name, run_group):
    WORKINGDIR = '/tmp'
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

    runsets= list(toposort(dependency_map))
    runs = []
    while runsets: #process each runset
        runset = runsets.pop()
        items = []
        while runset: # Process each job in the runset
            item = runset.pop()
            items.append(all_assets[item])
        runs.append(items)

    result = {}
    if len(runs) > 0:
        result['next'] = runs.pop()
        result['remainder'] = runs
        result['go'] = True
        result['success'] = []
        result['skipped'] = []
        result['failure'] = []
#        result['all_assets'] = all_assets
    return result    

def convert_set_to_list(obj): # Function to convert sets to lists for JSON dump
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

def lambda_handler(event, context):
    result = create_run_map_function(event['s3bucket'], event['rungroup'])
    return {
        'statusCode': 200,
        'body': json.loads(json.dumps(result, default=convert_set_to_list))
    }
