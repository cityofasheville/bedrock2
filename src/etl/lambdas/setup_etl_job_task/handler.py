#!/usr/bin/env python3
import boto3
import os
import json

def lambda_handler(event, context):
    print(json.dumps(event))
    result = event
    task_index = 0
    if 'TaskIndex' in event:
        print('TaskIndex is in input')
        task_index = result['TaskIndex'] + 1

    result['TaskIndex'] = task_index
    result['JobType'] = result['ETLJob']['etl_tasks'][task_index]['type']
    return {
        'statusCode': 200,
        'result': result
    }
