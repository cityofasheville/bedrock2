  
#!/usr/bin/env python3
import boto3
import os
import json

def lambda_handler(event, context):
    print(json.dumps(event))
    task = event['task']
    return {
        'statusCode': 404,
        'body': {
            "lambda_output": "Checking task status " + task['type'] + " defined."
        }
    }
