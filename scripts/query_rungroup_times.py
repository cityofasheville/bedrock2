from tracemalloc import start
import boto3
from datetime import timedelta
import datetime
from pyawscron import AWSCron
from zoneinfo import ZoneInfo
from boto3.dynamodb.conditions import Key

utc = ZoneInfo('UTC')
localtz = ZoneInfo('America/New_York')
dynamodb = boto3.resource('dynamodb')

#this is a script that creates a list of rungroups when given a time
#It was used to edit the create_etl_rungroup lambda function
#I'm preserving the code here as we may use it later to look up rungroups through the api

#---------------------------------------------------------- 

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


#--------------------------------------------------

#myDate = process_date("29/08/22 7:02")
#myDate = rounder(myDate)
#data = get_table()
#finalList = get_rungroup_matches(data, myDate)
#print(finalList)

