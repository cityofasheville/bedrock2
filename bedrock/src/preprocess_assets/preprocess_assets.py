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

def preprocess_assets_in_s3(msg='Hello, world'):
    print(msg)
    BUCKETNAME = os.getenv('bedrock_bucketname')
    print('Bucket name is ', BUCKETNAME)
    WORKINGDIR = os.getenv('bedrock_workingdir', '.')
    print('Working directory is ', WORKINGDIR)
    s3 = boto3.client('s3')

    print('Download the asset information')
    file_data = download_files(BUCKETNAME, 'store/assets', s3, WORKINGDIR)

    # asset_maps = get_active_asset_maps(file_data)
    # write_map_files(asset_maps, BUCKETNAME, 'run', s3, WORKINGDIR)

    # return {
    #     'statusCode': 200,
    #     'body': json.dumps('Updated run map')
    # }
    return file_data
