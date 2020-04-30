#In progress ... don't beat me up yet.
import boto3
import json
s3 = boto3.client('s3')
objs = s3.list_objects_v2(Bucket='managed-data-assets-dev')['Contents']
dependency_map = {}
for obj in objs:
    path = obj['Key'].split('/')
    if (len(path) > 1 and (path[-2] + '.json' == path[-1])):
        # This is the configuration file for the asset
        s3.download_file('managed-data-assets-dev', obj['Key'], './x.json')
        with open('x.json', 'r') as f:
            config = json.load(f)
            if (config['active']):
                dependency_map[config['name']] = {
                    'name': config['name'],
                    'depends': config['depends'],
                    'path': obj['Key']
                }
print(dependency_map)
