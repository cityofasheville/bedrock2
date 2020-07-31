#!/usr/bin/env python3
import boto3
import os
import json

def lambda_handler(event, context):
    print(json.dumps(event))
    output = event['input']
    ret_val = {}
    output['JobGo'] = False
    # Check status, integrate output, set JobGo if more to do.
    task_result = output.pop('TaskOutput')
    task_index = output['TaskIndex']
    if task_result['statusCode'] == 200:
        ret_val['statusCode'] = 200
        n_tasks = len(output['ETLJob']['etl_tasks'])
        print('Length is ' + str(n_tasks) + ' and index is ' + str(task_index))
        if task_index < n_tasks - 1:
            output['JobGo'] = True
    else:
        ret_val['statusCode'] = task_result['statusCode']
    output['ETLJob']['etl_tasks'][task_index]['result'] = task_result
    ret_val['body'] = output
    return ret_val
