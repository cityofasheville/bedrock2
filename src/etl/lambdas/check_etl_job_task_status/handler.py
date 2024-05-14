#!/usr/bin/env python3
import json

def lambda_handler(event, context):
    print(json.dumps(event))
    output = event['input']
    ret_val = {}
    output['JobIsGo'] = False
    task_result = output.pop('TaskOutput')
    task_index = output['TaskIndex']
    # Check status, integrate output, set JobIsGo if more to do.
    if 'Error' in task_result:
        ret_val['statusCode'] = 500
        task_result = {
            "statusCode": 500,
            "body": {
                "lambda_output": "Lambda crash: " +
                task_result['Error'] + task_result['Cause']}
        }
    else:
        if task_result['statusCode'] == 200:
            ret_val['statusCode'] = 200
            n_tasks = len(output['ETLJob']['etl_tasks'])
            print('Length is ' + str(n_tasks) +
                  ' and index is ' + str(task_index))
            if task_index < n_tasks - 1:
                output['JobIsGo'] = True
        else:
            ret_val['statusCode'] = task_result['statusCode']
    output['ETLJob']['etl_tasks'][task_index]['result'] = task_result
    ret_val['body'] = output
    return ret_val
