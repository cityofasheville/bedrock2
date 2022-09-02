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


def create_run_map_function(bucket_name, run_group=None, time=None):
    WORKINGDIR = '.'
    s3 = boto3.client('s3', region_name='us-east-1')
    downloaded_file = WORKINGDIR + '/all_assets.json'
    s3.download_file(bucket_name, 'run/all_assets.json', downloaded_file)
    with open(downloaded_file, 'r') as file_content:
        all_assets = json.load(file_content)
    os.remove(downloaded_file)
    dependency_map = {}

    if run_group==None: #if no rungroup specified, function checks time and compares with cron expressions
        if time==None: #if no time specified, function takes current time
            my_date = rounder(datetime.datetime.now())
        else:
            my_date = process_date(time)
            my_date = rounder(my_date)
        data = get_table()
        final_list = get_rungroup_matches(data, my_date)
        for key, asset in all_assets.items():  # Ought to be a more pythonic approach using filter() and lambda, but punting for now
            if (asset['run_group'] in final_list): #This code repeats below, but I'm not making it a function since we'll eventually be deleting that when we move to calling this lambda every 15 min
                dependency_map[key] = {a for a in asset['depends']}
    
    else:
        for key, asset in all_assets.items():   # Ought to be a more pythonic approach using filter() and lambda, but punting for now
            if (asset['run_group'] == run_group):
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


def process_date(date):
    #create datetime object, convert to utc
    dt = datetime.datetime.strptime(date, "%d/%m/%y %H:%M")
    dt.replace(tzinfo=localtz)
    utctime = dt.astimezone(utc)
    return(utctime)


def rounder(t):
    # Rounds to nearest 15 minutes
    return (t.replace(second=0, microsecond=0, minute=0, hour=t.hour)
               +timedelta(minutes=(round(t.minute/15)*15)))


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
    #creates 15 min time range, goes through the crons and see if they fall within in
    matchList = []
    for entry in data:
        cron = entry['cron']
        # the timezone is already utc, but for some reason it's not working unless I replace it below
        start_date = date.replace(tzinfo=datetime.timezone.utc)
        end_date = start_date + timedelta(minutes=14)
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


