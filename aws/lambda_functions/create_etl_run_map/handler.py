  #!/usr/bin/env python3
import boto3
import os
import json
from toposort import toposort
from datetime import timedelta
import datetime
from pyawscron import AWSCron
from zoneinfo import ZoneInfo

utc = ZoneInfo('UTC')
localtz = ZoneInfo('America/New_York')
dynamodb = boto3.resource('dynamodb')

# This parameter sets the time interval that this code with cover.
# !!! MAKE SURE THIS MATCHES EVENTBRIDGE RULE
TIME_INTERVAL = 15

def create_run_map_function(bucket_name, run_group=None):
    WORKINGDIR = '/tmp'
    s3 = boto3.client('s3', region_name='us-east-1')
    downloaded_file = WORKINGDIR + '/all_assets.json'
    s3.download_file(bucket_name, 'run/all_assets.json', downloaded_file)
    with open(downloaded_file, 'r') as file_content:
        all_assets = json.load(file_content)
    os.remove(downloaded_file)
    dependency_map = {}

    if run_group == None:
        my_date = process_date()
        my_date = rounder(my_date)
        data = get_table()
        final_list = get_rungroup_matches(data, my_date)
        for key, asset in all_assets.items():  # Ought to be a more pythonic approach using filter() and lambda, but punting for now
            if (asset['run_group'] in final_list): 
                dependency_map[key] = {a for a in asset['depends']}
    else:
        for key, asset in all_assets.items():  # Ought to be a more pythonic approach using filter() and lambda, but punting for now
            if (asset['run_group'] ==run_group): 
                dependency_map[key] = {a for a in asset['depends']}

    runsets= list(toposort(dependency_map))
    runs = []
    while runsets: #process each runset
        runset = runsets.pop(0)
        items = []
        while runset: # Process each job in the runset
            item = runset.pop() # Warning - this is a Set pop, not a List pop
            items.append(all_assets[item])
        runs.append(items)
    result = { 'RunSetIsGo': False }
    if len(runs) > 0:
        result['runsets'] = runs
#        result['next'] = runs.pop()
#        result['remainder'] = runs
        result['RunSetIsGo'] = True
        result['success'] = []
        result['skipped'] = []
        result['failure'] = []
        result['results'] = None
#        result['all_assets'] = all_assets
    return result    


def process_date():
    #create datetime object, convert to utc
    dt = datetime.datetime.now()
    #dt = datetime.datetime.strptime("09/09/22 1:58", "%d/%m/%y %H:%M")
    dt.replace(tzinfo=localtz)
    utctime = dt.astimezone(utc)
    return(utctime)


def rounder(t):
    # Rounds to nearest N minutes
    return (t.replace(second=0, microsecond=0, minute=0, hour=t.hour)
               +timedelta(minutes=(round(t.minute/TIME_INTERVAL)*TIME_INTERVAL)))


def get_table():
    #grab table from dynamodb
    table = dynamodb.Table('rungroup_table')
    response = table.scan()
    data = response['Items']

    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        data.extend(response['Items'])
    return(data)


def get_rungroup_matches(data, date):
    #creates N min time range, goes through the crons and see if they fall within in
    matchList = []
    for entry in data:
        cron = entry['cron']
        # the timezone is already utc, but for some reason it's not working unless I replace it below
        start_date = date.replace(tzinfo=datetime.timezone.utc)
        end_date = start_date + timedelta(minutes=(TIME_INTERVAL-1), seconds = 59)
        matches = AWSCron.get_all_schedule_bw_dates(start_date, end_date, cron)
        if matches != []:
            matchList.append(entry['key'])
    return(matchList)


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
#-------------------------------------------------
