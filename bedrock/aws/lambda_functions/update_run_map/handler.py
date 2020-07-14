  
#!/usr/bin/env python3
import boto3
import os
import json

def lambda_handler(event, context):
    print('I am in update_run_map')
    print(json.dumps(event))
    return {
        'statusCode': 200,
        'body': {
            "lambda_output": "Gonna get there some day"
        }
    }
