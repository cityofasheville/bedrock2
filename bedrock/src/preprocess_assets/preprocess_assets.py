import boto3
import os
import json

def download_files(bucket_name, prefix, s3, working_directory):
    """ Get all asset and etl files from S3 """
    print("Download asset and etl files from S3")
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

def prepare_assets(file_data):
    print("Create map of assets and dependencies for active assets")
    all_assets = {}

    for asset in file_data['assets']:
        config = file_data['assets'][asset]
        if (config['file']['active']):
            etl = { 'run_group': None, 'tasks': [] }
            if (asset in file_data['etl']):
                etl = file_data['etl'][asset]
            all_assets[asset] = {
                'name': config['file']['name'],
                'depends': config['file']['depends'],
                'path': config['path'],
                'run_group': etl['run_group'],
                'etl_tasks': etl['tasks'] }
    return all_assets  

def write_asset_map(all_assets, bucket_name, prefix, s3, working_directory):
    """ Write asset map back out to S3 """
    print('Write asset map back out to S3')
    assets_filepath = working_directory + '/' + 'all_assets.json'
    s3_filepath = prefix + '/'  + 'all_assets.json'

    with open(assets_filepath, 'w') as f:
        f.write(json.dumps(all_assets))
    s3.upload_file(Filename = assets_filepath, Bucket=bucket_name, Key=s3_filepath)
    os.remove(assets_filepath)    

def preprocess_assets_in_s3(bucket_name, output_mode='s3'):
    print('Bucket name is ', bucket_name)
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')
    s3 = boto3.client('s3')
    return_value = 'Done'

    print('Download the asset information')
    file_data = download_files(bucket_name, 'assets', s3, WORKINGDIR)   # 'store/assets'
    all_assets = prepare_assets(file_data)
    if (output_mode == 's3'):
        write_asset_map(all_assets, bucket_name, 'run', s3, WORKINGDIR)
    else:
        return_value = all_assets

    return return_value
