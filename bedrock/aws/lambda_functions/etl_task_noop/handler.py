#!/usr/bin/env python3
import boto3
import os
import json

def lambda_handler(event, context):
    print('I am in the run_etl lambda handler')
    print(json.dumps(event))
    task = event
    return {
        'statusCode': 200,
        'body': {
            "lambda_output": "This is a test of " + task['JobType']
        }
    }
