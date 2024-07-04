import boto3
import json
import io
import os
import datetime
from copy_s3 import download_s3, upload_s3
from copy_ftp import put_ftp, get_ftp
from copy_win import put_win, get_win

region_name = "us-east-1"  # for secrets manager

# Convert file_${YYYY}${MM}${DD}.csv to file_20220721.csv (current date)
# If dateadjustment is defined, it will add or subtract days from the current date
def fillDateTemplate(filename, dateadjustment = 0):
    filename = filename.replace('${','{')
    now = datetime.datetime.now() + datetime.timedelta(days = dateadjustment)
    year = now.year
    month = now.strftime("%m")
    day = now.strftime("%d")
    hour = now.strftime("%H")
    minute = now.strftime("%M")
    second = now.strftime("%S")
    return (filename.format(YYYY=year,MM=month,DD=day,HH=hour,mm=minute,SS=second))


def getConnection(secret_name):  # Look up secrets in Secrets Manager
    try:
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=region_name,
        )
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
        results = json.loads(get_secret_value_response['SecretString'])
        return results
    except BaseException as err:
        raise Exception("Connection Secret Error: " + str(err))

def lambda_handler(event, context):
    try:
        taskindex = event["TaskIndex"]
        etl = event["ETLJob"]["etl_tasks"][taskindex]
        if not etl["active"]:
            return {
                'statusCode': 200,
                'body': "Inactive: skipped"
            }
        tempfile = fillDateTemplate('/tmp/temp${YYYY}${MM}${DD}${HH}${mm}${SS}.txt') 

        locations = [
          { "name": 'source_location', "tempfile": tempfile },
          { "name": 'target_location', "tempfile": tempfile }
        ]

        for loc in locations:
            print('Do a loc = ', loc)
            location = etl[loc["name"]]
            dateadjustment = location.get('adjustdate', 0)
            loc["connection_data"] = getConnection(location["connection"])
            if (not location["filename"].startswith("/")):
                # Date interpolation is not compatible with pattern-matching
                loc["filename"] = fillDateTemplate(location["filename"], dateadjustment)
            else:
                loc["filename"] = location["filename"]
            loc["path"] = fillDateTemplate(location["path"], dateadjustment)
            loc["connection"] = location["connection"]
            loc["config"] = {}
            if ("config" in location):
                print("CONFIG!")
                loc["config"] = location["config"]
            print("Configuration is ", loc["config"])

        source_location = locations[0]
        if source_location["connection_data"]["type"] == "s3":
            download_s3(source_location)
        elif source_location["connection_data"]["type"] == "sftp":
            get_ftp(source_location)
        elif source_location["connection_data"]["type"] == "win":
            get_win(source_location)
        else:
            raise Exception("Invalid file copy connection type " + source_location["connection_data"]["type"])
        
        target_location = locations[1]
        if target_location["connection_data"]["type"] == "s3":
            upload_s3(target_location)
        elif target_location["connection_data"]["type"] == "sftp":
            put_ftp(target_location)
        elif target_location["connection_data"]["type"] == "win":
            put_win(target_location)
        else:
            raise Exception("Invalid file copy connection type " + target_location["connection_data"]["type"])
            
        if os.path.exists(tempfile):
                os.remove(tempfile)

        retmsg = ('File uploaded to ' +
            target_location["connection_data"]["type"] + ': ' +
            target_location["connection"] + ' ' + target_location["filename"]) 

        return {
            'statusCode': 200,
            'body': retmsg
        }
    except BaseException as err:
        print(str(err))
        return {
            'statusCode': 500,
            'body': str(err)
        }


