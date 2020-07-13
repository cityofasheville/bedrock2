  
#!/usr/bin/env python3
import boto3
import os
import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': {
            "lambda_output": "This is a test"
        }
    }
